"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Alert } from "@/components/common/alert";
import { Button } from "@/components/common/button";
import { type AuthUser, fetchCurrentUser } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { AppShell } from "@/components/layout/app-shell";
import { type SubjectSummary, fetchSubjects } from "@/lib/subjects";

export const DashboardShell = () => {
  const router = useRouter();
  const { accessToken, logout, ready, restore, status, user } = useAuth();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (status === "anonymous") {
      router.replace("/auth/login");
    }
  }, [ready, router, status]);

  useEffect(() => {
    const loadWorkspace = async (token: string) => {
      const [profileResponse, subjectsResponse] = await Promise.all([
        fetchCurrentUser(token),
        fetchSubjects(token)
      ]);

      setProfile(profileResponse.user);
      setSubjects(subjectsResponse.subjects);
    };

    const loadDashboard = async () => {
      if (!accessToken) {
        return;
      }

      try {
        setError(null);
        await loadWorkspace(accessToken);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          const restored = await restore();

          if (!restored?.accessToken) {
            router.replace("/auth/login");
            return;
          }

          await loadWorkspace(restored.accessToken);
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load the profile."
        );
      }
    };

    void loadDashboard();
  }, [accessToken, restore, router]);

  if (!ready || status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-10 text-ink">
        <div className="surface-panel rounded-[2rem] px-8 py-6">
          Loading your dashboard...
        </div>
      </main>
    );
  }

  const activeUser = profile ?? user;
  const firstName = activeUser?.name?.split(" ")[0];
  const enrolledSubjects = subjects.filter((subject) => subject.isEnrolled);
  const completedLessons = subjects.reduce(
    (total, subject) => total + subject.completedVideos,
    0
  );
  const averageProgress = subjects.length
    ? Math.round(
        subjects.reduce((total, subject) => total + subject.progressPercent, 0) /
          subjects.length
      )
    : 0;
  const completedTracks = subjects.filter(
    (subject) => subject.progressPercent === 100
  ).length;
  const recommendedSubject =
    [...enrolledSubjects].sort(
      (left, right) => right.progressPercent - left.progressPercent
    )[0] ?? subjects[0] ?? null;
  const summaryItems = [
    {
      label: "Active",
      value: `${enrolledSubjects.length} subject${enrolledSubjects.length === 1 ? "" : "s"}`
    },
    {
      label: "Completed",
      value: `${completedTracks} track${completedTracks === 1 ? "" : "s"}`
    },
    {
      label: "Focus",
      value: recommendedSubject?.title ?? "Choose a subject"
    }
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push("/auth/login");
  };

  return (
    <AppShell
      actions={
        <Button disabled={loggingOut} onClick={() => void handleLogout()} type="button">
          {loggingOut ? "Logging out..." : "Logout"}
        </Button>
      }
      description="A clean view of current progress, active subjects, and the next lesson."
      eyebrow="Dashboard"
      title={activeUser ? `Welcome, ${activeUser.name}.` : "Welcome back."}
    >
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="surface-dark hero-grid relative overflow-hidden rounded-[2rem] p-8 text-mist">
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <p className="eyebrow text-white/62">Overview</p>
            <h2 className="font-display mt-4 max-w-2xl text-balance text-4xl leading-none text-white">
              {firstName ? `Continue, ${firstName}.` : "Continue learning."}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-mist/78">
              Pick up the next lesson, review your progress, or move into another subject.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {recommendedSubject ? (
                <Link
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-[0_18px_38px_rgba(7,17,31,0.2)] transition hover:-translate-y-0.5"
                  href={`/subjects/${recommendedSubject.id}`}
                >
                  Continue {recommendedSubject.title}
                </Link>
              ) : (
                <Link
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-[0_18px_38px_rgba(7,17,31,0.2)] transition hover:-translate-y-0.5"
                  href="/"
                >
                  Explore Subjects
                </Link>
              )}
              <Link
                className="rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/12"
                href="/profile"
              >
                View Profile
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Active tracks",
                  value: String(enrolledSubjects.length).padStart(2, "0")
                },
                {
                  label: "Lessons done",
                  value: String(completedLessons).padStart(2, "0")
                },
                { label: "Avg progress", value: `${averageProgress}%` }
              ].map((stat) => (
                <div className="metric-tile rounded-[1.5rem] px-4 py-5" key={stat.label}>
                  <p className="text-xs uppercase tracking-[0.2em] text-mist/55">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* <div className="surface-panel rounded-[2rem] p-8">
            <p className="eyebrow text-ink/45">Account</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Email", value: activeUser?.email ?? "Loading..." },
                { label: "Role", value: activeUser?.role ?? "Loading..." },
                {
                  label: "Completed",
                  value: String(completedTracks).padStart(2, "0")
                }
              ].map((item) => (
                <div className="surface-soft rounded-[1.5rem] px-5 py-4" key={item.label}>
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
                    {item.label}
                  </p>
                  <p className="mt-2 text-base font-semibold capitalize text-ink">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            {error ? (
              <div className="mt-5">
                <Alert>{error}</Alert>
              </div>
            ) : null}
          </div> */}
        </div>

        <div className="space-y-6">
          <div className="surface-panel rounded-[2rem] p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-ink/45">Next Up</p>
                <h3 className="font-display mt-3 text-3xl leading-none text-ink">
                  {recommendedSubject ? recommendedSubject.title : "Choose a subject"}
                </h3>
              </div>
              <span className="glass-chip rounded-full px-4 py-2 text-sm font-medium text-ink/65">
                {recommendedSubject?.progressPercent ?? 0}% complete
              </span>
            </div>

            <p className="mt-4 text-base leading-7 text-ink/68">
              {recommendedSubject?.description ??
                "Your most relevant subject will appear here once you start learning."}
            </p>

            <div className="progress-track mt-6 h-3 overflow-hidden rounded-full">
              <div
                className="progress-fill h-full rounded-full"
                style={{ width: `${recommendedSubject?.progressPercent ?? 0}%` }}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="surface-soft rounded-[1.5rem] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
                  Lessons
                </p>
                <p className="mt-2 text-2xl font-semibold text-ink">
                  {recommendedSubject
                    ? `${recommendedSubject.completedVideos}/${recommendedSubject.videoCount}`
                    : "0/0"}
                </p>
              </div>
              <div className="surface-soft rounded-[1.5rem] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
                  Enrollment
                </p>
                <p className="mt-2 text-2xl font-semibold text-ink">
                  {recommendedSubject?.isEnrolled ? "Active" : "Open"}
                </p>
              </div>
            </div>
          </div>

          <div className="surface-panel rounded-[2rem] p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="eyebrow text-ink/45">Summary</p>
                <h3 className="font-display mt-3 text-3xl leading-none text-ink">
                  Current snapshot
                </h3>
              </div>
              <Link
                className="action-secondary rounded-full px-4 py-2 text-sm font-medium transition"
                href="/"
              >
                Browse catalog
              </Link>
            </div>
            <div className="mt-6 grid gap-4">
              {summaryItems.map((item) => (
                <div
                  className="surface-soft rounded-[1.5rem] px-5 py-4"
                  key={item.label}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
                    {item.label}
                  </p>
                  <p className="mt-2 text-base font-semibold text-ink">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
};
