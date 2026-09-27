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
│       ├── values.yaml             # Production values configuration
│       └── templates/              # Deployment, Service, Ingress, HPA, etc.
└── argocd/
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
Open `argocd/application-production.yaml`:
Ensure `repoURL` points to your GitHub repository URL:
```yaml
repoURL: https://github.com/sa3akash/argocd_deployment_demo.git
```

---

### 4. Deploy to ArgoCD

Apply the application manifest directly to your Kubernetes cluster where ArgoCD is installed:

```bash
kubectl apply -f argocd/application-production.yaml
```

Alternatively, configure the application in the **ArgoCD Web UI**:
1. Click **+ New App**.
2. **Application Name**: `nextjs-app-production`
3. **Project**: `default`
4. **Sync Policy**: `Automatic` (check `Prune Resources` and `Self Heal`).
5. **Source**:
   - Repository URL: `https://github.com/sa3akash/argocd_deployment_demo.git`
   - Revision: `HEAD`
   - Path: `helm/nextjs-app`
   - Values Files: `values.yaml`
6. **Destination**:
   - Cluster URL: `https://kubernetes.default.svc`
   - Namespace: `production`
7. Click **Create**.

---

## 🔄 Deployment Workflow

1. **Production Deployment**:
   - Merge / Push code to `main` branch.
   - GitHub Actions builds the image, pushes to GHCR, and updates `helm/nextjs-app/values.yaml` with the latest commit SHA image tag.
   - ArgoCD automatically detects the commit, initiates a zero-downtime rolling update in the `production` namespace.

2. **Manual Trigger (workflow_dispatch)**:
   - Go to GitHub **Actions** tab.
   - Select **CI/CD Pipeline - Build, Push & ArgoCD GitOps Deploy**.
   - Click **Run workflow**.


---

Ran command: `git fetch origin && git status`
Ran command: `git fetch origin; git status`
Ran command: `git pull`
Ran command: `git log -n 2 --stat`
Ran command: `curl.exe -I https://ghcr.io/v2/sa3akash/argocd_deployment_demo/manifests/eac0b6b`
Ran command: `curl.exe -s "https://ghcr.io/token?service=ghcr.io&scope=repository:sa3akash/argocd_deployment_demo:pull"`
Ran command: `$token = (curl.exe -s "https://ghcr.io/token?service=ghcr.io&scope=repository:sa3akash/argocd_deployment_demo:pull" | ConvertFrom-Json).token; curl.exe -I -H "Authorization: Bearer $token" https://ghcr.io/v2/sa3akash/argocd_deployment_demo/manifests/eac0b6b`
Ran command: `$token = (curl.exe -s "https://ghcr.io/token?service=ghcr.io&scope=repository:sa3akash/argocd_deployment_demo:pull" | ConvertFrom-Json).token; curl.exe -I -H "Authorization: Bearer $token" https://ghcr.io/v2/sa3akash/argocd_deployment_demo/manifests/latest`
Viewed values.yaml:1-15

This status is completely normal for a newly created application in ArgoCD before its initial synchronization.

---

### 💡 Why ArgoCD shows this:

1. **`APP HEALTH: Missing`**:
   The resources (Deployment, Service, Ingress, ServiceAccount) do not exist in the Kubernetes cluster yet because they have never been applied. In ArgoCD, any resource that is defined in Git but not yet deployed to the cluster has a health status of **Missing**.
2. **`SYNC STATUS: OutOfSync`**:
   ArgoCD sees the new manifests in Git at commit `72f0289`, but because **`Auto sync is not enabled`**, it will not apply them to your cluster until you trigger the sync.

---

### 🚀 How to Sync in ArgoCD UI (Step-by-Step)

#### Step 1: Trigger the Initial Sync
1. In the ArgoCD UI, open your application.
2. In the top toolbar, click the **`SYNC`** button.
3. In the slide-out panel that appears:
   - Check **`AUTO-CREATE NAMESPACE`** *(important if the `production` namespace hasn't been created yet)*.
   - Click the blue **`SYNCHRONIZE`** button at the bottom.

Once the sync finishes:
- **Sync Status** will change to **`Synced`** (green checkmark).
- **Health** will change to **`Healthy`** (green heart) once the Next.js pod starts.

---

#### Step 2: Enable Auto-Sync (So future git pushes deploy automatically)
To make ArgoCD automatically deploy future GitHub Actions commits:
1. In the top toolbar, click **`APP DETAILS`**.
2. In the **Summary** tab, scroll to **Sync Policy**.
3. Click **`ENABLE AUTO-SYNC`**.
4. Check both:
   - ✅ **Prune Resources** (removes resources deleted from Git)
   - ✅ **Self Heal** (auto-restores if someone accidentally modifies cluster state manually)
5. Click **Save**.

---

### ⚠️ Important: Check Container Image Pulling (GHCR)

If the pod shows **`ImagePullBackOff`** or **`ErrImagePull`** after syncing:
By default, new images in GitHub Container Registry (GHCR) are set to **Private**.

You can fix this in one of two ways:

#### Option A: Make the Package Public (Simplest)
1. Go to your GitHub profile: `https://github.com/sa3akash?tab=packages`
2. Click **`argocd_deployment_demo`**.
3. Click **Package settings** (right sidebar).
4. Scroll down to **Danger Zone** -> click **Change visibility** -> set to **Public**.
5. Once public, Kubernetes can pull the image without needing any credentials.

#### Option B: Create the Secret in Kubernetes
If you prefer keeping it private, run this command on your server:
```bash
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=sa3akash \
  --docker-password=<YOUR_GITHUB_PERSONAL_ACCESS_TOKEN> \
  -n production
```

---

### 🌐 Accessing Your Domain
Once the pod status is **`Healthy / Running`**, visiting **`https://my.sa3avro.eu.cc`** will serve your Next.js application.