'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { Route } from 'lucide-react';
import type { K8sNodeData } from '@/lib/graph-builder';

function RouteNodeComponent({ data, selected }: NodeProps<K8sNodeData>) {
  const hosts = data.info?.hosts as string[] | undefined;
  const paths = data.info?.paths as string[] | undefined;
  const targetService = data.info?.targetService as string | undefined;

  return (
    <div
      className={`
        min-w-[180px] rounded-lg border-2 shadow-lg
        bg-gradient-to-br from-violet-50 to-violet-100 border-violet-400
        ${selected ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : ''}
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-violet-400 !border-2 !border-white"
      />

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Route className="w-5 h-5 text-violet-600" />
          <span className="text-xs font-semibold text-violet-600 uppercase">
            Route
          </span>
        </div>

        <div className="space-y-1">
          {hosts && hosts.length > 0 && (
            <div className="text-sm font-medium text-gray-900 truncate" title={hosts.join(', ')}>
              {hosts[0] === '*' ? '(all hosts)' : hosts[0]}
              {hosts.length > 1 && <span className="text-gray-400"> +{hosts.length - 1}</span>}
            </div>
          )}

          {paths && paths.length > 0 && (
            <div className="text-xs text-gray-600 font-mono truncate" title={paths.join(', ')}>
              {paths[0]}
              {paths.length > 1 && <span className="text-gray-400"> +{paths.length - 1}</span>}
            </div>
          )}

          {targetService && (
            <div className="text-xs text-violet-600 mt-1">
              → {targetService}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-violet-400 !border-2 !border-white"
      />
    </div>
  );
}

export const RouteNode = memo(RouteNodeComponent);
