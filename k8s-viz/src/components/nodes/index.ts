import { InternetNode } from './InternetNode';
import { IngressNode } from './IngressNode';
import { IngressControllerNode } from './IngressControllerNode';
import { RouteNode } from './RouteNode';
import { ServiceNode } from './ServiceNode';
import { DeploymentNode } from './DeploymentNode';
import { PodNode } from './PodNode';
import { ContainerNode } from './ContainerNode';
import { ConfigMapNode } from './ConfigMapNode';
import { SecretNode } from './SecretNode';
import { PvcNode } from './PvcNode';
import { NetworkPolicyNode } from './NetworkPolicyNode';

export {
  InternetNode,
  IngressNode,
  IngressControllerNode,
  RouteNode,
  ServiceNode,
  DeploymentNode,
  PodNode,
  ContainerNode,
  ConfigMapNode,
  SecretNode,
  PvcNode,
  NetworkPolicyNode,
};

export const nodeTypes = {
  internetNode: InternetNode,
  ingressNode: IngressNode,
  ingressControllerNode: IngressControllerNode,
  routeNode: RouteNode,
  serviceNode: ServiceNode,
  deploymentNode: DeploymentNode,
  podNode: PodNode,
  containerNode: ContainerNode,
  configmapNode: ConfigMapNode,
  secretNode: SecretNode,
  pvcNode: PvcNode,
  networkpolicyNode: NetworkPolicyNode,
};
