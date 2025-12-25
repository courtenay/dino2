'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { Box } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { K8sNodeData } from '@/lib/graph-builder';

function PodNodeComponent({ data, selected }: NodeProps<K8sNodeData>) {
  const phase = data.info?.phase as string | undefined;
  const restarts = data.info?.restarts as number | undefined;
  const containers = data.info?.containers as number | undefined;

  return (
    <BaseNode
      icon={<Box className="w-6 h-6 text-teal-600" />}
      name={data.name}
      namespace={data.namespace}
      subtitle={`${phase || 'Unknown'} | ${containers || 0} containers | ${restarts || 0} restarts`}
      status={data.status}
      color="bg-gradient-to-br from-teal-50 to-teal-100"
      borderColor="border-teal-400"
      selected={selected}
    />
  );
}

export const PodNode = memo(PodNodeComponent);
