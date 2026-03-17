import Link from "next/link";
import type { ReactNode } from "react";

import { ProjectAssistant } from "@/components/chat/project-assistant";

export const AppShell = ({
  eyebrow = "Learning Platform",
  title,
  description,
  children,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) => (
  <main className="relative min-h-screen overflow-hidden px-5 py-6 text-ink sm:px-8 sm:py-8 lg:px-12 lg:py-10">
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[22rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_70%)]" />
    <div className="pointer-events-none absolute left-[7%] top-24 -z-10 h-28 w-28 rounded-full bg-[#10a37f]/12 blur-3xl float-orb" />
    <div className="pointer-events-none absolute right-[8%] top-20 -z-10 h-36 w-36 rounded-full bg-white/10 blur-3xl drift-orb" />

    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="surface-panel flex flex-col gap-4 rounded-[1.5rem] px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link
          className="flex items-center gap-3 self-start rounded-full pr-3 transition hover:translate-x-0.5"
          href="/"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#111827_0%,#1f2937_100%)] text-sm font-bold uppercase tracking-[0.18em] text-white">
            LP
          </span>
          <span className="block text-sm font-semibold text-ink">Learning Platform</span>
        </Link>

        <div className="flex flex-wrap gap-3 text-sm font-medium text-ink/70">
          <Link className="action-secondary rounded-full px-4 py-2.5 transition" href="/">
            Home
          </Link>
          <Link className="action-secondary rounded-full px-4 py-2.5 transition" href="/dashboard">
            Dashboard
          </Link>
          <Link className="action-secondary rounded-full px-4 py-2.5 transition" href="/profile">
            Profile
          </Link>
        </div>
      </div>

      <header className="surface-panel spotlight-border relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-[#10a37f]/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="eyebrow text-ink/42">{eyebrow}</span>
            <h1 className="font-display mt-4 max-w-3xl text-balance text-4xl leading-none text-ink sm:text-5xl lg:text-[3.6rem]">
              {title}
            </h1>
            {description ? (
              <p className="mt-4 max-w-2xl text-base leading-7 text-ink/64 sm:text-lg">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div className="flex flex-wrap gap-3">
              {actions}
            </div>
          ) : null}
        </div>
      </header>
      {children}
    </div>
    <ProjectAssistant />
  </main>
);
