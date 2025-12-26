import { NextRequest, NextResponse } from 'next/server';

const KUBE_PROXY_URL = process.env.KUBE_PROXY_URL || 'http://localhost:8001';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    namespace: string;
    name: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { namespace, name } = await params;

  if (!namespace || !name) {
    return NextResponse.json(
      { error: 'Missing required parameters: namespace, name' },
      { status: 400 }
    );
  }

  // Rollout restart works by patching the deployment with a restart annotation
  const restartedAt = new Date().toISOString();
  const patchBody = {
    spec: {
      template: {
        metadata: {
          annotations: {
            'kubectl.kubernetes.io/restartedAt': restartedAt,
          },
        },
      },
    },
  };

  try {
    const response = await fetch(
      `${KUBE_PROXY_URL}/apis/apps/v1/namespaces/${encodeURIComponent(namespace)}/deployments/${encodeURIComponent(name)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/strategic-merge-patch+json',
        },
        body: JSON.stringify(patchBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      message: `Deployment ${name} restart initiated`,
      deployment: data.metadata.name,
      restartedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to restart deployment: ${message}` },
      { status: 500 }
    );
  }
}
