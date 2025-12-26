import type { Node, Edge } from 'reactflow';
import type {
  ClusterData,
  K8sPod,
  K8sService,
  K8sDeployment,
  K8sIngress,
  K8sConfigMap,
  K8sSecret,
  K8sPersistentVolumeClaim,
  K8sNetworkPolicy,
} from '@/types/k8s';
import { applyDagreLayout } from './layout';

export type NodeType =
  | 'internet'
  | 'ingresscontroller'
  | 'proxy'
  | 'ingress'
  | 'service'
  | 'deployment'
  | 'pod'
  | 'container'
  | 'configmap'
  | 'secret'
  | 'pvc'
  | 'networkpolicy'
  | 'route';

export type ViewMode = 'resources' | 'routing';

export interface K8sNodeData {
  type: NodeType;
  name: string;
  namespace?: string;
  resource: K8sPod | K8sService | K8sDeployment | K8sIngress | K8sConfigMap | K8sSecret | K8sPersistentVolumeClaim | K8sNetworkPolicy | null;
  status?: 'healthy' | 'warning' | 'error' | 'unknown';
  info?: Record<string, string | number | boolean | string[]>;
  isIngressController?: boolean;
  isProxy?: boolean;
}

// Common ingress controller identifiers
const INGRESS_CONTROLLER_PATTERNS = {
  namespaces: ['ingress-nginx', 'nginx-ingress', 'traefik', 'kong', 'haproxy', 'contour', 'istio-system'],
  labels: [
    { key: 'app.kubernetes.io/name', values: ['ingress-nginx', 'traefik', 'kong', 'haproxy-ingress', 'contour'] },
    { key: 'app', values: ['nginx-ingress', 'traefik', 'kong', 'haproxy-ingress'] },
    { key: 'app.kubernetes.io/component', values: ['controller'] },
  ],
  namePatterns: [/ingress.*controller/i, /nginx.*ingress/i, /traefik/i, /kong/i, /haproxy/i, /contour/i, /envoy/i],
};

// Patterns for detecting reverse proxy pods (not full ingress controllers)
const PROXY_PATTERNS = {
  names: [/^nginx/i, /^proxy/i, /^gateway/i, /^haproxy/i, /^envoy/i, /^caddy/i, /^traefik/i],
  images: ['nginx', 'haproxy', 'envoy', 'caddy', 'traefik', 'httpd', 'apache'],
};

// Common non-HTTP service ports (databases, caches, message queues, etc.)
const NON_HTTP_PORTS = new Set([
  5432,  // PostgreSQL
  3306,  // MySQL
  1433,  // SQL Server
  1521,  // Oracle
  27017, // MongoDB
  6379,  // Redis
  11211, // Memcached
  5672,  // RabbitMQ AMQP
  9092,  // Kafka
  2181,  // Zookeeper
  9042,  // Cassandra
  8529,  // ArangoDB
  7474,  // Neo4j
  26257, // CockroachDB
  4222,  // NATS
  6650,  // Pulsar
  9200,  // Elasticsearch (often HTTP but typically internal)
]);

// Check if a service looks like an HTTP/web service based on its ports
function isHttpService(service: K8sService): boolean {
  const ports = service.spec.ports;
  if (!ports || ports.length === 0) return false;

  // Check if any port looks like an HTTP service
  return ports.some((p) => {
    // Explicit non-HTTP ports
    if (NON_HTTP_PORTS.has(p.port)) return false;
    if (NON_HTTP_PORTS.has(typeof p.targetPort === 'number' ? p.targetPort : 0)) return false;

    // Common HTTP port patterns
    if (p.port === 80 || p.port === 443 || p.port === 8080 || p.port === 8443) return true;

    // Named ports suggesting HTTP
    if (p.name && /^(http|https|web|api|grpc)/.test(p.name)) return true;

    // Ports in common web app ranges (3000-9999 excluding known non-HTTP)
    if (p.port >= 3000 && p.port <= 9999) return true;

    return false;
  });
}

function isIngressController(pod: K8sPod): boolean {
  const ns = pod.metadata.namespace || '';
  const name = pod.metadata.name || '';
  const labels = pod.metadata.labels || {};

  if (INGRESS_CONTROLLER_PATTERNS.namespaces.some((n) => ns.includes(n))) {
    return true;
  }

  for (const labelPattern of INGRESS_CONTROLLER_PATTERNS.labels) {
    const labelValue = labels[labelPattern.key];
    if (labelValue && labelPattern.values.some((v) => labelValue.includes(v))) {
      return true;
    }
  }

  if (INGRESS_CONTROLLER_PATTERNS.namePatterns.some((pattern) => pattern.test(name))) {
    return true;
  }

  const images = pod.spec.containers.map((c) => c.image.toLowerCase());
  const ingressImages = ['nginx-ingress', 'ingress-nginx', 'traefik', 'kong', 'haproxy', 'contour', 'envoy'];
  if (images.some((img) => ingressImages.some((ic) => img.includes(ic)))) {
    return true;
  }

  return false;
}

function isProxyPod(pod: K8sPod): boolean {
  // Skip if it's a full ingress controller
  if (isIngressController(pod)) return false;

  const name = pod.metadata.name || '';

  // Check name patterns
  if (PROXY_PATTERNS.names.some((pattern) => pattern.test(name))) {
    return true;
  }

  // Check container images
  const images = pod.spec.containers.map((c) => c.image.toLowerCase());
  if (images.some((img) => PROXY_PATTERNS.images.some((p) => img.includes(p)))) {
    return true;
  }

  return false;
}

function isIngressControllerDeployment(deployment: K8sDeployment): boolean {
  const ns = deployment.metadata.namespace || '';
  const name = deployment.metadata.name || '';
  const labels = deployment.metadata.labels || {};

  if (INGRESS_CONTROLLER_PATTERNS.namespaces.some((n) => ns.includes(n))) {
    return true;
  }

  for (const labelPattern of INGRESS_CONTROLLER_PATTERNS.labels) {
    const labelValue = labels[labelPattern.key];
    if (labelValue && labelPattern.values.some((v) => labelValue.includes(v))) {
      return true;
    }
  }

  if (INGRESS_CONTROLLER_PATTERNS.namePatterns.some((pattern) => pattern.test(name))) {
    return true;
  }

  return false;
}

function isProxyDeployment(deployment: K8sDeployment): boolean {
  if (isIngressControllerDeployment(deployment)) return false;

  const name = deployment.metadata.name || '';

  if (PROXY_PATTERNS.names.some((pattern) => pattern.test(name))) {
    return true;
  }

  const images = deployment.spec.template.spec.containers.map((c) => c.image.toLowerCase());
  if (images.some((img) => PROXY_PATTERNS.images.some((p) => img.includes(p)))) {
    return true;
  }

  return false;
}

function getNodeId(type: string, namespace: string | undefined, name: string): string {
  return namespace ? `${type}:${namespace}:${name}` : `${type}:${name}`;
}

function getPodStatus(pod: K8sPod): 'healthy' | 'warning' | 'error' | 'unknown' {
  if (pod.status.phase === 'Running') {
    const allReady = pod.status.containerStatuses?.every((c) => c.ready) ?? false;
    return allReady ? 'healthy' : 'warning';
  }
  if (pod.status.phase === 'Succeeded') return 'healthy';
  if (pod.status.phase === 'Failed') return 'error';
  if (pod.status.phase === 'Pending') return 'warning';
  return 'unknown';
}

function getDeploymentStatus(deployment: K8sDeployment): 'healthy' | 'warning' | 'error' | 'unknown' {
  const { replicas = 0, readyReplicas = 0, unavailableReplicas = 0 } = deployment.status;
  if (unavailableReplicas > 0) return 'warning';
  if (readyReplicas === replicas && replicas > 0) return 'healthy';
  if (readyReplicas < replicas) return 'warning';
  return 'unknown';
}

function labelsMatch(selector: Record<string, string>, labels?: Record<string, string>): boolean {
  if (!labels) return false;
  return Object.entries(selector).every(([key, value]) => labels[key] === value);
}

// Build the routing-focused view
export function buildRoutingGraph(
  data: ClusterData,
  selectedNamespaces: string[]
): { nodes: Node<K8sNodeData>[]; edges: Edge[] } {
  const nodes: Node<K8sNodeData>[] = [];
  const edges: Edge[] = [];
  const nodeIds = new Set<string>();

  const filterByNamespace = <T extends { metadata: { namespace?: string } }>(items: T[]): T[] => {
    if (selectedNamespaces.length === 0) return items;
    return items.filter((item) =>
      selectedNamespaces.includes(item.metadata.namespace || 'default')
    );
  };

  const allPods = data.pods;
  const allDeployments = data.deployments;
  const allServices = data.services;

  const pods = filterByNamespace(data.pods);
  const services = filterByNamespace(data.services);
  const deployments = filterByNamespace(data.deployments);
  const ingresses = filterByNamespace(data.ingresses);

  // Find ingress controller deployments and pods
  const ingressControllerDeployments = allDeployments.filter(isIngressControllerDeployment);
  const ingressControllerPods = allPods.filter(isIngressController);

  // Find proxy deployments and pods (nginx, etc. that aren't full ingress controllers)
  const proxyDeployments = deployments.filter(isProxyDeployment);
  const proxyPods = pods.filter(isProxyPod);

  // Find services that front ingress controllers
  const ingressControllerServices = allServices.filter((svc) => {
    if (!svc.spec.selector) return false;
    return ingressControllerPods.some((pod) =>
      pod.metadata.namespace === svc.metadata.namespace &&
      labelsMatch(svc.spec.selector!, pod.metadata.labels)
    );
  });

  // Find services that front proxy pods
  const proxyServices = services.filter((svc) => {
    if (!svc.spec.selector) return false;
    return proxyPods.some((pod) =>
      pod.metadata.namespace === svc.metadata.namespace &&
      labelsMatch(svc.spec.selector!, pod.metadata.labels)
    );
  });

  const hasIngressController = ingressControllerDeployments.length > 0 || ingressControllerPods.length > 0;
  const hasProxy = proxyDeployments.length > 0 || proxyPods.length > 0;
  const hasIngresses = ingresses.length > 0;

  // Add Internet/External node
  nodes.push({
    id: 'internet',
    type: 'internetNode',
    position: { x: 0, y: 0 },
    data: {
      type: 'internet',
      name: 'External Traffic',
      resource: null,
      status: 'healthy',
    },
  });
  nodeIds.add('internet');

  // Add Ingress Controller node if present
  if (hasIngressController) {
    const controllerNames = ingressControllerDeployments.map((d) => d.metadata.name);
    const podCount = ingressControllerPods.length;
    const controllerType = ingressControllerDeployments[0]?.metadata.name.includes('nginx')
      ? 'NGINX Ingress'
      : ingressControllerDeployments[0]?.metadata.name.includes('traefik')
      ? 'Traefik'
      : 'Ingress Controller';

    nodes.push({
      id: 'ingress-controller',
      type: 'ingressControllerNode',
      position: { x: 0, y: 0 },
      data: {
        type: 'ingresscontroller',
        name: controllerType,
        namespace: ingressControllerDeployments[0]?.metadata.namespace,
        resource: ingressControllerDeployments[0] || null,
        status: ingressControllerPods.some((p) => getPodStatus(p) === 'healthy') ? 'healthy' : 'warning',
        info: {
          pods: podCount,
          deployments: controllerNames.join(', '),
          services: ingressControllerServices.map((s) => s.metadata.name).join(', '),
        },
      },
    });
    nodeIds.add('ingress-controller');

    edges.push({
      id: 'internet->ingress-controller',
      source: 'internet',
      target: 'ingress-controller',
      animated: true,
      style: { stroke: '#f59e0b', strokeWidth: 3 },
      label: 'HTTP/HTTPS',
    });
  }

  // Add Proxy nodes (nginx, etc.) if present and no ingress controller
  if (hasProxy && !hasIngressController) {
    proxyDeployments.forEach((deployment) => {
      const id = getNodeId('proxy', deployment.metadata.namespace, deployment.metadata.name);
      const { replicas = 0, readyReplicas = 0 } = deployment.status;

      nodes.push({
        id,
        type: 'ingressControllerNode', // Reuse the same visual
        position: { x: 0, y: 0 },
        data: {
          type: 'proxy',
          name: deployment.metadata.name,
          namespace: deployment.metadata.namespace,
          resource: deployment,
          status: getDeploymentStatus(deployment),
          isProxy: true,
          info: {
            replicas: `${readyReplicas}/${replicas}`,
            type: 'Reverse Proxy',
          },
        },
      });
      nodeIds.add(id);

      // Connect Internet to Proxy
      edges.push({
        id: `internet->${id}`,
        source: 'internet',
        target: id,
        animated: true,
        style: { stroke: '#f59e0b', strokeWidth: 2 },
        label: 'HTTP',
      });
    });
  }

  // Add route nodes for each ingress rule
  const routesByService = new Map<string, { hosts: string[]; paths: string[]; ingress: K8sIngress }[]>();

  ingresses.forEach((ingress) => {
    ingress.spec.rules?.forEach((rule) => {
      rule.http?.paths.forEach((pathRule) => {
        const svcKey = `${ingress.metadata.namespace}:${pathRule.backend.service.name}`;
        if (!routesByService.has(svcKey)) {
          routesByService.set(svcKey, []);
        }
        routesByService.get(svcKey)!.push({
          hosts: [rule.host || '*'],
          paths: [pathRule.path],
          ingress,
        });
      });
    });

    if (ingress.spec.defaultBackend?.service) {
      const svcKey = `${ingress.metadata.namespace}:${ingress.spec.defaultBackend.service.name}`;
      if (!routesByService.has(svcKey)) {
        routesByService.set(svcKey, []);
      }
      routesByService.get(svcKey)!.push({
        hosts: ['*'],
        paths: ['/*'],
        ingress,
      });
    }
  });

  // Add route nodes
  routesByService.forEach((routes, svcKey) => {
    const [namespace, serviceName] = svcKey.split(':');
    const allHosts = [...new Set(routes.flatMap((r) => r.hosts))];
    const allPaths = [...new Set(routes.flatMap((r) => r.paths))];

    const routeId = `route:${svcKey}`;
    nodes.push({
      id: routeId,
      type: 'routeNode',
      position: { x: 0, y: 0 },
      data: {
        type: 'route',
        name: allHosts.join(', '),
        namespace,
        resource: routes[0].ingress,
        status: 'healthy',
        info: {
          hosts: allHosts,
          paths: allPaths,
          targetService: serviceName,
        },
      },
    });
    nodeIds.add(routeId);

    if (nodeIds.has('ingress-controller')) {
      edges.push({
        id: `ingress-controller->${routeId}`,
        source: 'ingress-controller',
        target: routeId,
        animated: true,
        style: { stroke: '#8b5cf6' },
        label: allPaths[0],
      });
    }
  });

  // Identify which services are proxy services (to exclude from regular services)
  const proxyServiceNames = new Set(proxyServices.map((s) => `${s.metadata.namespace}:${s.metadata.name}`));

  // Add services - only services relevant to routing topology
  services.forEach((service) => {
    const svcKey = `${service.metadata.namespace}:${service.metadata.name}`;

    // Skip kubernetes system service and proxy services (they're shown as proxy nodes)
    if (service.metadata.name === 'kubernetes') return;
    if (proxyServiceNames.has(svcKey)) return;

    const routeId = `route:${svcKey}`;
    const isRouteBackend = routesByService.has(svcKey);
    const isExternalService = service.spec.type === 'LoadBalancer' || service.spec.type === 'NodePort';
    const isHttpSvc = isHttpService(service);

    // In routing view, only show services that are part of the routing topology:
    // - Route backends (ingress targets)
    // - External services (LoadBalancer/NodePort)
    // - HTTP services when we have a proxy (potential proxy targets)
    const shouldShow = isRouteBackend || isExternalService || (hasProxy && isHttpSvc);
    if (!shouldShow) return;

    const id = getNodeId('service', service.metadata.namespace, service.metadata.name);

    nodes.push({
      id,
      type: 'serviceNode',
      position: { x: 0, y: 0 },
      data: {
        type: 'service',
        name: service.metadata.name,
        namespace: service.metadata.namespace,
        resource: service,
        status: 'healthy',
        info: {
          type: service.spec.type,
          ports: service.spec.ports.map((p) => `${p.port}:${p.targetPort}`).join(', '),
          clusterIP: service.spec.clusterIP || 'None',
        },
      },
    });
    nodeIds.add(id);

    // Connect Route to Service (if has ingress rules)
    if (isRouteBackend && nodeIds.has(routeId)) {
      edges.push({
        id: `${routeId}->${id}`,
        source: routeId,
        target: id,
        animated: true,
        style: { stroke: '#3b82f6' },
      });
    }

    // Connect Internet directly to LoadBalancer/NodePort services
    if (isExternalService && !isRouteBackend) {
      edges.push({
        id: `internet->${id}`,
        source: 'internet',
        target: id,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        label: service.spec.type,
      });
    }

    // Connect Proxy to Service (if we have a proxy but no ingress controller)
    // Only connect to HTTP/web services, not databases
    if (hasProxy && !hasIngressController && !isExternalService && isHttpService(service)) {
      proxyDeployments.forEach((proxy) => {
        const proxyId = getNodeId('proxy', proxy.metadata.namespace, proxy.metadata.name);
        // Only connect if in the same namespace or proxy is in a shared namespace
        if (proxy.metadata.namespace === service.metadata.namespace) {
          edges.push({
            id: `${proxyId}->${id}`,
            source: proxyId,
            target: id,
            animated: true,
            style: { stroke: '#3b82f6' },
          });
        }
      });
    }

    // Connect Service to matching pods
    if (service.spec.selector) {
      pods.forEach((pod) => {
        // Skip proxy pods - they're already shown
        if (isProxyPod(pod)) return;

        if (
          pod.metadata.namespace === service.metadata.namespace &&
          labelsMatch(service.spec.selector!, pod.metadata.labels)
        ) {
          const podId = getNodeId('pod', pod.metadata.namespace, pod.metadata.name);
          const containerCount = pod.spec.containers.length;

          if (!nodeIds.has(podId)) {
            nodes.push({
              id: podId,
              type: 'podNode',
              position: { x: 0, y: 0 },
              data: {
                type: 'pod',
                name: pod.metadata.name,
                namespace: pod.metadata.namespace,
                resource: pod,
                status: getPodStatus(pod),
                info: {
                  phase: pod.status.phase,
                  ip: pod.status.podIP || 'pending',
                  containers: containerCount,
                },
              },
            });
            nodeIds.add(podId);

            // Add container nodes for pods with multiple containers (sidecars)
            if (containerCount > 1) {
              pod.spec.containers.forEach((container, index) => {
                const containerStatus = pod.status.containerStatuses?.find((cs) => cs.name === container.name);
                const containerId = `${podId}:container:${container.name}`;
                const containerPorts = container.ports?.map((p) => p.containerPort).join(', ') || '';
                const containerRestarts = containerStatus?.restartCount || 0;
                const isReady = containerStatus?.ready ?? false;
                const isSidecar = index > 0;
                const isPrivileged = container.securityContext?.privileged === true;

                let status: 'healthy' | 'warning' | 'error' | 'unknown' = 'unknown';
                if (containerStatus) {
                  if (containerStatus.state?.running && isReady) {
                    status = 'healthy';
                  } else if (containerStatus.state?.waiting) {
                    status = 'warning';
                  } else if (containerStatus.state?.terminated) {
                    status = containerStatus.state.terminated.exitCode === 0 ? 'healthy' : 'error';
                  }
                }

                nodes.push({
                  id: containerId,
                  type: 'containerNode',
                  position: { x: 0, y: 0 },
                  data: {
                    type: 'container',
                    name: container.name,
                    namespace: pod.metadata.namespace,
                    resource: pod,
                    status,
                    info: {
                      image: container.image,
                      ports: containerPorts,
                      restarts: containerRestarts,
                      ready: isReady,
                      sidecar: isSidecar,
                      privileged: isPrivileged,
                    },
                  },
                });
                nodeIds.add(containerId);

                edges.push({
                  id: `${podId}->${containerId}`,
                  source: podId,
                  target: containerId,
                  style: {
                    stroke: isSidecar ? '#06b6d4' : '#64748b',
                    strokeWidth: 1,
                  },
                });
              });
            }
          }

          edges.push({
            id: `${id}->${podId}`,
            source: id,
            target: podId,
            animated: true,
            style: { stroke: '#14b8a6' },
          });
        }
      });
    }
  });

  const layoutedNodes = applyDagreLayout(nodes, edges, { rankSpacing: 200 });
  return { nodes: layoutedNodes, edges };
}

// Build the resource-focused view (original)
export function buildResourceGraph(
  data: ClusterData,
  selectedNamespaces: string[]
): { nodes: Node<K8sNodeData>[]; edges: Edge[] } {
  const nodes: Node<K8sNodeData>[] = [];
  const edges: Edge[] = [];
  const nodeIds = new Set<string>();

  const filterByNamespace = <T extends { metadata: { namespace?: string } }>(items: T[]): T[] => {
    if (selectedNamespaces.length === 0) return items;
    return items.filter((item) =>
      selectedNamespaces.includes(item.metadata.namespace || 'default')
    );
  };

  const pods = filterByNamespace(data.pods);
  const services = filterByNamespace(data.services);
  const deployments = filterByNamespace(data.deployments);
  const ingresses = filterByNamespace(data.ingresses);
  const configMaps = filterByNamespace(data.configMaps);
  const secrets = filterByNamespace(data.secrets);

  const ingressServices = new Set<string>();

  // Add Internet node if there are ingresses
  if (ingresses.length > 0) {
    nodes.push({
      id: 'internet',
      type: 'internetNode',
      position: { x: 0, y: 0 },
      data: {
        type: 'internet',
        name: 'Internet',
        resource: null,
        status: 'healthy',
      },
    });
    nodeIds.add('internet');
  }

  // Add Ingress nodes
  ingresses.forEach((ingress) => {
    const id = getNodeId('ingress', ingress.metadata.namespace, ingress.metadata.name);
    const hosts = ingress.spec.rules?.map((r) => r.host).filter(Boolean) || [];

    nodes.push({
      id,
      type: 'ingressNode',
      position: { x: 0, y: 0 },
      data: {
        type: 'ingress',
        name: ingress.metadata.name,
        namespace: ingress.metadata.namespace,
        resource: ingress,
        status: 'healthy',
        info: {
          hosts: hosts.join(', ') || 'default',
          paths: ingress.spec.rules?.flatMap((r) => r.http?.paths.map((p) => p.path) || []).join(', ') || '/',
        },
      },
    });
    nodeIds.add(id);

    edges.push({
      id: `internet->${id}`,
      source: 'internet',
      target: id,
      animated: true,
      style: { stroke: '#8b5cf6' },
    });

    if (ingress.spec.defaultBackend?.service) {
      const svcKey = `${ingress.metadata.namespace}:${ingress.spec.defaultBackend.service.name}`;
      ingressServices.add(svcKey);
    }
    ingress.spec.rules?.forEach((rule) => {
      rule.http?.paths.forEach((path) => {
        const svcKey = `${ingress.metadata.namespace}:${path.backend.service.name}`;
        ingressServices.add(svcKey);
      });
    });
  });

  // Add Deployment nodes - mark ingress controllers and proxies
  deployments.forEach((deployment) => {
    const id = getNodeId('deployment', deployment.metadata.namespace, deployment.metadata.name);
    const { replicas = 0, readyReplicas = 0 } = deployment.status;
    const isController = isIngressControllerDeployment(deployment);
    const isProxy = isProxyDeployment(deployment);

    nodes.push({
      id,
      type: isController || isProxy ? 'ingressControllerNode' : 'deploymentNode',
      position: { x: 0, y: 0 },
      data: {
        type: isController ? 'ingresscontroller' : isProxy ? 'proxy' : 'deployment',
        name: deployment.metadata.name,
        namespace: deployment.metadata.namespace,
        resource: deployment,
        status: getDeploymentStatus(deployment),
        isIngressController: isController,
        isProxy: isProxy,
        info: {
          replicas: `${readyReplicas}/${replicas}`,
          strategy: deployment.spec.template.spec.containers[0]?.image || 'unknown',
        },
      },
    });
    nodeIds.add(id);
  });

  // Add Service nodes
  services.forEach((service) => {
    const id = getNodeId('service', service.metadata.namespace, service.metadata.name);

    nodes.push({
      id,
      type: 'serviceNode',
      position: { x: 0, y: 0 },
      data: {
        type: 'service',
        name: service.metadata.name,
        namespace: service.metadata.namespace,
        resource: service,
        status: 'healthy',
        info: {
          type: service.spec.type,
          ports: service.spec.ports.map((p) => `${p.port}:${p.targetPort}`).join(', '),
          clusterIP: service.spec.clusterIP || 'None',
        },
      },
    });
    nodeIds.add(id);

    const svcKey = `${service.metadata.namespace}:${service.metadata.name}`;
    if (ingressServices.has(svcKey)) {
      ingresses.forEach((ingress) => {
        const ingressId = getNodeId('ingress', ingress.metadata.namespace, ingress.metadata.name);
        const hasBackend =
          ingress.spec.defaultBackend?.service.name === service.metadata.name ||
          ingress.spec.rules?.some((rule) =>
            rule.http?.paths.some((path) => path.backend.service.name === service.metadata.name)
          );

        if (hasBackend && ingress.metadata.namespace === service.metadata.namespace) {
          edges.push({
            id: `${ingressId}->${id}`,
            source: ingressId,
            target: id,
            animated: true,
            style: { stroke: '#3b82f6' },
          });
        }
      });
    }
  });

  // Add Pod nodes
  pods.forEach((pod) => {
    const id = getNodeId('pod', pod.metadata.namespace, pod.metadata.name);
    const restarts = pod.status.containerStatuses?.reduce((sum, c) => sum + c.restartCount, 0) || 0;
    const isController = isIngressController(pod);
    const isProxy = isProxyPod(pod);
    const containerCount = pod.spec.containers.length;

    nodes.push({
      id,
      type: 'podNode',
      position: { x: 0, y: 0 },
      data: {
        type: 'pod',
        name: pod.metadata.name,
        namespace: pod.metadata.namespace,
        resource: pod,
        status: getPodStatus(pod),
        isIngressController: isController,
        isProxy: isProxy,
        info: {
          phase: pod.status.phase,
          restarts,
          ip: pod.status.podIP || 'pending',
          containers: containerCount,
        },
      },
    });
    nodeIds.add(id);

    // Add container nodes for pods with multiple containers (sidecars)
    if (containerCount > 1) {
      pod.spec.containers.forEach((container, index) => {
        const containerStatus = pod.status.containerStatuses?.find((cs) => cs.name === container.name);
        const containerId = `${id}:container:${container.name}`;
        const containerPorts = container.ports?.map((p) => p.containerPort).join(', ') || '';
        const containerRestarts = containerStatus?.restartCount || 0;
        const isReady = containerStatus?.ready ?? false;

        // Determine if this is a sidecar (not the first/main container)
        const isSidecar = index > 0;

        // Check if container is privileged
        const isPrivileged = container.securityContext?.privileged === true;

        // Get container status
        let status: 'healthy' | 'warning' | 'error' | 'unknown' = 'unknown';
        if (containerStatus) {
          if (containerStatus.state?.running && isReady) {
            status = 'healthy';
          } else if (containerStatus.state?.waiting) {
            status = 'warning';
          } else if (containerStatus.state?.terminated) {
            status = containerStatus.state.terminated.exitCode === 0 ? 'healthy' : 'error';
          }
        }

        nodes.push({
          id: containerId,
          type: 'containerNode',
          position: { x: 0, y: 0 },
          data: {
            type: 'container',
            name: container.name,
            namespace: pod.metadata.namespace,
            resource: pod,
            status,
            info: {
              image: container.image,
              ports: containerPorts,
              restarts: containerRestarts,
              ready: isReady,
              sidecar: isSidecar,
              privileged: isPrivileged,
            },
          },
        });
        nodeIds.add(containerId);

        // Connect pod to container
        edges.push({
          id: `${id}->${containerId}`,
          source: id,
          target: containerId,
          style: {
            stroke: isSidecar ? '#06b6d4' : '#64748b',
            strokeWidth: 1,
          },
        });
      });
    }

    pod.metadata.ownerReferences?.forEach((owner) => {
      if (owner.kind === 'ReplicaSet') {
        const deploymentName = owner.name.replace(/-[a-f0-9]+$/, '');
        const deploymentId = getNodeId('deployment', pod.metadata.namespace, deploymentName);
        if (nodeIds.has(deploymentId)) {
          edges.push({
            id: `${deploymentId}->${id}`,
            source: deploymentId,
            target: id,
            style: { stroke: '#22c55e', strokeDasharray: '5,5' },
          });
        }
      }
    });

    services.forEach((service) => {
      if (
        service.metadata.namespace === pod.metadata.namespace &&
        service.spec.selector &&
        labelsMatch(service.spec.selector, pod.metadata.labels)
      ) {
        const serviceId = getNodeId('service', service.metadata.namespace, service.metadata.name);
        edges.push({
          id: `${serviceId}->${id}`,
          source: serviceId,
          target: id,
          animated: true,
          style: { stroke: '#14b8a6' },
        });
      }
    });
  });

  // ConfigMaps and Secrets
  const referencedConfigMaps = new Set<string>();
  pods.forEach((pod) => {
    pod.spec.volumes?.forEach((vol) => {
      if (vol.configMap) {
        referencedConfigMaps.add(`${pod.metadata.namespace}:${vol.configMap.name}`);
      }
    });
    pod.spec.containers.forEach((container) => {
      container.env?.forEach((env) => {
        if (env.valueFrom?.configMapKeyRef) {
          referencedConfigMaps.add(`${pod.metadata.namespace}:${env.valueFrom.configMapKeyRef.name}`);
        }
      });
    });
  });

  configMaps
    .filter((cm) => referencedConfigMaps.has(`${cm.metadata.namespace}:${cm.metadata.name}`))
    .forEach((configMap) => {
      const id = getNodeId('configmap', configMap.metadata.namespace, configMap.metadata.name);
      const keyCount = Object.keys(configMap.data || {}).length;

      nodes.push({
        id,
        type: 'configmapNode',
        position: { x: 0, y: 0 },
        data: {
          type: 'configmap',
          name: configMap.metadata.name,
          namespace: configMap.metadata.namespace,
          resource: configMap,
          status: 'healthy',
          info: { keys: keyCount },
        },
      });
      nodeIds.add(id);
    });

  const referencedSecrets = new Set<string>();
  pods.forEach((pod) => {
    pod.spec.volumes?.forEach((vol) => {
      if (vol.secret && !vol.secret.secretName.includes('token')) {
        referencedSecrets.add(`${pod.metadata.namespace}:${vol.secret.secretName}`);
      }
    });
    pod.spec.containers.forEach((container) => {
      container.env?.forEach((env) => {
        if (env.valueFrom?.secretKeyRef) {
          referencedSecrets.add(`${pod.metadata.namespace}:${env.valueFrom.secretKeyRef.name}`);
        }
      });
    });
  });

  secrets
    .filter(
      (secret) =>
        referencedSecrets.has(`${secret.metadata.namespace}:${secret.metadata.name}`) &&
        !secret.type.includes('service-account-token')
    )
    .forEach((secret) => {
      const id = getNodeId('secret', secret.metadata.namespace, secret.metadata.name);
      const keyCount = Object.keys(secret.data || {}).length;

      nodes.push({
        id,
        type: 'secretNode',
        position: { x: 0, y: 0 },
        data: {
          type: 'secret',
          name: secret.metadata.name,
          namespace: secret.metadata.namespace,
          resource: secret,
          status: 'healthy',
          info: { keys: keyCount, type: secret.type },
        },
      });
      nodeIds.add(id);
    });

  // PersistentVolumeClaims
  const referencedPVCs = new Set<string>();
  pods.forEach((pod) => {
    pod.spec.volumes?.forEach((vol) => {
      if (vol.persistentVolumeClaim) {
        referencedPVCs.add(`${pod.metadata.namespace}:${vol.persistentVolumeClaim.claimName}`);
      }
    });
  });

  const pvcs = filterByNamespace(data.persistentVolumeClaims);
  pvcs
    .filter((pvc) => referencedPVCs.has(`${pvc.metadata.namespace}:${pvc.metadata.name}`))
    .forEach((pvc) => {
      const id = getNodeId('pvc', pvc.metadata.namespace, pvc.metadata.name);
      const status = pvc.status?.phase === 'Bound' ? 'healthy' : pvc.status?.phase === 'Pending' ? 'warning' : 'error';

      nodes.push({
        id,
        type: 'pvcNode',
        position: { x: 0, y: 0 },
        data: {
          type: 'pvc',
          name: pvc.metadata.name,
          namespace: pvc.metadata.namespace,
          resource: pvc,
          status,
          info: {
            storage: pvc.spec.resources.requests.storage,
            accessModes: pvc.spec.accessModes.join(', '),
            storageClass: pvc.spec.storageClassName || 'default',
            phase: pvc.status?.phase || 'Unknown',
          },
        },
      });
      nodeIds.add(id);
    });

  // Connect pods to their config resources
  pods.forEach((pod) => {
    const podId = getNodeId('pod', pod.metadata.namespace, pod.metadata.name);

    pod.spec.volumes?.forEach((vol) => {
      if (vol.configMap) {
        const cmId = getNodeId('configmap', pod.metadata.namespace, vol.configMap.name);
        if (nodeIds.has(cmId)) {
          edges.push({
            id: `${podId}->${cmId}`,
            source: podId,
            target: cmId,
            style: { stroke: '#f97316', strokeDasharray: '3,3' },
          });
        }
      }
      if (vol.secret && !vol.secret.secretName.includes('token')) {
        const secretId = getNodeId('secret', pod.metadata.namespace, vol.secret.secretName);
        if (nodeIds.has(secretId)) {
          edges.push({
            id: `${podId}->${secretId}`,
            source: podId,
            target: secretId,
            style: { stroke: '#ef4444', strokeDasharray: '3,3' },
          });
        }
      }
      if (vol.persistentVolumeClaim) {
        const pvcId = getNodeId('pvc', pod.metadata.namespace, vol.persistentVolumeClaim.claimName);
        if (nodeIds.has(pvcId)) {
          edges.push({
            id: `${podId}->${pvcId}`,
            source: podId,
            target: pvcId,
            style: { stroke: '#8b5cf6', strokeDasharray: '3,3' },
          });
        }
      }
    });
  });

  // NetworkPolicies - show policies and connect to affected pods
  const networkPolicies = filterByNamespace(data.networkPolicies);
  networkPolicies.forEach((policy) => {
    const id = getNodeId('networkpolicy', policy.metadata.namespace, policy.metadata.name);
    const policyTypes = policy.spec.policyTypes || [];
    const ingressRules = policy.spec.ingress?.length || 0;
    const egressRules = policy.spec.egress?.length || 0;

    // Find pods affected by this policy (matching podSelector)
    const affectedPods = pods.filter((pod) => {
      if (pod.metadata.namespace !== policy.metadata.namespace) return false;
      const selector = policy.spec.podSelector.matchLabels || {};
      // Empty selector matches all pods in namespace
      if (Object.keys(selector).length === 0) return true;
      return labelsMatch(selector, pod.metadata.labels);
    });

    nodes.push({
      id,
      type: 'networkpolicyNode',
      position: { x: 0, y: 0 },
      data: {
        type: 'networkpolicy',
        name: policy.metadata.name,
        namespace: policy.metadata.namespace,
        resource: policy,
        status: 'healthy',
        info: {
          policyTypes,
          ingressRules,
          egressRules,
          targetPods: affectedPods.length,
        },
      },
    });
    nodeIds.add(id);

    // Connect policy to affected pods
    affectedPods.forEach((pod) => {
      const podId = getNodeId('pod', pod.metadata.namespace, pod.metadata.name);
      if (nodeIds.has(podId)) {
        edges.push({
          id: `${id}->${podId}`,
          source: id,
          target: podId,
          style: { stroke: '#10b981', strokeDasharray: '5,3' },
          label: policyTypes.includes('Ingress') && policyTypes.includes('Egress') ? 'I/E' :
                 policyTypes.includes('Ingress') ? 'In' : 'Out',
          labelStyle: { fontSize: 8, fill: '#10b981' },
          labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
        });
      }
    });
  });

  const layoutedNodes = applyDagreLayout(nodes, edges);
  return { nodes: layoutedNodes, edges };
}

// Main entry point - choose view mode
export function buildGraph(
  data: ClusterData,
  selectedNamespaces: string[],
  viewMode: ViewMode = 'resources'
): { nodes: Node<K8sNodeData>[]; edges: Edge[] } {
  if (viewMode === 'routing') {
    return buildRoutingGraph(data, selectedNamespaces);
  }
  return buildResourceGraph(data, selectedNamespaces);
}
