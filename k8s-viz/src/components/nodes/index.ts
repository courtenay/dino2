import { InternetNode } from './InternetNode';
import { IngressNode } from './IngressNode';
import { IngressControllerNode } from './IngressControllerNode';
import { RouteNode } from './RouteNode';
import { ServiceNode } from './ServiceNode';
import { DeploymentNode } from './DeploymentNode';
import { PodNode } from './PodNode';
import { ConfigMapNode } from './ConfigMapNode';
import { SecretNode } from './SecretNode';

export {
  InternetNode,
  IngressNode,
  IngressControllerNode,
  RouteNode,
  ServiceNode,
  DeploymentNode,
  PodNode,
  ConfigMapNode,
  SecretNode,
};

export const nodeTypes = {
  internetNode: InternetNode,
  ingressNode: IngressNode,
  ingressControllerNode: IngressControllerNode,
  routeNode: RouteNode,
  serviceNode: ServiceNode,
  deploymentNode: DeploymentNode,
  podNode: PodNode,
  configmapNode: ConfigMapNode,
  secretNode: SecretNode,
};
