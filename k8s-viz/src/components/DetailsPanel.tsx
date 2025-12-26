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
  K8sProbe,
  K8sPersistentVolumeClaim,
  K8sNetworkPolicy,
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

function ProbeDetails({ probe }: { probe: K8sProbe }) {
  return (
    <div className="text-xs space-y-1">
      {probe.httpGet && (
        <div className="font-mono">
          HTTP GET {probe.httpGet.scheme || 'HTTP'}://*:{probe.httpGet.port}{probe.httpGet.path}
        </div>
      )}
      {probe.tcpSocket && (
        <div className="font-mono">
          TCP :{probe.tcpSocket.port}
        </div>
      )}
      {probe.exec && (
        <div className="font-mono truncate" title={probe.exec.command.join(' ')}>
          exec: {probe.exec.command.join(' ')}
        </div>
      )}
      <div className="text-gray-500 flex flex-wrap gap-2">
        {probe.initialDelaySeconds !== undefined && (
          <span>delay: {probe.initialDelaySeconds}s</span>
        )}
        {probe.periodSeconds !== undefined && (
          <span>period: {probe.periodSeconds}s</span>
        )}
        {probe.timeoutSeconds !== undefined && (
          <span>timeout: {probe.timeoutSeconds}s</span>
        )}
        {probe.failureThreshold !== undefined && (
          <span>failures: {probe.failureThreshold}</span>
        )}
      </div>
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

function PvcDetails({ pvc }: { pvc: K8sPersistentVolumeClaim }) {
  return (
    <>
      <Section title="Storage">
        <KeyValue label="Requested" value={pvc.spec.resources.requests.storage} />
        {pvc.status?.capacity?.storage && (
          <KeyValue label="Capacity" value={pvc.status.capacity.storage} />
        )}
      </Section>
      <Section title="Configuration">
        <KeyValue label="Status" value={pvc.status?.phase} />
        <KeyValue label="Access Modes" value={pvc.spec.accessModes.join(', ')} />
        {pvc.spec.storageClassName && (
          <KeyValue label="Storage Class" value={pvc.spec.storageClassName} />
        )}
        {pvc.spec.volumeName && (
          <KeyValue label="Volume" value={pvc.spec.volumeName} />
        )}
        {pvc.spec.volumeMode && (
          <KeyValue label="Volume Mode" value={pvc.spec.volumeMode} />
        )}
      </Section>
    </>
  );
}

function NetworkPolicyDetails({ policy }: { policy: K8sNetworkPolicy }) {
  const policyTypes = policy.spec.policyTypes || [];

  return (
    <>
      <Section title="Policy Types">
        <div className="flex gap-2">
          {policyTypes.includes('Ingress') && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Ingress</span>
          )}
          {policyTypes.includes('Egress') && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Egress</span>
          )}
          {policyTypes.length === 0 && (
            <span className="text-gray-400">No policy types specified</span>
          )}
        </div>
      </Section>

      <Section title="Pod Selector">
        {policy.spec.podSelector.matchLabels ? (
          Object.entries(policy.spec.podSelector.matchLabels).map(([key, value]) => (
            <div key={key} className="font-mono text-xs py-1">
              {key}: {value}
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-xs">All pods in namespace</div>
        )}
      </Section>

      {policy.spec.ingress && policy.spec.ingress.length > 0 && (
        <Section title="Ingress Rules">
          {policy.spec.ingress.map((rule, i) => (
            <div key={i} className="mb-2 p-2 bg-blue-50 rounded text-xs">
              {rule.from ? (
                <div>
                  <div className="font-medium text-blue-700 mb-1">From:</div>
                  {rule.from.map((from, j) => (
                    <div key={j} className="ml-2 text-gray-600">
                      {from.podSelector && (
                        <div>Pods: {JSON.stringify(from.podSelector.matchLabels || {})}</div>
                      )}
                      {from.namespaceSelector && (
                        <div>Namespaces: {JSON.stringify(from.namespaceSelector.matchLabels || {})}</div>
                      )}
                      {from.ipBlock && (
                        <div>IP Block: {from.ipBlock.cidr}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-blue-600">Allow all sources</div>
              )}
              {rule.ports && (
                <div className="mt-1">
                  <span className="text-gray-500">Ports: </span>
                  {rule.ports.map((p) => `${p.port}/${p.protocol || 'TCP'}`).join(', ')}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {policy.spec.egress && policy.spec.egress.length > 0 && (
        <Section title="Egress Rules">
          {policy.spec.egress.map((rule, i) => (
            <div key={i} className="mb-2 p-2 bg-purple-50 rounded text-xs">
              {rule.to ? (
                <div>
                  <div className="font-medium text-purple-700 mb-1">To:</div>
                  {rule.to.map((to, j) => (
                    <div key={j} className="ml-2 text-gray-600">
                      {to.podSelector && (
                        <div>Pods: {JSON.stringify(to.podSelector.matchLabels || {})}</div>
                      )}
                      {to.namespaceSelector && (
                        <div>Namespaces: {JSON.stringify(to.namespaceSelector.matchLabels || {})}</div>
                      )}
                      {to.ipBlock && (
                        <div>IP Block: {to.ipBlock.cidr}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-purple-600">Allow all destinations</div>
              )}
              {rule.ports && (
                <div className="mt-1">
                  <span className="text-gray-500">Ports: </span>
                  {rule.ports.map((p) => `${p.port}/${p.protocol || 'TCP'}`).join(', ')}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}
    </>
  );
}

function ContainerDetails({ containerName, pod }: { containerName: string; pod: K8sPod }) {
  const container = pod.spec.containers.find((c) => c.name === containerName);
  const containerStatus = pod.status.containerStatuses?.find((c) => c.name === containerName);

  if (!container) {
    return <div className="text-gray-400">Container not found</div>;
  }

  const isPrivileged = container.securityContext?.privileged === true;
  const isSidecar = pod.spec.containers.indexOf(container) > 0;

  return (
    <>
      <Section title="Container Info">
        <KeyValue label="Image" value={container.image} />
        {isSidecar && (
          <div className="py-1 border-b border-gray-100">
            <span className="text-gray-500">Role</span>
            <span className="ml-2 px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded">Sidecar</span>
          </div>
        )}
        {isPrivileged && (
          <div className="py-1 border-b border-gray-100">
            <span className="text-gray-500">Security</span>
            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">Privileged</span>
          </div>
        )}
      </Section>

      {containerStatus && (
        <Section title="Status">
          <KeyValue label="Ready" value={containerStatus.ready ? 'Yes' : 'No'} />
          <KeyValue label="Restarts" value={containerStatus.restartCount} />
          {containerStatus.state?.running && (
            <KeyValue label="Started" value={new Date(containerStatus.state.running.startedAt).toLocaleString()} />
          )}
          {containerStatus.state?.waiting && (
            <KeyValue label="Waiting" value={containerStatus.state.waiting.reason} />
          )}
          {containerStatus.state?.terminated && (
            <KeyValue label="Exit Code" value={containerStatus.state.terminated.exitCode} />
          )}
        </Section>
      )}

      {container.ports && container.ports.length > 0 && (
        <Section title="Ports">
          {container.ports.map((port, i) => (
            <div key={i} className="py-1 font-mono text-xs">
              {port.containerPort}/{port.protocol || 'TCP'}
            </div>
          ))}
        </Section>
      )}

      {container.securityContext && (
        <Section title="Security Context">
          {container.securityContext.runAsUser !== undefined && (
            <KeyValue label="Run As User" value={container.securityContext.runAsUser} />
          )}
          {container.securityContext.runAsGroup !== undefined && (
            <KeyValue label="Run As Group" value={container.securityContext.runAsGroup} />
          )}
          {container.securityContext.runAsNonRoot !== undefined && (
            <KeyValue label="Run As Non-Root" value={container.securityContext.runAsNonRoot ? 'Yes' : 'No'} />
          )}
          {container.securityContext.capabilities?.add && (
            <div className="py-1 border-b border-gray-100">
              <div className="text-gray-500 text-xs">Capabilities Added</div>
              <div className="font-mono text-xs">{container.securityContext.capabilities.add.join(', ')}</div>
            </div>
          )}
          {container.securityContext.capabilities?.drop && (
            <div className="py-1 border-b border-gray-100">
              <div className="text-gray-500 text-xs">Capabilities Dropped</div>
              <div className="font-mono text-xs">{container.securityContext.capabilities.drop.join(', ')}</div>
            </div>
          )}
        </Section>
      )}

      {container.volumeMounts && container.volumeMounts.length > 0 && (
        <Section title="Volume Mounts">
          {container.volumeMounts.map((mount, i) => (
            <div key={i} className="py-1 border-b border-gray-100">
              <div className="font-mono text-xs text-gray-900">{mount.mountPath}</div>
              <div className="text-xs text-gray-500">
                {mount.name} {mount.readOnly ? '(read-only)' : ''}
              </div>
            </div>
          ))}
        </Section>
      )}

      {container.resources && (container.resources.limits || container.resources.requests) && (
        <Section title="Resources">
          {container.resources.requests && (
            <div className="mb-2">
              <div className="text-xs text-gray-500 mb-1">Requests</div>
              {container.resources.requests.cpu && (
                <div className="flex justify-between py-0.5">
                  <span className="text-gray-600">CPU</span>
                  <span className="font-mono text-xs">{container.resources.requests.cpu}</span>
                </div>
              )}
              {container.resources.requests.memory && (
                <div className="flex justify-between py-0.5">
                  <span className="text-gray-600">Memory</span>
                  <span className="font-mono text-xs">{container.resources.requests.memory}</span>
                </div>
              )}
            </div>
          )}
          {container.resources.limits && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Limits</div>
              {container.resources.limits.cpu && (
                <div className="flex justify-between py-0.5">
                  <span className="text-gray-600">CPU</span>
                  <span className="font-mono text-xs">{container.resources.limits.cpu}</span>
                </div>
              )}
              {container.resources.limits.memory && (
                <div className="flex justify-between py-0.5">
                  <span className="text-gray-600">Memory</span>
                  <span className="font-mono text-xs">{container.resources.limits.memory}</span>
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {(container.livenessProbe || container.readinessProbe || container.startupProbe) && (
        <Section title="Health Probes">
          {container.livenessProbe && (
            <div className="mb-2 p-2 bg-green-50 rounded border border-green-200">
              <div className="text-xs font-medium text-green-700 mb-1">Liveness</div>
              <ProbeDetails probe={container.livenessProbe} />
            </div>
          )}
          {container.readinessProbe && (
            <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
              <div className="text-xs font-medium text-blue-700 mb-1">Readiness</div>
              <ProbeDetails probe={container.readinessProbe} />
            </div>
          )}
          {container.startupProbe && (
            <div className="p-2 bg-purple-50 rounded border border-purple-200">
              <div className="text-xs font-medium text-purple-700 mb-1">Startup</div>
              <ProbeDetails probe={container.startupProbe} />
            </div>
          )}
        </Section>
      )}

      {container.env && container.env.length > 0 && (
        <Section title="Environment Variables">
          {container.env.map((env, i) => (
            <div key={i} className="py-1 border-b border-gray-100 font-mono text-xs">
              <span className="text-gray-700">{env.name}</span>
              {env.valueFrom?.secretKeyRef && (
                <span className="text-red-500 ml-1">← secret:{env.valueFrom.secretKeyRef.name}</span>
              )}
              {env.valueFrom?.configMapKeyRef && (
                <span className="text-orange-500 ml-1">← configmap:{env.valueFrom.configMapKeyRef.name}</span>
              )}
            </div>
          ))}
        </Section>
      )}

      <Section title="Parent Pod">
        <KeyValue label="Pod Name" value={pod.metadata.name} />
        <KeyValue label="Pod IP" value={pod.status.podIP} />
        <KeyValue label="Node" value={pod.spec.nodeName} />
      </Section>
    </>
  );
}

const typeColors: Record<string, string> = {
  internet: 'bg-gray-500',
  ingresscontroller: 'bg-amber-500',
  proxy: 'bg-orange-500',
  ingress: 'bg-purple-500',
  route: 'bg-violet-400',
  service: 'bg-blue-500',
  deployment: 'bg-green-500',
  pod: 'bg-teal-500',
  container: 'bg-slate-500',
  configmap: 'bg-orange-500',
  secret: 'bg-red-500',
  pvc: 'bg-violet-500',
  networkpolicy: 'bg-emerald-500',
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
        {data.type === 'pvc' && data.resource && (
          <PvcDetails pvc={data.resource as K8sPersistentVolumeClaim} />
        )}
        {data.type === 'networkpolicy' && data.resource && (
          <NetworkPolicyDetails policy={data.resource as K8sNetworkPolicy} />
        )}
        {data.type === 'container' && data.resource && (
          <ContainerDetails containerName={data.name} pod={data.resource as K8sPod} />
        )}
        {data.type === 'internet' && (
          <div className="text-gray-500">External traffic entry point</div>
        )}
        {(data.type === 'ingresscontroller' || data.type === 'proxy') && (
          <div className="text-gray-500">
            {data.type === 'ingresscontroller' ? 'Ingress controller managing external traffic' : 'Reverse proxy routing requests to services'}
          </div>
        )}
        {data.type === 'route' && (
          <div className="text-gray-500">Route path from ingress rule</div>
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
