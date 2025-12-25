import { NextResponse } from 'next/server';
import { getAllClusterData } from '@/lib/k8s-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getAllClusterData();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch K8s data:', message);
    return NextResponse.json(
      { error: 'Failed to connect to Kubernetes cluster', details: message },
      { status: 500 }
    );
  }
}
