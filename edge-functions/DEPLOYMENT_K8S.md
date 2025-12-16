# Kubernetes Deployment Guide

Deploy Craft Local Edge Functions to Kubernetes.

## Prerequisites

- Kubernetes cluster (1.19+)
- `kubectl` configured
- Docker registry access
- Helm (optional, recommended)

## Deployment Steps

### 1. Build and Push Image

```bash
# Build image
docker build -t craftlocal/edge-functions:v1.0.0 .

# Tag for your registry
docker tag craftlocal/edge-functions:v1.0.0 registry.craftlocal.net/edge-functions:v1.0.0

# Push to registry
docker push registry.craftlocal.net/edge-functions:v1.0.0
```

### 2. Create Namespace

```bash
kubectl create namespace craftlocal
```

### 3. Create Secrets

```bash
# Create secret from .env file
kubectl create secret generic edge-functions-secrets \
  --from-env-file=.env \
  --namespace=craftlocal

# Or create individual secrets
kubectl create secret generic edge-functions-secrets \
  --from-literal=SUPABASE_URL="https://api.craftlocal.net" \
  --from-literal=SUPABASE_ANON_KEY="your-anon-key" \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  --from-literal=STRIPE_SECRET_KEY="your-stripe-key" \
  --from-literal=OPENAI_API_KEY="your-openai-key" \
  --namespace=craftlocal
```

### 4. Deploy Application

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: edge-functions
  namespace: craftlocal
  labels:
    app: edge-functions
    version: v1.0.0
spec:
  replicas: 3
  selector:
    matchLabels:
      app: edge-functions
  template:
    metadata:
      labels:
        app: edge-functions
        version: v1.0.0
    spec:
      containers:
      - name: edge-functions
        image: registry.craftlocal.net/edge-functions:v1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 8000
          name: http
          protocol: TCP
        env:
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: edge-functions-secrets
              key: SUPABASE_URL
        - name: SUPABASE_ANON_KEY
          valueFrom:
            secretKeyRef:
              name: edge-functions-secrets
              key: SUPABASE_ANON_KEY
        - name: SUPABASE_SERVICE_ROLE_KEY
          valueFrom:
            secretKeyRef:
              name: edge-functions-secrets
              key: SUPABASE_SERVICE_ROLE_KEY
        - name: STRIPE_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: edge-functions-secrets
              key: STRIPE_SECRET_KEY
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: edge-functions-secrets
              key: OPENAI_API_KEY
        - name: PORT
          value: "8000"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /_health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /_health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          readOnlyRootFilesystem: false
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - ALL
---
apiVersion: v1
kind: Service
metadata:
  name: edge-functions
  namespace: craftlocal
  labels:
    app: edge-functions
spec:
  type: ClusterIP
  selector:
    app: edge-functions
  ports:
  - port: 80
    targetPort: 8000
    protocol: TCP
    name: http
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: edge-functions
  namespace: craftlocal
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - functions.craftlocal.net
    secretName: edge-functions-tls
  rules:
  - host: functions.craftlocal.net
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: edge-functions
            port:
              number: 80
```

Deploy:

```bash
kubectl apply -f k8s-deployment.yaml
```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -n craftlocal

# Check service
kubectl get svc -n craftlocal

# Check ingress
kubectl get ingress -n craftlocal

# View logs
kubectl logs -f deployment/edge-functions -n craftlocal

# Test health endpoint
kubectl port-forward svc/edge-functions 8000:80 -n craftlocal
curl http://localhost:8000/_health
```

## Horizontal Pod Autoscaler

Create `hpa.yaml`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: edge-functions
  namespace: craftlocal
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: edge-functions
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

Apply:

```bash
kubectl apply -f hpa.yaml
```

## ConfigMap for Non-Sensitive Config

Create `configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: edge-functions-config
  namespace: craftlocal
data:
  PORT: "8000"
  DENO_DIR: "/app/.deno_cache"
  LOG_LEVEL: "info"
```

Apply and update deployment to use it:

```bash
kubectl apply -f configmap.yaml
```

## Monitoring

### Prometheus ServiceMonitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: edge-functions
  namespace: craftlocal
spec:
  selector:
    matchLabels:
      app: edge-functions
  endpoints:
  - port: http
    path: /_health
    interval: 30s
```

## Helm Chart (Optional)

For easier management, create a Helm chart:

```bash
# Create chart
helm create edge-functions-chart

# Update values.yaml with your configuration

# Install
helm install edge-functions ./edge-functions-chart \
  --namespace craftlocal \
  --create-namespace

# Upgrade
helm upgrade edge-functions ./edge-functions-chart \
  --namespace craftlocal
```

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n craftlocal
kubectl logs <pod-name> -n craftlocal
```

### Secret issues
```bash
kubectl get secrets -n craftlocal
kubectl describe secret edge-functions-secrets -n craftlocal
```

### Ingress not working
```bash
kubectl describe ingress edge-functions -n craftlocal
kubectl get certificate -n craftlocal
```

## Cleanup

```bash
kubectl delete -f k8s-deployment.yaml
kubectl delete secret edge-functions-secrets -n craftlocal
kubectl delete namespace craftlocal
```

## Production Recommendations

1. **Use GitOps** (ArgoCD, Flux) for declarative deployments
2. **Enable Pod Security Policies**
3. **Set up Network Policies** to restrict traffic
4. **Use Horizontal Pod Autoscaler** for dynamic scaling
5. **Implement Resource Quotas** for the namespace
6. **Enable Pod Disruption Budgets**
7. **Use cert-manager** for automatic SSL certificate management
8. **Set up centralized logging** (ELK, Loki)
9. **Configure monitoring** (Prometheus, Grafana)
10. **Implement backup strategies** for secrets and configs

## Multi-Region Deployment

For high availability across regions:

1. Deploy to multiple Kubernetes clusters
2. Use DNS-based load balancing (Route53, CloudFlare)
3. Configure geo-routing
4. Set up cross-region replication for data
