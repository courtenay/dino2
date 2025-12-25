'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { Layers } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { K8sNodeData } from '@/lib/graph-builder';

function DeploymentNodeComponent({ data, selected }: NodeProps<K8sNodeData>) {
  const replicas = data.info?.replicas as string | undefined;

  return (
    <BaseNode
      icon={<Layers className="w-6 h-6 text-green-600" />}
      name={data.name}
      namespace={data.namespace}
      subtitle={`Replicas: ${replicas || '0/0'}`}
      status={data.status}
      color="bg-gradient-to-br from-green-50 to-green-100"
      borderColor="border-green-400"
      selected={selected}
    />
  );
}

export const DeploymentNode = memo(DeploymentNodeComponent);
