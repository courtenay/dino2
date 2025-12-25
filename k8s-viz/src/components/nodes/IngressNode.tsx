'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { DoorOpen } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { K8sNodeData } from '@/lib/graph-builder';

function IngressNodeComponent({ data, selected }: NodeProps<K8sNodeData>) {
  const hosts = data.info?.hosts as string | undefined;

  return (
    <BaseNode
      icon={<DoorOpen className="w-6 h-6 text-purple-600" />}
      name={data.name}
      namespace={data.namespace}
      subtitle={hosts || '/'}
      status={data.status}
      color="bg-gradient-to-br from-purple-50 to-purple-100"
      borderColor="border-purple-400"
      selected={selected}
    />
  );
}

export const IngressNode = memo(IngressNodeComponent);
