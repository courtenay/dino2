// Kubernetes resource types

export interface K8sMetadata {
  name: string;
  namespace?: string;
  uid: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  creationTimestamp?: string;
  ownerReferences?: Array<{
    apiVersion: string;
    kind: string;
    name: string;
    uid: string;
  }>;
}

export interface K8sProbe {
  httpGet?: { path: string; port: number | string; scheme?: string };
  tcpSocket?: { port: number | string };
  exec?: { command: string[] };
  initialDelaySeconds?: number;
  periodSeconds?: number;
  timeoutSeconds?: number;
  successThreshold?: number;
  failureThreshold?: number;
}

export interface K8sResources {
  limits?: { cpu?: string; memory?: string };
  requests?: { cpu?: string; memory?: string };
}

export interface K8sPod {
  kind: 'Pod';
  apiVersion: string;
  metadata: K8sMetadata;
  spec: {
    containers: Array<{
      name: string;
      image: string;
      ports?: Array<{ containerPort: number; protocol?: string; name?: string }>;
      env?: Array<{
        name: string;
        value?: string;
        valueFrom?: {
          secretKeyRef?: { name: string; key: string };
          configMapKeyRef?: { name: string; key: string };
        };
      }>;
      volumeMounts?: Array<{ name: string; mountPath: string; readOnly?: boolean; subPath?: string }>;
      securityContext?: {
        privileged?: boolean;
        runAsUser?: number;
        runAsGroup?: number;
        runAsNonRoot?: boolean;
        capabilities?: {
          add?: string[];
          drop?: string[];
        };
      };
      resources?: K8sResources;
      livenessProbe?: K8sProbe;
      readinessProbe?: K8sProbe;
      startupProbe?: K8sProbe;
    }>;
    volumes?: Array<{
      name: string;
      secret?: { secretName: string };
      configMap?: { name: string };
      persistentVolumeClaim?: { claimName: string };
      emptyDir?: Record<string, unknown>;
      hostPath?: { path: string; type?: string };
    }>;
    nodeName?: string;
  };
  status: {
    phase: 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';
    conditions?: Array<{
      type: string;
      status: string;
      reason?: string;
      message?: string;
    }>;
    containerStatuses?: Array<{
      name: string;
      ready: boolean;
      restartCount: number;
      state: {
        running?: { startedAt: string };
        waiting?: { reason: string; message?: string };
        terminated?: { exitCode: number; reason?: string };
      };
    }>;
    podIP?: string;
  };
}

export interface K8sService {
  kind: 'Service';
  apiVersion: string;
  metadata: K8sMetadata;
  spec: {
    type: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName';
    selector?: Record<string, string>;
    ports: Array<{
      name?: string;
      port: number;
      targetPort: number | string;
      nodePort?: number;
      protocol?: string;
    }>;
    clusterIP?: string;
    externalIPs?: string[];
    loadBalancerIP?: string;
  };
  status?: {
    loadBalancer?: {
      ingress?: Array<{ ip?: string; hostname?: string }>;
    };
  };
}

export interface K8sDeployment {
  kind: 'Deployment';
  apiVersion: string;
  metadata: K8sMetadata;
  spec: {
    replicas: number;
    selector: {
      matchLabels: Record<string, string>;
    };
    template: {
      metadata: { labels: Record<string, string> };
      spec: K8sPod['spec'];
    };
  };
  status: {
    replicas?: number;
    readyReplicas?: number;
    availableReplicas?: number;
    unavailableReplicas?: number;
    conditions?: Array<{
      type: string;
      status: string;
      reason?: string;
      message?: string;
    }>;
  };
}

export interface K8sIngress {
  kind: 'Ingress';
  apiVersion: string;
  metadata: K8sMetadata;
  spec: {
    ingressClassName?: string;
    defaultBackend?: {
      service: { name: string; port: { number?: number; name?: string } };
    };
    rules?: Array<{
      host?: string;
      http?: {
        paths: Array<{
          path: string;
          pathType: 'Prefix' | 'Exact' | 'ImplementationSpecific';
          backend: {
            service: { name: string; port: { number?: number; name?: string } };
          };
        }>;
      };
    }>;
    tls?: Array<{
      hosts?: string[];
      secretName?: string;
    }>;
  };
  status?: {
    loadBalancer?: {
      ingress?: Array<{ ip?: string; hostname?: string }>;
    };
  };
}

export interface K8sConfigMap {
  kind: 'ConfigMap';
  apiVersion: string;
  metadata: K8sMetadata;
  data?: Record<string, string>;
  binaryData?: Record<string, string>;
}

export interface K8sSecret {
  kind: 'Secret';
  apiVersion: string;
  metadata: K8sMetadata;
  type: string;
  data?: Record<string, string>;
  stringData?: Record<string, string>;
}

export interface K8sPersistentVolumeClaim {
  kind: 'PersistentVolumeClaim';
  apiVersion: string;
  metadata: K8sMetadata;
  spec: {
    accessModes: string[];
    resources: {
      requests: { storage: string };
    };
    storageClassName?: string;
    volumeName?: string;
    volumeMode?: string;
  };
  status?: {
    phase: 'Pending' | 'Bound' | 'Lost';
    capacity?: { storage: string };
    accessModes?: string[];
  };
}

export interface K8sNetworkPolicy {
  kind: 'NetworkPolicy';
  apiVersion: string;
  metadata: K8sMetadata;
  spec: {
    podSelector: {
      matchLabels?: Record<string, string>;
      matchExpressions?: Array<{
        key: string;
        operator: string;
        values?: string[];
      }>;
    };
    policyTypes?: Array<'Ingress' | 'Egress'>;
    ingress?: Array<{
      from?: Array<{
        podSelector?: { matchLabels?: Record<string, string> };
        namespaceSelector?: { matchLabels?: Record<string, string> };
        ipBlock?: { cidr: string; except?: string[] };
      }>;
      ports?: Array<{
        protocol?: string;
        port?: number | string;
        endPort?: number;
      }>;
    }>;
    egress?: Array<{
      to?: Array<{
        podSelector?: { matchLabels?: Record<string, string> };
        namespaceSelector?: { matchLabels?: Record<string, string> };
        ipBlock?: { cidr: string; except?: string[] };
      }>;
      ports?: Array<{
        protocol?: string;
        port?: number | string;
        endPort?: number;
      }>;
    }>;
  };
}

export type K8sResource = K8sPod | K8sService | K8sDeployment | K8sIngress | K8sConfigMap | K8sSecret | K8sPersistentVolumeClaim | K8sNetworkPolicy;

export interface K8sResourceList<T> {
  kind: string;
  apiVersion: string;
  metadata: { resourceVersion?: string };
  items: T[];
}

export interface ClusterData {
  pods: K8sPod[];
  services: K8sService[];
  deployments: K8sDeployment[];
  ingresses: K8sIngress[];
  configMaps: K8sConfigMap[];
  secrets: K8sSecret[];
  persistentVolumeClaims: K8sPersistentVolumeClaim[];
  networkPolicies: K8sNetworkPolicy[];
  namespaces: string[];
}
