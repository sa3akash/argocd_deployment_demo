export default function EcosystemResources() {
  const resources = [
    {
      title: "ArgoCD GitOps Engine",
      url: "https://argo-cd.readthedocs.io/",
      description:
        "Declarative, continuous delivery tool for Kubernetes following GitOps methodology with automated sync and rollouts.",
      tag: "Continuous Delivery",
      badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    },
    {
      title: "Kubernetes Production Docs",
      url: "https://kubernetes.io/docs/",
      description:
        "The official orchestrator documentation for Deployments, Horizontal Pod Autoscalers, Probes, and Cluster networking.",
      tag: "Orchestration",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    },
    {
      title: "Drizzle ORM Engine",
      url: "https://orm.drizzle.team/",
      description:
        "TypeScript ORM with zero dependencies and SQL-like ergonomics designed for serverless, edge, and containerized runtimes.",
      tag: "Database & ORM",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      title: "Next.js 16 App Router",
      url: "https://nextjs.org/docs",
      description:
        "React Server Components (RSC), Turbopack standalone builds, Server Actions, and dynamic streaming metadata.",
      tag: "Fullstack Framework",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      title: "Cloud Native Computing Foundation",
      url: "https://www.cncf.io/",
      description:
        "Open source foundation hosting critical cloud native projects including Kubernetes, Helm, Argo, and OpenTelemetry.",
      tag: "Cloud Native",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      title: "GitHub Project Repository",
      url: "https://github.com/sa3akash/argocd_deployment_demo",
      description:
        "Complete open-source repository containing Dockerfiles, Helm charts, GitHub Actions workflows, and Next.js source.",
      tag: "Source Code",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
  ];

  return (
    <section id="ecosystem" aria-labelledby="ecosystem-heading" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-400">
            Authoritative References
          </span>
          <h2 id="ecosystem-heading" className="text-2xl font-bold tracking-tight text-white mt-1">
            Cloud Native Ecosystem & Official Documentation
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Official resources power our production architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((res) => (
          <a
            key={res.title}
            href={res.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/70 transition-all duration-300 shadow-xl shadow-black/20 flex flex-col justify-between hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${res.badgeColor}`}
                >
                  {res.tag}
                </span>
                <span className="text-xs text-slate-500 group-hover:text-indigo-400 transition-colors">
                  ↗
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                {res.title}
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                {res.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-indigo-400 group-hover:underline">
              <span>Visit Official Documentation</span>
              <span>→</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
