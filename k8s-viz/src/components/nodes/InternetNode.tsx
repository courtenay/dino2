'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { Globe } from 'lucide-react';
import type { K8sNodeData } from '@/lib/graph-builder';

function InternetNodeComponent({ selected }: NodeProps<K8sNodeData>) {
  return (
    <div
      className={`
        w-20 h-20 rounded-full border-2 shadow-lg
        bg-gradient-to-br from-gray-100 to-gray-200 border-gray-400
        flex items-center justify-center
        ${selected ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : ''}
      `}
    >
      <Globe className="w-10 h-10 text-gray-600" />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  );
}

export const InternetNode = memo(InternetNodeComponent);
