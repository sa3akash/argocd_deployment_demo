import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#04060b] mt-20 pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center font-black text-sm text-white">
                ⚡
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">
                CloudOps Dispatch
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              An engineering publication dedicated to Kubernetes GitOps, ArgoCD
              automation, Drizzle ORM migrations, and resilient cloud architectures.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                ● In-Cluster PostgreSQL
              </span>
            </div>
          </div>

          {/* Publication Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Publications
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/#featured"
                  className="hover:text-white transition-colors"
                >
                  Featured Technical Story
                </Link>
              </li>
              <li>
                <Link
                  href="/#articles"
                  className="hover:text-white transition-colors"
                >
                  Latest Engineering Dispatches
                </Link>
              </li>
              <li>
                <Link
                  href="/#runbooks"
                  className="hover:text-white transition-colors"
                >
                  Production CLI Runbooks
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap.xml"
                  className="hover:text-white transition-colors"
                >
                  XML Sitemap
                </Link>
              </li>
              <li>
                <Link
                  href="/robots.txt"
                  className="hover:text-white transition-colors"
                >
                  Robots Index
                </Link>
              </li>
            </ul>
          </div>

          {/* External Authoritative Docs */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Ecosystem & Docs
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://argo-cd.readthedocs.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>ArgoCD GitOps Docs</span>
                  <span className="text-[10px]">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://kubernetes.io/docs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Kubernetes Documentation</span>
                  <span className="text-[10px]">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://orm.drizzle.team/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Drizzle ORM Engine</span>
                  <span className="text-[10px]">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://nextjs.org/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Next.js 16 Framework</span>
                  <span className="text-[10px]">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.cncf.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>CNCF Foundation</span>
                  <span className="text-[10px]">↗</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Project & Community */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Open Source
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every manifest, Helm template, Docker build, and Next.js component is
              open-source and automated via GitHub Actions and ArgoCD.
            </p>
            <div className="pt-2">
              <a
                href="https://github.com/sa3akash/argocd_deployment_demo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-white transition-all"
              >
                <span>⭐ Star on GitHub</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 CloudOps Dispatch. Engineered with Next.js 16 & Drizzle ORM.</p>
          <p className="flex items-center gap-2">
            <span>Author: Shakil Ahmed</span>
            <span>•</span>
            <span>All systems operational</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
