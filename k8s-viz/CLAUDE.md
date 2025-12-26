# Claude Context for K8s Visualizer

## Project Overview

This is a Next.js 14 application that visualizes Kubernetes clusters using React Flow. It connects to the K8s API via `kubectl proxy` and renders an interactive graph of cluster resources.

## Key Architecture Decisions

### Data Flow
1. `kubectl proxy` runs on localhost:8001
2. Next.js API route (`/api/k8s`) fetches all resources in parallel
3. `graph-builder.ts` transforms K8s resources into React Flow nodes/edges
4. `layout.ts` applies dagre algorithm for hierarchical positioning
5. Custom node components render each resource type

### Two View Modes
- **Routing View**: Traffic-focused, shows ingress → service → pod flow
- **Resources View**: All resources with deployment/config relationships

### HTTP Service Detection
The routing view uses `isHttpService()` to filter out databases:
- `NON_HTTP_PORTS` set excludes 5432 (postgres), 3306 (mysql), 6379 (redis), etc.
- Only HTTP-looking services (ports 80, 443, 3000-9999) connect to proxies

### Container Visualization
Multi-container pods show child nodes for each container:
- First container = main (slate color)
- Subsequent containers = sidecars (cyan color)
- Privileged containers show warning icon

## Important Files

| File | Purpose |
|------|---------|
| `src/lib/graph-builder.ts` | Core logic for building the visualization graph |
| `src/lib/k8s-client.ts` | K8s API client (fetches pods, services, etc.) |
| `src/components/KubeFlow.tsx` | Main visualization component with controls |
| `src/components/DetailsPanel.tsx` | Sidebar showing resource details |
| `src/types/k8s.ts` | TypeScript types for all K8s resources |
| `src/components/nodes/` | Custom React Flow node components |

## Common Tasks

### Adding a new K8s resource type
1. Add type to `src/types/k8s.ts`
2. Add fetch function to `src/lib/k8s-client.ts`
3. Update `ClusterData` interface and `getAllClusterData()`
4. Add node type to `graph-builder.ts` (`NodeType` union)
5. Create node component in `src/components/nodes/`
6. Register in `src/components/nodes/index.ts`
7. Add details component to `DetailsPanel.tsx`

### Modifying routing logic
- Proxy detection: `PROXY_PATTERNS` in graph-builder.ts
- Ingress controller detection: `INGRESS_CONTROLLER_PATTERNS`
- HTTP service filtering: `isHttpService()` and `NON_HTTP_PORTS`

### Changing node appearance
- Node components are in `src/components/nodes/`
- Colors defined inline with Tailwind classes
- Status colors: green (healthy), yellow (warning), red (error), gray (unknown)

## Running the Project

```bash
# Terminal 1: Start kubectl proxy
kubectl proxy

# Terminal 2: Start dev server
cd k8s-viz
npm run dev
```

Open http://localhost:3000

## Dependencies

- `next` 14 - React framework
- `reactflow` - Graph visualization
- `dagre` - Layout algorithm (via `@dagrejs/dagre`)
- `lucide-react` - Icons
- `tailwindcss` - Styling

## Known Patterns

### Label Matching
Services connect to pods via label selectors. The `labelsMatch()` function checks if all selector key-values exist in pod labels.

### Owner References
Pods link to Deployments via `ownerReferences`. The code extracts deployment name by stripping the ReplicaSet hash suffix.

### Namespace Filtering
All graph builders accept `selectedNamespaces` array. Empty array = all namespaces.

## Future Work Discussed

- Live network traces to show actual traffic (needs eBPF or sidecar)
- NetworkPolicy impact visualization (show blocked connections in red)
- Better visualization of which services can access postgres
