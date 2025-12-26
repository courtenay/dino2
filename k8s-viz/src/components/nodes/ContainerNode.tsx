'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { Container, AlertTriangle } from 'lucide-react';
import type { K8sNodeData } from '@/lib/graph-builder';

const statusColors = {
  healthy: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  unknown: 'bg-gray-400',
};

function ContainerNodeComponent({ data, selected }: NodeProps<K8sNodeData>) {
  const image = data.info?.image as string | undefined;
  const ports = data.info?.ports as string | undefined;
  const restarts = data.info?.restarts as number | undefined;
  const ready = data.info?.ready as boolean | undefined;
  const isPrivileged = data.info?.privileged as boolean | undefined;
  const isSidecar = data.info?.sidecar as boolean | undefined;

  // Extract short image name (remove registry and tag for display)
  const shortImage = image?.split('/').pop()?.split(':')[0] || 'unknown';

  return (
    <div
      className={`
        min-w-[160px] rounded-md border-2 shadow-md
        ${isSidecar
          ? 'bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-400'
          : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-400'
        }
        ${selected ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : ''}
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white"
      />

      <div className="p-2">
        <div className="flex items-center gap-2">
          <Container className={`w-4 h-4 ${isSidecar ? 'text-cyan-600' : 'text-slate-600'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-medium text-xs text-gray-900 truncate">
                {data.name}
              </span>
              {data.status && (
                <span
                  className={`w-2 h-2 rounded-full ${statusColors[data.status]}`}
                  title={ready ? 'Ready' : 'Not Ready'}
                />
              )}
              {isPrivileged && (
                <span title="Privileged container">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                </span>
              )}
            </div>
            {isSidecar && (
              <div className="text-[10px] text-cyan-600 font-medium">SIDECAR</div>
            )}
          </div>
        </div>

        <div className="mt-1 space-y-0.5 text-[10px] text-gray-500">
          <div className="truncate" title={image}>
            {shortImage}
          </div>
          {ports && (
            <div className="font-mono text-gray-700">
              :{ports}
            </div>
          )}
          {restarts !== undefined && restarts > 0 && (
            <div className="text-amber-600">
              {restarts} restart{restarts > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white"
      />
    </div>
  );
}

export const ContainerNode = memo(ContainerNodeComponent);
