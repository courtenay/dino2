import { NextRequest, NextResponse } from 'next/server';

const KUBE_PROXY_URL = process.env.KUBE_PROXY_URL || 'http://localhost:8001';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    namespace: string;
    name: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { namespace, name } = await params;

  if (!namespace || !name) {
    return NextResponse.json(
      { error: 'Missing required parameters: namespace, name' },
      { status: 400 }
    );
  }

  let replicas: number;
  try {
    const body = await request.json();
    replicas = body.replicas;
    if (typeof replicas !== 'number' || replicas < 0) {
      return NextResponse.json(
        { error: 'Invalid replicas value: must be a non-negative number' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const scaleBody = {
    spec: {
      replicas,
    },
  };

  try {
    const response = await fetch(
      `${KUBE_PROXY_URL}/apis/apps/v1/namespaces/${encodeURIComponent(namespace)}/deployments/${encodeURIComponent(name)}/scale`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/strategic-merge-patch+json',
        },
        body: JSON.stringify(scaleBody),
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
      message: `Deployment ${name} scaled to ${replicas} replicas`,
      deployment: name,
      replicas: data.spec.replicas,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to scale deployment: ${message}` },
      { status: 500 }
    );
  }
}
