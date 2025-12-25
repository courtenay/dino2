'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { FileText } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { K8sNodeData } from '@/lib/graph-builder';

function ConfigMapNodeComponent({ data, selected }: NodeProps<K8sNodeData>) {
  const keys = data.info?.keys as number | undefined;

  return (
    <BaseNode
      icon={<FileText className="w-6 h-6 text-orange-600" />}
      name={data.name}
      namespace={data.namespace}
      subtitle={`${keys || 0} keys`}
      status={data.status}
      color="bg-gradient-to-br from-orange-50 to-orange-100"
      borderColor="border-orange-400"
      selected={selected}
    />
  );
}

export const ConfigMapNode = memo(ConfigMapNodeComponent);
