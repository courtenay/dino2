import { NextRequest } from 'next/server';

const KUBE_PROXY_URL = process.env.KUBE_PROXY_URL || 'http://localhost:8001';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const namespace = searchParams.get('namespace');
  const pod = searchParams.get('pod');
  const container = searchParams.get('container');
  const tailLines = searchParams.get('tailLines') || '100';
  const follow = searchParams.get('follow') !== 'false';

  // Validate required params
  if (!namespace || !pod || !container) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters: namespace, pod, container' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Build K8s API URL
  const k8sLogUrl = new URL(
    `/api/v1/namespaces/${encodeURIComponent(namespace)}/pods/${encodeURIComponent(pod)}/log`,
    KUBE_PROXY_URL
  );
  k8sLogUrl.searchParams.set('container', container);
  k8sLogUrl.searchParams.set('tailLines', tailLines);
  k8sLogUrl.searchParams.set('follow', String(follow));
  k8sLogUrl.searchParams.set('timestamps', 'true');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(k8sLogUrl.toString(), {
          cache: 'no-store',
        });

        if (!response.ok) {
          const errorText = await response.text();
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: errorText || response.statusText })}\n\n`)
          );
          controller.close();
          return;
        }

        if (!response.body) {
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'No response body' })}\n\n`)
          );
          controller.close();
          return;
        }

        // Send initial connection event
        controller.enqueue(encoder.encode('event: connected\ndata: {}\n\n'));

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim()) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ line })}\n\n`)
              );
            }
          }
        }

        // Process any remaining content in buffer
        if (buffer.trim()) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ line: buffer })}\n\n`)
          );
        }

        controller.enqueue(encoder.encode('event: end\ndata: {}\n\n'));
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
