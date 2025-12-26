'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { K8sNodeData } from '@/lib/graph-builder';

function NetworkPolicyNodeComponent({ data, selected }: NodeProps<K8sNodeData>) {
  const policyTypes = data.info?.policyTypes as string[] | undefined;
  const ingressRules = data.info?.ingressRules as number | undefined;
  const egressRules = data.info?.egressRules as number | undefined;
  const targetPods = data.info?.targetPods as number | undefined;

  const hasIngress = policyTypes?.includes('Ingress');
  const hasEgress = policyTypes?.includes('Egress');
  const isRestrictive = hasIngress || hasEgress;

  const Icon = isRestrictive ? ShieldCheck : ShieldAlert;
  const borderColor = isRestrictive ? 'border-emerald-500' : 'border-amber-500';
  const bgColor = isRestrictive
    ? 'bg-gradient-to-br from-emerald-50 to-emerald-100'
    : 'bg-gradient-to-br from-amber-50 to-amber-100';
  const iconBg = isRestrictive ? 'bg-emerald-500' : 'bg-amber-500';

  return (
    <div
      className={`
        min-w-[180px] rounded-md border-2 shadow-md
        ${bgColor} ${borderColor}
        ${selected ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : ''}
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-emerald-500 !border-2 !border-white"
      />

      <div className="p-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 ${iconBg} rounded`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-medium text-xs text-gray-900 truncate block">
              {data.name}
            </span>
            <div className="text-[10px] text-emerald-600 font-medium">
              NetworkPolicy
            </div>
          </div>
        </div>

        <div className="mt-2 space-y-1 text-[10px]">
          {policyTypes && policyTypes.length > 0 && (
            <div className="flex gap-1">
              {hasIngress && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                  Ingress
                </span>
              )}
              {hasEgress && (
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                  Egress
                </span>
              )}
            </div>
          )}

          <div className="text-gray-600 space-y-0.5">
            {ingressRules !== undefined && ingressRules > 0 && (
              <div>{ingressRules} ingress rule{ingressRules > 1 ? 's' : ''}</div>
            )}
            {egressRules !== undefined && egressRules > 0 && (
              <div>{egressRules} egress rule{egressRules > 1 ? 's' : ''}</div>
            )}
            {targetPods !== undefined && (
              <div className="text-gray-500">
                affects {targetPods} pod{targetPods !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-emerald-500 !border-2 !border-white"
      />
    </div>
  );
}

export const NetworkPolicyNode = memo(NetworkPolicyNodeComponent);
