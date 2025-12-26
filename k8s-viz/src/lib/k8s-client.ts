import type {
  K8sPod,
  K8sService,
  K8sDeployment,
  K8sIngress,
  K8sConfigMap,
  K8sSecret,
  K8sPersistentVolumeClaim,
  K8sNetworkPolicy,
  K8sResourceList,
  ClusterData,
} from '@/types/k8s';

const KUBE_PROXY_URL = process.env.KUBE_PROXY_URL || 'http://localhost:8001';

async function fetchK8s<T>(path: string): Promise<T> {
  const response = await fetch(`${KUBE_PROXY_URL}${path}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`K8s API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getNamespaces(): Promise<string[]> {
  const result = await fetchK8s<K8sResourceList<{ metadata: { name: string } }>>(
    '/api/v1/namespaces'
  );
  return result.items.map((ns) => ns.metadata.name);
}

export async function getPods(namespace?: string): Promise<K8sPod[]> {
  const path = namespace
    ? `/api/v1/namespaces/${namespace}/pods`
    : '/api/v1/pods';
  const result = await fetchK8s<K8sResourceList<K8sPod>>(path);
  return result.items;
}

export async function getServices(namespace?: string): Promise<K8sService[]> {
  const path = namespace
    ? `/api/v1/namespaces/${namespace}/services`
    : '/api/v1/services';
  const result = await fetchK8s<K8sResourceList<K8sService>>(path);
  return result.items;
}

export async function getDeployments(namespace?: string): Promise<K8sDeployment[]> {
  const path = namespace
    ? `/apis/apps/v1/namespaces/${namespace}/deployments`
    : '/apis/apps/v1/deployments';
  const result = await fetchK8s<K8sResourceList<K8sDeployment>>(path);
  return result.items;
}

export async function getIngresses(namespace?: string): Promise<K8sIngress[]> {
  const path = namespace
    ? `/apis/networking.k8s.io/v1/namespaces/${namespace}/ingresses`
    : '/apis/networking.k8s.io/v1/ingresses';
  const result = await fetchK8s<K8sResourceList<K8sIngress>>(path);
  return result.items;
}

export async function getConfigMaps(namespace?: string): Promise<K8sConfigMap[]> {
  const path = namespace
    ? `/api/v1/namespaces/${namespace}/configmaps`
    : '/api/v1/configmaps';
  const result = await fetchK8s<K8sResourceList<K8sConfigMap>>(path);
  return result.items;
}

export async function getSecrets(namespace?: string): Promise<K8sSecret[]> {
  const path = namespace
    ? `/api/v1/namespaces/${namespace}/secrets`
    : '/api/v1/secrets';
  const result = await fetchK8s<K8sResourceList<K8sSecret>>(path);
  return result.items;
}

export async function getPersistentVolumeClaims(namespace?: string): Promise<K8sPersistentVolumeClaim[]> {
  const path = namespace
    ? `/api/v1/namespaces/${namespace}/persistentvolumeclaims`
    : '/api/v1/persistentvolumeclaims';
  const result = await fetchK8s<K8sResourceList<K8sPersistentVolumeClaim>>(path);
  return result.items;
}

export async function getNetworkPolicies(namespace?: string): Promise<K8sNetworkPolicy[]> {
  const path = namespace
    ? `/apis/networking.k8s.io/v1/namespaces/${namespace}/networkpolicies`
    : '/apis/networking.k8s.io/v1/networkpolicies';
  const result = await fetchK8s<K8sResourceList<K8sNetworkPolicy>>(path);
  return result.items;
}

export async function getAllClusterData(): Promise<ClusterData> {
  const [namespaces, pods, services, deployments, ingresses, configMaps, secrets, persistentVolumeClaims, networkPolicies] =
    await Promise.all([
      getNamespaces(),
      getPods(),
      getServices(),
      getDeployments(),
      getIngresses(),
      getConfigMaps(),
      getSecrets(),
      getPersistentVolumeClaims(),
      getNetworkPolicies(),
    ]);

  return {
    namespaces,
    pods,
    services,
    deployments,
    ingresses,
    configMaps,
    secrets,
    persistentVolumeClaims,
    networkPolicies,
  };
}
