'use client';

import { X } from 'lucide-react';
import type { K8sNodeData } from '@/lib/graph-builder';
import type {
  K8sPod,
  K8sService,
  K8sDeployment,
  K8sIngress,
  K8sConfigMap,
  K8sSecret,
} from '@/types/k8s';

interface DetailsPanelProps {
  data: K8sNodeData | null;
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="text-sm text-gray-600">{children}</div>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string | number | undefined }) {
  if (value === undefined) return null;
  return (
    <div className="flex justify-between py-1 border-b border-gray-100">
      <span className="text-gray-500">{label}</span>
      <span className="font-mono text-gray-900">{value}</span>
    </div>
  );
}

function PodDetails({ pod }: { pod: K8sPod }) {
  return (
    <>
      <Section title="Status">
        <KeyValue label="Phase" value={pod.status.phase} />
        <KeyValue label="Pod IP" value={pod.status.podIP} />
        <KeyValue label="Node" value={pod.spec.nodeName} />
      </Section>
      <Section title="Containers">
        {pod.spec.containers.map((container) => {
          const status = pod.status.containerStatuses?.find((c) => c.name === container.name);
          return (
            <div key={container.name} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="font-medium">{container.name}</div>
              <div className="text-xs text-gray-500 truncate">{container.image}</div>
              {status && (
                <div className="text-xs mt-1">
                  Ready: {status.ready ? 'Yes' : 'No'} | Restarts: {status.restartCount}
                </div>
              )}
            </div>
          );
        })}
      </Section>
    </>
  );
}

function ServiceDetails({ service }: { service: K8sService }) {
  return (
    <>
      <Section title="Configuration">
        <KeyValue label="Type" value={service.spec.type} />
        <KeyValue label="Cluster IP" value={service.spec.clusterIP} />
      </Section>
      <Section title="Ports">
        {service.spec.ports.map((port, i) => (
          <div key={i} className="py-1">
            {port.name && <span className="text-gray-500">{port.name}: </span>}
            <span className="font-mono">{port.port} → {port.targetPort}</span>
            {port.nodePort && <span className="text-gray-500"> (NodePort: {port.nodePort})</span>}
          </div>
        ))}
      </Section>
      {service.spec.selector && (
        <Section title="Selector">
          {Object.entries(service.spec.selector).map(([key, value]) => (
            <div key={key} className="font-mono text-xs">
              {key}: {value}
            </div>
          ))}
        </Section>
      )}
    </>
  );
}

function DeploymentDetails({ deployment }: { deployment: K8sDeployment }) {
  const { replicas = 0, readyReplicas = 0, availableReplicas = 0 } = deployment.status;
  return (
    <>
      <Section title="Replicas">
        <KeyValue label="Desired" value={replicas} />
        <KeyValue label="Ready" value={readyReplicas} />
        <KeyValue label="Available" value={availableReplicas} />
      </Section>
      <Section title="Selector">
        {Object.entries(deployment.spec.selector.matchLabels).map(([key, value]) => (
          <div key={key} className="font-mono text-xs">
            {key}: {value}
          </div>
        ))}
      </Section>
      <Section title="Containers">
        {deployment.spec.template.spec.containers.map((container) => (
          <div key={container.name} className="mb-2 p-2 bg-gray-50 rounded">
            <div className="font-medium">{container.name}</div>
            <div className="text-xs text-gray-500 truncate">{container.image}</div>
          </div>
        ))}
      </Section>
    </>
  );
}

function IngressDetails({ ingress }: { ingress: K8sIngress }) {
  return (
    <>
      <Section title="Configuration">
        <KeyValue label="Class" value={ingress.spec.ingressClassName || 'default'} />
      </Section>
      <Section title="Rules">
        {ingress.spec.rules?.map((rule, i) => (
          <div key={i} className="mb-2 p-2 bg-gray-50 rounded">
            <div className="font-medium">{rule.host || '*'}</div>
            {rule.http?.paths.map((path, j) => (
              <div key={j} className="text-xs mt-1">
                {path.path} → {path.backend.service.name}:{path.backend.service.port.number || path.backend.service.port.name}
              </div>
            ))}
          </div>
        ))}
      </Section>
      {ingress.spec.tls && (
        <Section title="TLS">
          {ingress.spec.tls.map((tls, i) => (
            <div key={i} className="text-xs">
              Secret: {tls.secretName} | Hosts: {tls.hosts?.join(', ')}
            </div>
          ))}
        </Section>
      )}
    </>
  );
}

function ConfigMapDetails({ configMap }: { configMap: K8sConfigMap }) {
  const keys = Object.keys(configMap.data || {});
  return (
    <Section title="Data Keys">
      {keys.length === 0 ? (
        <div className="text-gray-400">No data</div>
      ) : (
        keys.map((key) => (
          <div key={key} className="font-mono text-xs py-1 border-b border-gray-100">
            {key}
          </div>
        ))
      )}
    </Section>
  );
}

function SecretDetails({ secret }: { secret: K8sSecret }) {
  const keys = Object.keys(secret.data || {});
  return (
    <>
      <Section title="Type">
        <div className="font-mono text-xs">{secret.type}</div>
      </Section>
      <Section title="Data Keys (values hidden)">
        {keys.length === 0 ? (
          <div className="text-gray-400">No data</div>
        ) : (
          keys.map((key) => (
            <div key={key} className="font-mono text-xs py-1 border-b border-gray-100">
              {key}
            </div>
          ))
        )}
      </Section>
    </>
  );
}

const typeColors: Record<string, string> = {
  internet: 'bg-gray-500',
  ingress: 'bg-purple-500',
  service: 'bg-blue-500',
  deployment: 'bg-green-500',
  pod: 'bg-teal-500',
  configmap: 'bg-orange-500',
  secret: 'bg-red-500',
};

export function DetailsPanel({ data, onClose }: DetailsPanelProps) {
  if (!data) return null;

  return (
    <div className="w-80 bg-white border-l border-gray-200 shadow-lg overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs text-white ${typeColors[data.type]}`}>
              {data.type.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <h2 className="mt-2 text-lg font-semibold text-gray-900">{data.name}</h2>
        {data.namespace && (
          <div className="text-sm text-gray-500">Namespace: {data.namespace}</div>
        )}
      </div>

      <div className="p-4">
        {data.type === 'pod' && data.resource && (
          <PodDetails pod={data.resource as K8sPod} />
        )}
        {data.type === 'service' && data.resource && (
          <ServiceDetails service={data.resource as K8sService} />
        )}
        {data.type === 'deployment' && data.resource && (
          <DeploymentDetails deployment={data.resource as K8sDeployment} />
        )}
        {data.type === 'ingress' && data.resource && (
          <IngressDetails ingress={data.resource as K8sIngress} />
        )}
        {data.type === 'configmap' && data.resource && (
          <ConfigMapDetails configMap={data.resource as K8sConfigMap} />
        )}
        {data.type === 'secret' && data.resource && (
          <SecretDetails secret={data.resource as K8sSecret} />
        )}
        {data.type === 'internet' && (
          <div className="text-gray-500">External traffic entry point</div>
        )}

        {data.resource?.metadata && (
          <Section title="Labels">
            {Object.entries(data.resource.metadata.labels || {}).length === 0 ? (
              <div className="text-gray-400">No labels</div>
            ) : (
              Object.entries(data.resource.metadata.labels || {}).map(([key, value]) => (
                <div key={key} className="font-mono text-xs py-1 truncate">
                  <span className="text-gray-500">{key}:</span> {value}
                </div>
              ))
            )}
          </Section>
        )}
      </div>
    </div>
  );
}
