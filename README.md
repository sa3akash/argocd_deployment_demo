# ⚡ CloudOps Dispatch & ArgoCD GitOps Platform

[![CI/CD Pipeline](https://github.com/sa3akash/argocd_deployment_demo/actions/workflows/deploy.yml/badge.svg)](https://github.com/sa3akash/argocd_deployment_demo/actions)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16--alpine-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.45-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-1.28+-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![ArgoCD](https://img.shields.io/badge/ArgoCD-GitOps-EF7B4D?logo=argo&logoColor=white)](https://argo-cd.readthedocs.io/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

An enterprise-grade, fullstack technical publication and cloud-native GitOps demonstration. Built with **Next.js 16 (Turbopack standalone)**, **Drizzle ORM**, **in-cluster PostgreSQL 16**, **Helm charts**, and fully automated **ArgoCD continuous delivery**.

---

## 🏗️ Architectural Topology

```mermaid
flowchart TD
    subgraph Developer Workflow
        Dev([Developer]) -->|git push origin main| GitHub[GitHub Repository]
    end

    subgraph CI/CD Pipeline [GitHub Actions]
        GitHub -->|Triggers deploy.yml| GHA[Docker Buildx multi-stage]
        GHA -->|Build & Push Image| GHCR[(GitHub Container Registry)]
        GHA -->|Update image.tag| HelmValues[values.yaml commit]
    end

    subgraph GitOps Control Plane
        HelmValues -->|Auto-sync detection| ArgoCD[ArgoCD Controller]
    end

    subgraph Kubernetes Cluster [Production Namespace]
        ArgoCD -->|Reconcile Helm Chart| K8s[Kubernetes Resources]
        
        subgraph PostgreSQL Service
            PGPod[PostgreSQL 16 Alpine] --- PGVol[(Persistent Volume)]
            PGProbe[tcpSocket Probe: 5432]
        end

        subgraph Next.js App Pod
            InitC[InitContainer: wait-for-postgres] -->|TCP nc check: 5432| PGPod
            InitC --> Migrator[Node Drizzle Sync: sync-db.mjs]
            Migrator --> AppServer[Next.js 16 Standalone Server]
        end

        Traefik[Traefik Ingress Controller] -->|HTTPS 443 / websecure| AppServer
        HPA[Horizontal Pod Autoscaler] -->|CPU / Memory Metrics| AppServer
    end

    User([Public End User]) -->|HTTPS: my.sa3avro.eu.cc| Traefik
```

---

## ✨ Key Features

### 📰 1. Editorial Technical Publication & UI
- **Editorial Typography & Hierarchy**: Designed for deep technical articles, architectural breakdowns, and post-mortems (inspired by Stripe Press, Vercel Blog, and Cloudflare Blog).
- **Featured Cover Story**: Prominent hero publication with reading time, author byline, step teasers, and engagement metrics.
- **Interactive Multi-Step Runbooks**: Built-in CLI command sequence runner with 1-click clipboard copy (`Copied ✓`) and step progress tracking.
- **Live Search & Category Filtering**: Instant client-side search across titles, excerpts, and tags without page reload.
- **Full Social Engagement**: Real-time optimistic like reactions (❤️), view counting (👁️), and threaded discussion comments (💬).
- **Author Studio Modal**: In-app management interface for Shakil/Admins to draft, edit, and delete publications, add CLI steps, and trigger live database synchronization.

### 🚀 2. Cloud Native & GitOps Engineering
- **ArgoCD Declarative Rollouts**: Watches `helm/nextjs-app` values and self-heals Kubernetes resources on drift.
- **Ordered Pod Startup**:
  - `wait-for-postgres` initContainer verifies PostgreSQL port `5432` availability with a bounded 30-attempt retry loop.
  - Next.js container entrypoint executes `scripts/sync-db.mjs` applying Drizzle ORM migrations before booting `server.js`.
- **Zero-Downtime Rolling Updates**: Configured with `readinessProbe` and `livenessProbe` checking Next.js HTTP health endpoints.
- **Horizontal Pod Autoscaling (HPA)**: Scales from 2 to 5 replicas dynamically based on CPU and memory utilization thresholds (80%).
- **Resilient Fallback**: Automatic in-memory database fallback keeps the application serving requests even if PostgreSQL is temporarily unavailable.

### 🔍 3. 100% SEO & Performance Compliance
- **Heading Hierarchy**: Semantic `<h1>` hero header, `<h2>` section headers, and `<h3>` article titles rendered server-side (RSC).
- **Crawlable Link Architecture**: Every card and title is wrapped with semantic `<Link href="/posts/[slug]">` anchor tags.
- **Authoritative Ecosystem Links**: Direct outbound references with `rel="noopener noreferrer"` to official Kubernetes, ArgoCD, Drizzle, and CNCF documentation.
- **Dynamic Metadata & Social Cards**: OpenGraph, Twitter Cards, canonical URLs, automated XML sitemap (`/sitemap.xml`), and robots index (`/robots.txt`).
- **Production Headers**: Stripped `X-Powered-By` header (`poweredByHeader: false`) and enforced permanent **301 HTTPS Redirection** via Next.js 16 Proxy Middleware.

---

## 📁 Repository Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml              # Multi-stage Docker build, GHCR push, & Helm value update
├── argocd/
│   ├── application-production.yaml # ArgoCD Application definition
│   └── project.yaml                # ArgoCD AppProject
├── drizzle/                        # Drizzle ORM generated SQL migration scripts
│   ├── 0000_yellow_sway.sql
│   └── 0001_misty_dark_beast.sql
├── helm/
│   └── nextjs-app/                 # Production Helm 3 Chart
│       ├── Chart.yaml              # Chart metadata
│       ├── values.yaml             # Production configuration (image, ingress, postgres, hpa)
│       └── templates/
│           ├── deployment.yaml     # Next.js deployment with wait-for-postgres initContainer
│           ├── postgres.yaml       # In-cluster PostgreSQL deployment & ClusterIP service
│           ├── service.yaml        # Next.js ClusterIP service
│           ├── ingress.yaml        # Traefik ingress with websecure TLS annotations
│           ├── hpa.yaml            # HorizontalPodAutoscaler
│           └── serviceaccount.yaml # RBAC ServiceAccount
├── scripts/
│   ├── entrypoint.sh               # Container entrypoint orchestrator
│   └── sync-db.mjs                 # Drizzle migration and database seeding script
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with SEO viewport and metadata
│   │   ├── page.tsx                # 100% Server Component publication page with H1/H2
│   │   ├── sitemap.ts              # Dynamic XML sitemap generator (/sitemap.xml)
│   │   ├── robots.ts               # Automated robots.txt route (/robots.txt)
│   │   ├── posts/[slug]/page.tsx   # Dedicated article page with TechArticle JSON-LD
│   │   └── api/                    # REST APIs (/api/posts, /api/health, /api/db/sync)
│   ├── components/                 # Client and Server React components
│   │   ├── Navbar.tsx              # Sticky masthead with status indicator & modal trigger
│   │   ├── FeaturedArticle.tsx     # Hero cover publication showcase
│   │   ├── InteractiveArticles.tsx # Live search, category pills, & article cards
│   │   ├── InteractiveRunbooks.tsx # Production CLI step runner with copy feedback
│   │   ├── EcosystemResources.tsx  # CNCF & official docs outbound links
│   │   ├── AdminStudioModal.tsx    # Article publisher & Drizzle sync drawer
│   │   └── Footer.tsx              # 4-column semantic footer
│   ├── db/
│   │   ├── index.ts                # Drizzle client, pool manager, and memory fallback
│   │   └── schema.ts               # Schema definitions (posts, comments)
│   ├── lib/
│   │   ├── actions.ts              # Next.js Server Actions (CRUD, likes, views, comments)
│   │   └── logger.ts               # Structured JSON logger with distributed trace IDs
│   └── proxy.ts                    # Next.js 16 Proxy (HTTPS redirect & trace propagation)
├── Dockerfile                      # Ultra-lean multi-stage Alpine container (standalone)
├── drizzle.config.ts               # Drizzle Kit CLI configuration
└── next.config.ts                  # Next.js config (standalone, no powered-by, compression)
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** 20+ or **Bun** 1.1+
- **Docker** (optional for local PostgreSQL)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/sa3akash/argocd_deployment_demo.git
cd argocd_deployment_demo

# Install dependencies
bun install
# or: npm install
```

### 3. Environment Setup
Create a `.env.local` file in the project root:
```env
# Optional: connect to a local or remote PostgreSQL database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blogdb"
NODE_ENV="development"
PORT=3000
```
*(Note: If `DATABASE_URL` is omitted, the application automatically boots into in-memory fallback mode).*

### 4. Run the Dev Server
```bash
bun run dev
# or: npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the publication.

### 5. Validate Build & Types
```bash
bun run build
```

---

## ☸️ Kubernetes & GitOps Deployment Guide

### 1. Create the Production Namespace & Secrets
On your Kubernetes cluster (K3s, MicroK8s, EKS, GKE, etc.):
```bash
# Create production namespace
kubectl create namespace production

# Optional: Create custom database credentials secret
kubectl create secret generic nextjs-secrets \
  --from-literal=DATABASE_URL="postgresql://postgres:StrongBlogPassword2026!@nextjs-app-production-postgres:5432/blogdb" \
  -n production
```

### 2. Deploy via Helm (Standalone)
```bash
# Dry-run template validation
helm template test helm/nextjs-app

# Deploy to cluster
helm upgrade --install nextjs-app-production helm/nextjs-app \
  --namespace production \
  --create-namespace
```

### 3. Deploy via ArgoCD (GitOps)
Apply the ArgoCD application manifest:
```bash
kubectl apply -f argocd/application-production.yaml
```
ArgoCD will continuously reconcile your cluster state with the `main` branch of this repository.

### 4. Verify Cluster Health
```bash
# Check running pods and services
kubectl get pods,svc,ingress,hpa -n production

# Inspect logs of Next.js pod
kubectl logs -l app.kubernetes.io/name=nextjs-app -n production --tail=50
```

---

## 🛡️ Security & Production Hardening

- **Non-Root Execution**: Runs as user ID `1001` with `runAsNonRoot: true` and dropped Linux capabilities (`drop: [ALL]`).
- **No Plaintext Secrets**: Sensitive database credentials should be injected via Kubernetes Secrets (`envFrom: secretRef`).
- **Resource Limits**: Configured CPU and memory requests and limits prevent resource starvation in shared clusters.
- **HTTPS Enforcement**: Automatic HTTP to HTTPS 301 redirection with `Strict-Transport-Security` and `X-Frame-Options` headers.

---

## 👤 Author & Maintainer

**Shakil Ahmed**
- GitHub: [@sa3akash](https://github.com/sa3akash)
- Project: [argocd_deployment_demo](https://github.com/sa3akash/argocd_deployment_demo)

---

## 📄 License

This project is open-source and licensed under the [Apache License 2.0](LICENSE).
