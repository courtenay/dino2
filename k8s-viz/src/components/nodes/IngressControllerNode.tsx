'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { Server, ArrowLeftRight } from 'lucide-react';
import type { K8sNodeData } from '@/lib/graph-builder';

const statusColors = {
  healthy: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  unknown: 'bg-gray-400',
};

function IngressControllerNodeComponent({ data, selected }: NodeProps<K8sNodeData>) {
  const pods = data.info?.pods as number | undefined;
  const deployments = data.info?.deployments as string | undefined;
  const replicas = data.info?.replicas as string | undefined;
  const isProxy = data.isProxy || data.type === 'proxy';

  const Icon = isProxy ? ArrowLeftRight : Server;
  const label = isProxy ? 'Reverse Proxy' : 'Ingress Controller';
  const bgColor = isProxy
    ? 'bg-gradient-to-br from-amber-50 to-orange-100 border-orange-400'
    : 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-500';
  const iconBg = isProxy ? 'bg-orange-400' : 'bg-amber-500';

  return (
    <div
      className={`
        min-w-[200px] rounded-lg border-2 shadow-lg
        ${bgColor}
        ${selected ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : ''}
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
      />

      <div className="p-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 ${iconBg} rounded-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900">
                {data.name}
              </span>
              {data.status && (
                <span
                  className={`w-2 h-2 rounded-full ${statusColors[data.status]}`}
                  title={data.status}
                />
              )}
            </div>
            <div className="text-xs text-amber-700 font-medium">
              {label}
            </div>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-amber-200 text-xs text-gray-600 space-y-1">
          {pods !== undefined && (
            <div className="flex justify-between">
              <span>Pods:</span>
              <span className="font-mono font-medium">{pods}</span>
            </div>
          )}
          {replicas && (
            <div className="flex justify-between">
              <span>Replicas:</span>
              <span className="font-mono font-medium">{replicas}</span>
            </div>
          )}
          {deployments && (
            <div className="truncate text-gray-500" title={deployments}>
              {deployments}
            </div>
          )}
          {data.namespace && (
            <div className="text-gray-400">
              ns: {data.namespace}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
      />
    </div>
  );
}

export const IngressControllerNode = memo(IngressControllerNodeComponent);
