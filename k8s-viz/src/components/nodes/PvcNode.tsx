'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { HardDrive } from 'lucide-react';
import type { K8sNodeData } from '@/lib/graph-builder';

const statusColors = {
  healthy: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  unknown: 'bg-gray-400',
};

function PvcNodeComponent({ data, selected }: NodeProps<K8sNodeData>) {
  const storage = data.info?.storage as string | undefined;
  const accessModes = data.info?.accessModes as string | undefined;
  const storageClass = data.info?.storageClass as string | undefined;
  const phase = data.info?.phase as string | undefined;

  return (
    <div
      className={`
        min-w-[160px] rounded-md border-2 shadow-md
        bg-gradient-to-br from-violet-50 to-violet-100 border-violet-400
        ${selected ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : ''}
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-violet-500 !border-2 !border-white"
      />

      <div className="p-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-500 rounded">
            <HardDrive className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-medium text-xs text-gray-900 truncate">
                {data.name}
              </span>
              {data.status && (
                <span
                  className={`w-2 h-2 rounded-full ${statusColors[data.status]}`}
                  title={phase}
                />
              )}
            </div>
            <div className="text-[10px] text-violet-600 font-medium">PVC</div>
          </div>
        </div>

        <div className="mt-1 space-y-0.5 text-[10px] text-gray-600">
          {storage && (
            <div className="flex justify-between">
              <span>Storage:</span>
              <span className="font-mono font-medium">{storage}</span>
            </div>
          )}
          {accessModes && (
            <div className="truncate text-gray-500" title={accessModes}>
              {accessModes}
            </div>
          )}
          {storageClass && storageClass !== 'default' && (
            <div className="text-gray-400 truncate">
              class: {storageClass}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-violet-500 !border-2 !border-white"
      />
    </div>
  );
}

export const PvcNode = memo(PvcNodeComponent);
