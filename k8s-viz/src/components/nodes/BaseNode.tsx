'use client';

import { Handle, Position } from 'reactflow';
import type { ReactNode } from 'react';

interface BaseNodeProps {
  icon: ReactNode;
  name: string;
  namespace?: string;
  subtitle?: string;
  status?: 'healthy' | 'warning' | 'error' | 'unknown';
  color: string;
  borderColor: string;
  selected?: boolean;
}

const statusColors = {
  healthy: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  unknown: 'bg-gray-400',
};

export function BaseNode({
  icon,
  name,
  namespace,
  subtitle,
  status,
  color,
  borderColor,
  selected,
}: BaseNodeProps) {
  return (
    <div
      className={`
        min-w-[180px] rounded-lg border-2 shadow-lg transition-all
        ${color} ${borderColor}
        ${selected ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : ''}
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      <div className="p-3">
        <div className="flex items-center gap-2">
          <div className="text-2xl">{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900 truncate">
                {name}
              </span>
              {status && (
                <span
                  className={`w-2 h-2 rounded-full ${statusColors[status]}`}
                  title={status}
                />
              )}
            </div>
            {namespace && (
              <div className="text-xs text-gray-500 truncate">{namespace}</div>
            )}
          </div>
        </div>
        {subtitle && (
          <div className="mt-2 text-xs text-gray-600 truncate">{subtitle}</div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  );
}
