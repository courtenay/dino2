'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { Lock } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { K8sNodeData } from '@/lib/graph-builder';

function SecretNodeComponent({ data, selected }: NodeProps<K8sNodeData>) {
  const keys = data.info?.keys as number | undefined;
  const secretType = data.info?.type as string | undefined;

  return (
    <BaseNode
      icon={<Lock className="w-6 h-6 text-red-600" />}
      name={data.name}
      namespace={data.namespace}
      subtitle={`${keys || 0} keys | ${secretType || 'Opaque'}`}
      status={data.status}
      color="bg-gradient-to-br from-red-50 to-red-100"
      borderColor="border-red-400"
      selected={selected}
    />
  );
}

export const SecretNode = memo(SecretNodeComponent);
