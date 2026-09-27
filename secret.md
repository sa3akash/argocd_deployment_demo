# Managing Secrets in Kubernetes & GitOps

To keep sensitive data (like database URLs, passwords, API keys) safe and **never exposed publicly on GitHub**, the standard Kubernetes & GitOps approach is to **create the Secret directly inside your Kubernetes cluster on your server**. 

Your Helm chart only references the secret's *name*, never the actual secret values.

---

### 🛠️ Changes Already Made to Your Helm Chart

1. **[templates/deployment.yaml](file:///c:/Users/SHAKIL/Desktop/code/helm/nextjs-app/templates/deployment.yaml)**:
   Added `envFrom` support to automatically inject all key-value pairs from Kubernetes Secrets into container environment variables.
2. **[values.yaml](file:///c:/Users/SHAKIL/Desktop/code/helm/nextjs-app/values.yaml)**:
   Configured:
   ```yaml
   envFrom:
     - secretRef:
         name: nextjs-secrets
         optional: true  # Pod starts safely even before the secret is created
   ```

---

### 🔒 Step 1: Create the Secret on Your Server

SSH into your server and run `kubectl create secret`:

```bash
kubectl create secret generic nextjs-secrets \
  --from-literal=DATABASE_URL="postgresql://user:password@db-host:5432/mydb" \
  --from-literal=NEXTAUTH_SECRET="your-super-secret-key" \
  --from-literal=API_KEY="sk_live_123456789" \
  -n production
```

> **Why this is safe:**
> - This command runs only on your server.
> - The secret is stored securely in Kubernetes `etcd` in the `production` namespace.
> - **Nothing is committed to GitHub.**

---

### 💻 Step 2: Use the Secret in Next.js

All keys defined in `nextjs-secrets` are automatically available in your Next.js code as standard environment variables:

```typescript
// Anywhere in your server components or API routes:
const databaseUrl = process.env.DATABASE_URL;
const apiKey = process.env.API_KEY;
```

---

### 🔄 How to Update Secret Values Later

If you change your database password or add new keys, run this on your server:

```bash
kubectl create secret generic nextjs-secrets \
  --from-literal=DATABASE_URL="postgresql://newuser:newpassword@db-host:5432/mydb" \
  --from-literal=NEXTAUTH_SECRET="your-super-secret-key" \
  --from-literal=NEW_SECRET="another-secret" \
  --dry-run=client -o yaml | kubectl apply -n production -f -
```

Then restart your pods so they pick up the new values:
```bash
kubectl rollout restart deployment nextjs-app -n production
```

---

### 🚀 Step 3: Push Helm Chart Updates to GitHub

Push the updated chart templates to GitHub so ArgoCD syncs the `envFrom` support:

```bash
git add helm/nextjs-app/templates/deployment.yaml helm/nextjs-app/values.yaml
git commit -m "feat(helm): add envFrom support for nextjs-secrets"
git push origin main
```

*(Optional alternative for full GitOps: If you ever want your secrets stored directly in git in encrypted form, you can install **Bitnami Sealed Secrets** or **External Secrets Operator**, but the `kubectl create secret` approach above is the simplest and standard production setup).*