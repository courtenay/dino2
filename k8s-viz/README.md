# K8s Visualizer

A Next.js web application that visualizes your Kubernetes cluster using React Flow. Designed to make K8s infrastructure understandable for people unfamiliar with Kubernetes concepts.

## Features

### Two View Modes

**Routing View** - Shows traffic flow through your cluster:
- External Traffic → Ingress Controllers/Proxies → Services → Pods
- Filters out non-HTTP services (databases, caches) for a clean topology
- Detects nginx, traefik, haproxy as reverse proxies

**Resources View** - Shows all K8s resources and their relationships:
- Deployments → Pods → Containers
- Services → Pods (via label selectors)
- Pods → ConfigMaps, Secrets, PVCs
- NetworkPolicies → affected Pods

### Resource Types Visualized

| Resource | Color | Description |
|----------|-------|-------------|
| External Traffic | Gray | Entry point for external requests |
| Ingress Controller | Amber | nginx-ingress, traefik, etc. |
| Reverse Proxy | Orange | Standalone nginx, haproxy |
| Ingress | Purple | Ingress resource rules |
| Route | Violet | Individual routing paths |
| Service | Blue | ClusterIP, NodePort, LoadBalancer |
| Deployment | Green | Deployment with replica info |
| Pod | Teal | Pod with status and IP |
| Container | Slate/Cyan | Individual containers (cyan for sidecars) |
| ConfigMap | Orange | Configuration data |
| Secret | Red | Sensitive data (keys only) |
| PVC | Violet | Persistent storage claims |
| NetworkPolicy | Emerald | Network access rules |

### Detail Panels

Click any node to see detailed information:
- **Pods**: Phase, IP, node, all containers
- **Containers**: Image, resources (CPU/memory), probes, volumes, env vars, security context
- **Services**: Type, ports, selectors
- **NetworkPolicies**: Ingress/egress rules, affected pods

## Prerequisites

- Node.js 18+
- A running Kubernetes cluster (local or remote)
- `kubectl` configured with cluster access

## Quick Start

1. **Start kubectl proxy** (in a separate terminal):
   ```bash
   kubectl proxy
   ```
   This exposes the K8s API at `http://localhost:8001`

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open the visualizer**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KUBE_PROXY_URL` | `http://localhost:8001` | kubectl proxy URL |

### Namespace Filtering

Use the namespace dropdown to filter resources by namespace. Select multiple namespaces or "All Namespaces" to see everything.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser (React Flow Visualization)                     │
├─────────────────────────────────────────────────────────┤
│  Next.js App (App Router)                               │
│  ├── /api/k8s - Fetches all K8s resources              │
│  └── / - Main visualization page                        │
├─────────────────────────────────────────────────────────┤
│  kubectl proxy (localhost:8001)                         │
├─────────────────────────────────────────────────────────┤
│  Kubernetes Cluster                                     │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── app/
│   ├── api/k8s/route.ts    # K8s API endpoint
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── KubeFlow.tsx        # Main visualization
│   ├── DetailsPanel.tsx    # Resource details sidebar
│   ├── NamespaceFilter.tsx
│   └── nodes/              # Custom React Flow nodes
│       ├── PodNode.tsx
│       ├── ServiceNode.tsx
│       ├── ContainerNode.tsx
│       ├── NetworkPolicyNode.tsx
│       └── ...
├── lib/
│   ├── k8s-client.ts       # K8s API client
│   ├── graph-builder.ts    # Converts K8s → React Flow
│   └── layout.ts           # Dagre layout algorithm
└── types/
    └── k8s.ts              # TypeScript types
```

## Development

```bash
# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type check
npx tsc --noEmit
```

## Future Enhancements

- [ ] Live network traffic visualization (requires eBPF/sidecar)
- [ ] Network policy impact analysis (show blocked connections)
- [ ] Resource usage metrics (CPU/memory graphs)
- [ ] Multi-cluster support
- [ ] Export diagram as image/PDF
