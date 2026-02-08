# Deployment & Scaling Strategy: PropertyOS

## Overview

PropertyOS employs a **cloud-native, containerized deployment strategy** on **AWS** with horizontal scaling capabilities, multi-region disaster recovery, and cost optimization through intelligent resource management.

---

## Infrastructure Overview

### Cloud Provider
- **Primary**: AWS (us-east-1, us-west-2)
- **Alternative**: GCP (europe-west1, asia-east1) for international expansion

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  EDGE LAYER (CDN)                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  CloudFront │  │  CloudFront │  │  CloudFront │  │  CloudFront │  │  CloudFront │        │
│  │  (Global)   │  │  (US East)  │  │  (US West)  │  │  (Europe)   │  │  (Asia)     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  LOAD BALANCING LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                        │
│  │    WAF      │  │   ALB /     │  │   NLB /     │  │   Route     │                        │
│  │  (CloudFlare)│  │   NLB      │  │   NLB       │  │   53       │                        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  KUBERNETES CLUSTER (EKS)                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                  FRONTEND LAYER                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │    │
│  │  │  Next.js    │  │  Next.js    │  │  Next.js    │  │  Next.js    │               │    │
│  │  │  Pod 1     │  │  Pod 2     │  │  Pod 3     │  │  Pod N     │               │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                  API GATEWAY LAYER                                    │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                                 │    │
│  │  │    Kong     │  │    Kong     │  │    Kong     │                                 │    │
│  │  │  Pod 1     │  │  Pod 2     │  │  Pod 3     │                                 │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                                 │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                  SERVICES LAYER                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │    │
│  │  │  Auth      │  │  Tenant    │  │  Property  │  │  Payment   │               │    │
│  │  │  Service   │  │  Service   │  │  Service   │  │  Service   │               │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘               │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │    │
│  │  │  Maint     │  │  Owner     │  │  Analytics │  │  Document  │               │    │
│  │  │  Service   │  │  Service   │  │  Service   │  │  Service   │               │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                  BACKGROUND LAYER                                    │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                                 │    │
│  │  │   Worker    │  │   Worker    │  │   Worker    │                                 │    │
│  │  │  Pod 1     │  │  Pod 2     │  │  Pod N     │                                 │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                                 │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  DATA LAYER                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  PostgreSQL │  │  PostgreSQL │  │    Redis    │  │   S3 /     │  │  Pinecone   │        │
│  │   Primary   │  │   Replica   │  │   Cluster   │  │   MinIO     │  │  (Vector)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Environments

### Environment Hierarchy

| Environment | Purpose | Region | Size | Features |
|-------------|---------|--------|------|----------|
| **Development** | Local development | Local | Small | All features, mock data |
| **Staging** | Pre-production testing | us-east-1 | Medium | All features, anonymized prod data |
| **Production** | Live production | us-east-1, us-west-2 | Large | Production features, full monitoring |
| **DR** | Disaster recovery | us-west-2 | Medium | Hot standby, cross-region replication |

### Environment Configuration

```yaml
# k8s/environments/development.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: propertyos-dev
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: propertyos-dev
data:
  NODE_ENV: "development"
  LOG_LEVEL: "debug"
  DATABASE_URL: "postgresql://dev:dev@localhost:5432/propertyos_dev"
  REDIS_URL: "redis://localhost:6379"
  STRIPE_API_KEY: "sk_test_..."
  OPENAI_API_KEY: "sk-test-..."
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: propertyos-dev
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: propertyos/frontend:dev
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: app-config
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

---

# k8s/environments/production.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: propertyos-prod
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: propertyos-prod
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  DATABASE_URL: "postgresql://prod:***@rds-cluster.cluster-***.us-east-1.rds.amazonaws.com:5432/propertyos"
  REDIS_URL: "redis://elasticache-cluster.***.use1.cache.amazonaws.com:6379"
  STRIPE_API_KEY: "sk_live_***"
  OPENAI_API_KEY: "sk-proj-***"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: propertyos-prod
spec:
  replicas: 6
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: propertyos/frontend:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: app-config
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## CI/CD Pipeline

### Pipeline Stages

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Code   │ ──▶ │  Build  │ ──▶ │  Test   │ ──▶ │ Deploy  │ ──▶ │  Smoke  │ ──▶ │  Monitor │
│  Push  │     │  & Tag  │     │  Suite  │     │ Staging │     │  Tests  │     │  & Roll  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
                                   │
                                   │
                                   ▼
                              ┌─────────┐
                              │ Manual  │
                              │ Approve │
                              └─────────┘
                                   │
                                   ▼
                              ┌─────────┐
                              │ Deploy  │
                              │Production│
                              │ (Blue/   │
                              │  Green)  │
                              └─────────┘
```

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy PropertyOS

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: propertyos
  EKS_CLUSTER: propertyos-cluster

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.propertyos.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure kubectl
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name ${{ env.EKS_CLUSTER }} --region ${{ env.AWS_REGION }}

      - name: Deploy to staging
        run: |
          kubectl set image deployment/frontend \
            frontend=${{ needs.build.outputs.image-tag }} \
            -n propertyos-staging

      - name: Wait for rollout
        run: kubectl rollout status deployment/frontend -n propertyos-staging --timeout=10m

      - name: Run smoke tests
        run: npm run test:smoke -- --env=staging

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://propertyos.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure kubectl
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name ${{ env.EKS_CLUSTER }} --region ${{ env.AWS_REGION }}

      - name: Blue-Green Deployment
        run: |
          # Create new green deployment
          kubectl apply -f k8s/production-green.yaml
          kubectl wait --for=condition=available --timeout=10m deployment/frontend-green -n propertyos-prod

          # Switch traffic to green
          kubectl patch service frontend -n propertyos-prod -p '{"spec":{"selector":{"version":"green"}}}'

          # Wait for green to be healthy
          kubectl rollout status deployment/frontend-green -n propertyos-prod --timeout=10m

          # Run smoke tests on green
          npm run test:smoke -- --env=production

          # Clean up blue deployment
          kubectl delete deployment/frontend-blue -n propertyos-prod

      - name: Notify deployment
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment successful!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Horizontal Scaling

### Kubernetes Horizontal Pod Autoscaler (HPA)

```yaml
# k8s/hpa/frontend-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
  namespace: propertyos-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 3
  maxReplicas: 20
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
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 4
        periodSeconds: 30
      selectPolicy: Max

---

# k8s/hpa/api-gateway-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: propertyos-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"

---

# k8s/hpa/services-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: services-hpa
  namespace: propertyos-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: services
  minReplicas: 4
  maxReplicas: 30
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 65
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 75
```

### Kubernetes Cluster Autoscaler

```yaml
# k8s/cluster-autoscaler.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-autoscaler
  namespace: kube-system
data:
  balance-similar-node-groups: "true"
  skip-nodes-with-system-pods: "true"
  expander: "least-waste"
  max-node-provision-time: "15m"
  max-total-unready-percentage: "45"
  ok-total-unready-count: "3"
  scale-down-enabled: "true"
  scale-down-delay-after-add: "10m"
  scale-down-delay-after-delete: "0s"
  scale-down-delay-after-failure: "3m"
  scale-down-unneeded-time: "10m"
  scale-down-unready-time: "20m"
  scale-down-utilization-threshold: "0.5"
  scan-interval: "10s"
  cluster-name: propertyos-cluster
  cluster-api: "eks.amazonaws.com"
```

### Service-Specific Scaling Strategies

| Service | Min Replicas | Max Replicas | Scale Up Trigger | Scale Down Trigger |
|---------|--------------|--------------|------------------|-------------------|
| **Frontend** | 3 | 20 | CPU > 70% | CPU < 40% for 5 min |
| **API Gateway** | 2 | 10 | CPU > 60%, RPS > 1000 | CPU < 30% for 5 min |
| **Auth Service** | 2 | 8 | CPU > 70% | CPU < 40% for 5 min |
| **Tenant Service** | 2 | 10 | CPU > 65% | CPU < 40% for 5 min |
| **Property Service** | 2 | 10 | CPU > 65% | CPU < 40% for 5 min |
| **Payment Service** | 2 | 8 | CPU > 70%, Queue > 100 | CPU < 40% for 5 min |
| **Maintenance Service** | 2 | 8 | CPU > 65% | CPU < 40% for 5 min |
| **AI Service** | 1 | 5 | CPU > 80%, Queue > 50 | CPU < 50% for 10 min |
| **Worker Pods** | 2 | 20 | Queue > 100 | Queue < 10 for 10 min |

---

## Database Scaling

### PostgreSQL Read Replicas

```yaml
# k8s/config/postgres-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
  namespace: propertyos-prod
data:
  POSTGRES_PRIMARY_HOST: "propertyos-primary.cluster-***.us-east-1.rds.amazonaws.com"
  POSTGRES_REPLICA_HOST: "propertyos-replica.cluster-***.us-east-1.rds.amazonaws.com"
  POSTGRES_DB: "propertyos"
  POSTGRES_MAX_CONNECTIONS: "100"
  POSTGRES_POOL_MIN: "10"
  POSTGRES_POOL_MAX: "50"
```

### Connection Pooling (PgBouncer)

```yaml
# k8s/deployments/pgbouncer.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pgbouncer
  namespace: propertyos-prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: pgbouncer
  template:
    metadata:
      labels:
        app: pgbouncer
    spec:
      containers:
      - name: pgbouncer
        image: edoburu/pgbouncer:latest
        ports:
        - containerPort: 5432
        env:
        - name: DATABASES_HOST
          value: "propertyos-primary.cluster-***.us-east-1.rds.amazonaws.com"
        - name: DATABASES_PORT
          value: "5432"
        - name: DATABASES_DBNAME
          value: "propertyos"
        - name: DATABASES_USER
          value: "propertyos"
        - name: DATABASES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: POOL_MODE
          value: "transaction"
        - name: MAX_CLIENT_CONN
          value: "500"
        - name: DEFAULT_POOL_SIZE
          value: "50"
        - name: SERVER_LIFETIME
          value: "3600"
        - name: SERVER_IDLE_TIMEOUT
          value: "600"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          exec:
            command:
            - sh
            - -c
            - "pgbouncer --show-config | grep -q pgbouncer"
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - sh
            - -c
            - "pg_isready -h localhost"
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Database Scaling Strategy

| Scale | Strategy | Implementation |
|-------|----------|----------------|
| **Small** (< 1K tenants) | Single instance | RDS db.t3.large (2 vCPU, 8 GB RAM) |
| **Medium** (1K-10K tenants) | Read replicas | Primary + 2 read replicas |
| **Large** (10K-100K tenants) | Connection pooling | PgBouncer + 4 read replicas |
| **Enterprise** (100K+ tenants) | Sharding | Schema-per-tenant sharding |

---

## Caching Strategy

### Redis Cluster Configuration

```yaml
# k8s/deployments/redis-cluster.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cluster
  namespace: propertyos-prod
spec:
  serviceName: redis-cluster
  replicas: 6
  selector:
    matchLabels:
      app: redis-cluster
  template:
    metadata:
      labels:
        app: redis-cluster
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
          name: client
        - containerPort: 16379
          name: gossip
        command:
        - redis-server
        - --cluster-enabled
        - "yes"
        - --cluster-config-file
        - nodes.conf
        - --cluster-node-timeout
        - "5000"
        - --appendonly
        - "yes"
        - --protected-mode
        - "no"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        volumeMounts:
        - name: data
          mountPath: /data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: 20Gi
```

### Cache Tiering

| Cache Type | Technology | TTL | Use Case |
|------------|-----------|-----|----------|
| **L1 - Application** | In-memory (LRU) | 5 min | Hot data, user sessions |
| **L2 - Distributed** | Redis Cluster | 15 min | Shared cache, rate limits |
| **L3 - CDN** | CloudFront | 1 hour | Static assets, API responses |

---

## Cost Optimization

### Resource Optimization

```typescript
// scripts/cost-optimizer.ts
class CostOptimizer {
  async analyzeCosts(): Promise<CostAnalysis> {
    const analysis: CostAnalysis = {
      recommendations: [],
      potentialSavings: 0,
    };

    // 1. Check for over-provisioned resources
    const overProvisioned = await this.checkOverProvisioning();
    analysis.recommendations.push(...overProvisioned);
    analysis.potentialSavings += overProvisioned.reduce((sum, r) => sum + r.savings, 0);

    // 2. Check for unused resources
    const unused = await this.checkUnusedResources();
    analysis.recommendations.push(...unused);
    analysis.potentialSavings += unused.reduce((sum, r) => sum + r.savings, 0);

    // 3. Check for reserved instances opportunity
    const reserved = await this.checkReservedInstances();
    analysis.recommendations.push(...reserved);
    analysis.potentialSavings += reserved.reduce((sum, r) => sum + r.savings, 0);

    // 4. Check for spot instance opportunity
    const spot = await this.checkSpotInstances();
    analysis.recommendations.push(...spot);
    analysis.potentialSavings += spot.reduce((sum, r) => sum + r.savings, 0);

    return analysis;
  }

  private async checkOverProvisioning(): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Get metrics from CloudWatch
    const metrics = await this.getCPUMetrics();

    for (const resource of metrics) {
      if (resource.avgCpu < 20) {
        recommendations.push({
          type: 'over-provisioned',
          resource: resource.name,
          action: 'Reduce instance size',
          currentSize: resource.instanceType,
          recommendedSize: this.getSmallerInstance(resource.instanceType),
          savings: this.calculateSavings(resource.instanceType, this.getSmallerInstance(resource.instanceType)),
        });
      }
    }

    return recommendations;
  }

  private async checkReservedInstances(): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Get usage patterns
    const usage = await this.getUsagePatterns();

    for (const resource of usage) {
      if (resource.utilization > 75 && resource.consistency > 90) {
        recommendations.push({
          type: 'reserved-instance',
          resource: resource.name,
          action: 'Purchase reserved instance',
          savings: this.calculateReservedSavings(resource.instanceType),
        });
      }
    }

    return recommendations;
  }

  private async checkSpotInstances(): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Identify interruptible workloads
    const interruptible = ['worker-pods', 'batch-jobs', 'analytics'];

    for (const workload of interruptible) {
      recommendations.push({
        type: 'spot-instance',
        resource: workload,
        action: 'Use spot instances',
        savings: this.calculateSpotSavings(workload),
      });
    }

    return recommendations;
  }
}
```

### Cost Optimization Strategies

| Strategy | Description | Potential Savings |
|----------|-------------|-------------------|
| **Right-sizing** | Adjust instance sizes based on actual usage | 20-30% |
| **Reserved Instances** | Commit to 1-3 year terms for consistent workloads | 40-60% |
| **Spot Instances** | Use spot instances for interruptible workloads | 70-90% |
| **Auto-scaling** | Scale down during low-traffic periods | 30-50% |
| **Graviton instances** | Use ARM-based instances for cost savings | 20-40% |
| **S3 Lifecycle** | Move old data to cheaper storage classes | 50-70% |
| **Reserved Capacity** | Reserved capacity for databases | 40-60% |

---

## Monitoring & Observability

### Monitoring Stack

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               MONITORING & OBSERVABILITY STACK                                  │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                   METRICS                                            │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │    │
│  │  │ Prometheus  │  │  CloudWatch │  │  Grafana    │  │   Alerts    │               │    │
│  │  │  (Metrics)  │  │   (AWS)     │  │  (Visual)   │  │ (PagerDuty) │               │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                    LOGGING                                            │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │    │
│  │  │   Fluent    │  │   ELK Stack │  │  CloudWatch │  │   Log      │               │    │
│  │  │     Bit     │  │ (Elastic)   │  │   Logs      │  │ Insights   │               │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                                    TRACING                                            │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                                 │    │
│  │  │ OpenTelemetry│  │   Jaeger    │  │  Datadog    │                                 │    │
│  │  │   (Collect)  │  │  (Visual)   │  │   (APM)     │                                 │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                                 │    │
│  └─────────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Metrics

| Category | Metrics | Alert Threshold |
|----------|---------|-----------------|
| **Business** | Active users, payment volume, request volume | N/A |
| **Application** | Request latency, error rate, throughput | P99 > 1s, Error > 1% |
| **Infrastructure** | CPU, memory, disk, network | CPU > 80%, Memory > 85% |
| **Database** | Query performance, connection pool, replication lag | Query > 1s, Lag > 5s |
| **Cache** | Hit rate, memory usage, eviction rate | Hit < 60%, Memory > 90% |

---

## Disaster Recovery

### Disaster Recovery Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PRIMARY REGION (us-east-1)                                 │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   EKS       │  │  RDS        │  │ ElastiCache │  │     S3      │  │   CloudFront│        │
│  │  Cluster    │  │  Primary    │  │   Cluster   │  │   Primary   │  │   (Global)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         │ Cross-Region Replication
                                         │ (Async, RPO < 15 min)
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DR REGION (us-west-2)                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                        │
│  │   EKS       │  │  RDS        │  │ ElastiCache │  │     S3      │                        │
│  │  (Standby)  │  │  Read-Only  │  │   Replica   │  │   Replica   │                        │
│  │             │  │  Replica    │  │             │  │             │                        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### RTO/RPO Targets

| Service | RTO (Recovery Time) | RPO (Data Loss) | Strategy |
|---------|---------------------|-----------------|----------|
| **Frontend** | < 5 min | 0 | Multi-region CDN |
| **API Services** | < 15 min | < 5 min | Active-active EKS |
| **Database** | < 1 hour | < 15 min | Cross-region replication |
| **Cache** | < 5 min | < 1 min | Redis cluster replication |
| **Object Storage** | < 5 min | 0 | S3 cross-region replication |
| **Message Queue** | < 10 min | < 1 min | Multi-AZ RabbitMQ |

### Failover Procedure

```typescript
// scripts/failover.ts
class DisasterRecovery {
  async initiateFailover(): Promise<void> {
    console.log('Initiating disaster recovery failover...');

    // 1. Verify DR region health
    const drHealthy = await this.verifyDRRegion();
    if (!drHealthy) {
      throw new Error('DR region not healthy');
    }

    // 2. Promote read replicas to primary
    await this.promoteReadReplicas();

    // 3. Update DNS to point to DR region
    await this.updateDNS();

    // 4. Scale up DR resources
    await this.scaleUpDRResources();

    // 5. Verify application health
    const healthy = await this.verifyHealth();
    if (!healthy) {
      await this.rollback();
      throw new Error('Failover failed, rolling back');
    }

    console.log('Failover completed successfully');
  }

  private async promoteReadReplicas(): Promise<void> {
    // Promote RDS read replica
    await rds.promoteReadReplica({
      dbInstanceIdentifier: 'propertyos-dr',
    });

    // Wait for promotion to complete
    await this.waitForPromotion();

    // Update application configuration
    await this.updateDatabaseConfig('propertyos-dr');
  }

  private async updateDNS(): Promise<void> {
    // Update Route53 to point to DR region
    await route53.changeResourceRecordSets({
      HostedZoneId: process.env.HOSTED_ZONE_ID,
      ChangeBatch: {
        Changes: [
          {
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: 'api.propertyos.com',
              Type: 'CNAME',
              TTL: 60,
              ResourceRecords: [
                { Value: 'propertyos-dr-elb.us-west-2.elb.amazonaws.com' },
              ],
            },
          },
        ],
      },
    });
  }

  private async scaleUpDRResources(): Promise<void> {
    // Scale up EKS node groups
    await eks.updateNodegroupConfig({
      clusterName: 'propertyos-dr',
      nodegroupName: 'default',
      scalingConfig: {
        minSize: 10,
        maxSize: 50,
        desiredSize: 20,
      },
    });

    // Scale up deployments
    await this.scaleUpDeployments();
  }
}
```

---

## Performance Optimization

### Application Performance

```typescript
// services/performance/performance-optimizer.ts
class PerformanceOptimizer {
  async optimizeFrontend(): Promise<void> {
    // 1. Implement code splitting
    await this.implementCodeSplitting();

    // 2. Optimize images
    await this.optimizeImages();

    // 3. Enable compression
    await this.enableCompression();

    // 4. Implement caching
    await this.implementCaching();
  }

  async optimizeAPI(): Promise<void> {
    // 1. Implement response caching
    await this.implementResponseCaching();

    // 2. Optimize database queries
    await this.optimizeDatabaseQueries();

    // 3. Implement connection pooling
    await this.implementConnectionPooling();

    // 4. Enable compression
    await this.enableAPICompression();
  }

  async optimizeDatabase(): Promise<void> {
    // 1. Analyze slow queries
    const slowQueries = await this.analyzeSlowQueries();

    // 2. Add missing indexes
    await this.addMissingIndexes(slowQueries);

    // 3. Optimize queries
    await this.optimizeQueries(slowQueries);

    // 4. Implement query caching
    await this.implementQueryCaching();
  }
}
```

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Page Load Time** | < 2s | Lighthouse |
| **Time to Interactive** | < 3s | Lighthouse |
| **API Response Time** | P95 < 200ms | APM |
| **Database Query Time** | P95 < 100ms | APM |
| **Cache Hit Rate** | > 80% | Redis |
| **Error Rate** | < 0.1% | APM |

---

This comprehensive deployment and scaling strategy ensures PropertyOS can handle growth from a single property to enterprise portfolios while maintaining high availability, performance, and cost efficiency.