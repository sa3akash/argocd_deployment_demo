import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#030712",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://my.sa3avro.eu.cc"),
  title: {
    default: "CloudOps & GitOps Journal | Next.js, ArgoCD, Kubernetes",
    template: "%s | CloudOps Journal",
  },
  description:
    "Enterprise-grade DevOps, Kubernetes autoscaling (HPA), ArgoCD continuous delivery, Drizzle ORM, and fullstack Next.js 16 technical tutorials.",
  keywords: [
    "Kubernetes",
    "ArgoCD",
    "Next.js 16",
    "GitOps",
    "Drizzle ORM",
    "PostgreSQL",
    "Traefik Ingress",
    "DevOps",
    "Cloud Architecture",
    "HPA",
  ],
  authors: [{ name: "Shakil Ahmed", url: "https://my.sa3avro.eu.cc" }],
  creator: "Shakil Ahmed",
  publisher: "CloudOps Engineering",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CloudOps & GitOps Journal",
    description:
      "Enterprise-grade DevOps, Kubernetes autoscaling, ArgoCD continuous delivery, and fullstack Next.js tutorials.",
    url: "https://my.sa3avro.eu.cc",
    siteName: "CloudOps Engineering Journal",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CloudOps & GitOps Journal",
    description:
      "Enterprise-grade DevOps, Kubernetes autoscaling, ArgoCD continuous delivery, and fullstack Next.js tutorials.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark scroll-smooth h-full`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="min-h-full flex flex-col bg-[#030712] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
