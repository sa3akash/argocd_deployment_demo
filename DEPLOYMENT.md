# CI/CD and GitOps Deployment Guide (GitHub Actions + ArgoCD)

This document provides a guide for setting up automated Docker builds with GitHub Actions, pushing container images to GitHub Container Registry (GHCR), and deploying via ArgoCD using Helm.

---

## 🏗️ Architecture Overview

```mermaid
graph LR
    Dev[Developer] -->|Push to main/develop| GH[GitHub Repository]
    GH -->|Trigger| GHA[GitHub Actions]
    GHA -->|1. Build & Push Image| GHCR[GitHub Container Registry: ghcr.io]
    GHA -->|2. Update Helm Image Tag| GH
    GH -->|GitOps Watch| ArgoCD[ArgoCD in Server]
    ArgoCD -->|Auto Sync / Deploy| K8s[Kubernetes Cluster (Testing / Production)]
```

---

## 📁 Repository Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions CI/CD Pipeline
├── Dockerfile                      # Multi-stage production build (Bun + Node Alpine)
├── .dockerignore                   # Build exclusion rules
├── next.config.ts                  # Configured with output: "standalone"
├── helm/
│   └── nextjs-app/
│       ├── Chart.yaml              # Chart metadata
│       ├── values.yaml             # Default values
│       ├── values-testing.yaml     # Testing environment configuration
│       ├── values-production.yaml  # Production environment configuration
│       └── templates/              # Deployment, Service, Ingress, HPA, etc.
└── argocd/
    ├── application-testing.yaml    # ArgoCD Application for Testing
    └── application-production.yaml # ArgoCD Application for Production
```

---

## 🚀 Setup Steps

### 1. Enable GitHub Actions Permissions
In your GitHub Repository:
1. Go to **Settings** > **Actions** > **General**.
2. Scroll to **Workflow permissions**:
   - Select **Read and write permissions**.
   - Check **Allow GitHub Actions to create and approve pull requests**.
3. Click **Save**.

*(This allows the GitHub Action to commit the updated image tag back to your Helm values file).*

---

### 2. Configure GitHub Container Registry (GHCR) Access
When the GitHub Action runs for the first time, it creates the package under your GitHub account/organization.

#### Option A: Make the Package Public (Simplest)
1. On GitHub, go to your profile/organization > **Packages**.
2. Select your newly pushed image.
3. Go to **Package settings** > Scroll down to **Danger Zone** > Click **Change visibility** > Set to **Public**.
4. With a public package, your Kubernetes cluster can pull the image without any credentials!

#### Option B: Use Kubernetes Secret for Private Image
If you prefer keeping the package private:
1. Create a GitHub Personal Access Token (PAT) with `read:packages` scope:
   - Go to GitHub **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)** > Generate new token.
2. In your Kubernetes cluster, create the image pull secret in your namespaces:
   ```bash
   # For testing namespace
   kubectl create namespace testing --dry-run=client -o yaml | kubectl apply -f -
   kubectl create secret docker-registry ghcr-secret \
     --docker-server=ghcr.io \
     --docker-username=<YOUR_GITHUB_USERNAME> \
     --docker-password=<YOUR_GITHUB_PAT> \
     -n testing

   # For production namespace
   kubectl create namespace production --dry-run=client -o yaml | kubectl apply -f -
   kubectl create secret docker-registry ghcr-secret \
     --docker-server=ghcr.io \
     --docker-username=<YOUR_GITHUB_USERNAME> \
     --docker-password=<YOUR_GITHUB_PAT> \
     -n production
   ```

---

### 3. Update the Repository URLs in ArgoCD Manifests
Open `argocd/application-testing.yaml` and `argocd/application-production.yaml`:
Replace `https://github.com/placeholder-user/placeholder-repo.git` with your actual GitHub repository URL:
```yaml
repoURL: https://github.com/<your-username>/<your-repo-name>.git
```

---

### 4. Deploy to ArgoCD

Apply the application manifests directly to your Kubernetes cluster where ArgoCD is installed:

```bash
# Deploy Testing Application
kubectl apply -f argocd/application-testing.yaml

# Deploy Production Application
kubectl apply -f argocd/application-production.yaml
```

Alternatively, you can create the applications via the **ArgoCD Web UI**:
1. Click **+ New App**.
2. **Application Name**: `nextjs-app-production`
3. **Project**: `default`
4. **Sync Policy**: `Automatic` (check `Prune Resources` and `Self Heal`).
5. **Source**:
   - Repository URL: `https://github.com/<your-username>/<your-repo-name>.git`
   - Revision: `HEAD`
   - Path: `helm/nextjs-app`
   - Values Files: Select `values.yaml` and `values-production.yaml`.
6. **Destination**:
   - Cluster URL: `https://kubernetes.default.svc`
   - Namespace: `production`
7. Click **Create**.

---

## 🔄 Deployment Workflow

1. **Feature / Testing**:
   - Push code to `develop` branch.
   - GitHub Actions builds the image, tags it with the short git SHA, pushes to GHCR, and updates `helm/nextjs-app/values-testing.yaml`.
   - ArgoCD syncs and updates the **testing** environment.

2. **Production Deployment**:
   - Merge / Push code to `main` branch.
   - GitHub Actions builds the image, pushes to GHCR, and updates `helm/nextjs-app/values-production.yaml`.
   - ArgoCD automatically detects the commit, initiates zero-downtime rolling update in the **production** environment.

3. **Manual Trigger (workflow_dispatch)**:
   - Go to GitHub **Actions** tab.
   - Select **CI/CD Pipeline - Build, Push & ArgoCD GitOps Deploy**.
   - Click **Run workflow** and choose whether to deploy to `testing` or `production`.
