'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { Network } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { K8sNodeData } from '@/lib/graph-builder';

function ServiceNodeComponent({ data, selected }: NodeProps<K8sNodeData>) {
  const svcType = data.info?.type as string | undefined;
  const ports = data.info?.ports as string | undefined;

  return (
    <BaseNode
      icon={<Network className="w-6 h-6 text-blue-600" />}
      name={data.name}
      namespace={data.namespace}
      subtitle={`${svcType || 'ClusterIP'} ${ports || ''}`}
      status={data.status}
      color="bg-gradient-to-br from-blue-50 to-blue-100"
      borderColor="border-blue-400"
      selected={selected}
    />
  );
}

export const ServiceNode = memo(ServiceNodeComponent);
