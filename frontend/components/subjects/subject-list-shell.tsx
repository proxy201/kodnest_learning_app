"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Alert } from "@/components/common/alert";
import { Spinner } from "@/components/common/spinner";
import { AppShell } from "@/components/layout/app-shell";
import { type SubjectSummary, fetchSubjects } from "@/lib/subjects";

export const SubjectListShell = () => {
  const { accessToken, ready, status, user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const enrolledCount = subjects.filter((subject) => subject.isEnrolled).length;
  const completedLessons = subjects.reduce(
    (total, subject) => total + subject.completedVideos,
    0
  );
  const averageProgress = subjects.length
    ? Math.round(
        subjects.reduce(
          (total, subject) => total + subject.progressPercent,
          0
        ) / subjects.length
      )
    : 0;
  const featuredSubjects = [...subjects]
    .sort((left, right) => right.progressPercent - left.progressPercent)
    .slice(0, 3);
  const firstName = user?.name?.split(" ")[0];

  useEffect(() => {
    if (!ready) {
      return;
    }

    const loadSubjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchSubjects(accessToken);
        setSubjects(response.subjects);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load subjects."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadSubjects();
  }, [accessToken, ready]);

  return (
    <AppShell
      description="Browse subjects, review progress, and continue where you left off."
      eyebrow="Discover"
      title="Explore Subjects"
    >
      {loading ? (
        <div className="surface-panel rounded-[2rem] p-8">
          <Spinner label="Loading subjects..." />
        </div>
      ) : null}

      {error ? <Alert>{error}</Alert> : null}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-dark hero-grid relative overflow-hidden rounded-[2rem] p-8 text-mist sm:p-10">
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <p className="eyebrow text-white/62">Catalog</p>
          <h2 className="font-display mt-4 max-w-xl text-balance text-4xl leading-none text-white sm:text-5xl">
            {firstName ? `Welcome back, ${firstName}.` : "Find the next lesson."}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-mist/78">
            View subject access, lesson counts, and progress in one place.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-[0_18px_38px_rgba(7,17,31,0.2)] transition hover:-translate-y-0.5"
              href={status === "authenticated" ? "/dashboard" : "/auth/login"}
            >
              {status === "authenticated" ? "Open Dashboard" : "Log In to Continue"}
            </Link>
            <Link
              className="rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/12"
              href={status === "authenticated" ? "/profile" : "/auth/register"}
            >
              {status === "authenticated" ? "View Profile" : "Create Account"}
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Subjects", value: String(subjects.length).padStart(2, "0") },
              { label: "Enrolled", value: String(enrolledCount).padStart(2, "0") },
              { label: "Lessons done", value: String(completedLessons).padStart(2, "0") }
            ].map((item) => (
              <div
                className="metric-tile rounded-[1.5rem] px-5 py-5"
                key={item.label}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-mist/58">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel rounded-[2rem] p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow text-ink/45">Top Progress</p>
              <h3 className="font-display mt-3 text-3xl leading-none text-ink">
                Continue your strongest subjects.
              </h3>
            </div>
            <div className="glass-chip rounded-full px-4 py-2 text-sm font-medium text-ink/65">
              Average {averageProgress}%
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {featuredSubjects.length > 0 ? (
              featuredSubjects.map((subject) => (
                <div
                  className="surface-soft rounded-[1.5rem] px-5 py-4"
                  key={subject.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-ink">{subject.title}</p>
                      <p className="mt-1 text-sm text-ink/56">
                        {subject.completedVideos}/{subject.videoCount} lessons completed
                      </p>
                    </div>
                    <span className="glass-chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/68">
                      {subject.isEnrolled ? "Active" : "Explore"}
                    </span>
                  </div>
                  <div className="progress-track mt-4 h-2 overflow-hidden rounded-full">
                    <div
                      className="progress-fill h-full rounded-full"
                      style={{ width: `${subject.progressPercent}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="surface-soft rounded-[1.5rem] px-5 py-5 text-sm leading-7 text-ink/68">
                Subjects will appear here as soon as the catalog is available.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {subjects.map((subject) => (
          <article
            className="surface-panel spotlight-border interactive-panel overflow-hidden rounded-[2rem]"
            key={subject.id}
          >
            <div
              className="relative h-52 bg-cover bg-center"
              style={{
                backgroundImage: subject.thumbnailUrl
                  ? `linear-gradient(135deg, rgba(7,17,31,0.18), rgba(7,17,31,0.04)), url(${subject.thumbnailUrl})`
                  : "linear-gradient(135deg, rgba(16,163,127,0.24), rgba(255,255,255,0.18))"
              }}
            >
              <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
                  {subject.isEnrolled ? "In progress" : "Available now"}
                </span>
                <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
                  {subject.sectionCount} sections
                </span>
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(7,17,31,0.45))]" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white">
                <div>
                  <p className="eyebrow text-white/70">Subject</p>
                  <h2 className="font-display mt-2 text-3xl leading-none">
                    {subject.title}
                  </h2>
                </div>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/85">
                  {subject.videoCount} lessons
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between gap-4 text-sm text-ink/55">
                <p className="eyebrow text-ink/45">Progress</p>
                <span className="glass-chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/70">
                  {subject.progressPercent}% complete
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-ink/65">
                {subject.description ?? "A structured learning path with guided sections, video lessons, and tracked progress."}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="surface-soft rounded-[1.25rem] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/42">
                    Completed
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">
                    {subject.completedVideos}/{subject.videoCount}
                  </p>
                </div>
                <div className="surface-soft rounded-[1.25rem] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/42">
                    Access
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink">
                    {subject.isEnrolled ? "Ready to resume" : "Open for enrollment"}
                  </p>
                </div>
              </div>

              <div className="progress-track mt-5 h-2 overflow-hidden rounded-full">
                <div
                  className="progress-fill h-full rounded-full transition-all"
                  style={{ width: `${subject.progressPercent}%` }}
                />
              </div>

              <div className="mt-6 flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-ink">
                    {subject.isEnrolled ? "Enrolled" : "Not enrolled"}
                  </p>
                  <p className="text-ink/55">
                    {subject.progressPercent}% complete
                  </p>
                </div>
                <Link
                  className="action-primary rounded-full px-5 py-3 font-semibold transition"
                  href={`/subjects/${subject.id}`}
                >
                  {subject.isEnrolled ? "Continue" : "View Subject"}
                </Link>
              </div>
            </div>
          </article>
        ))}

        {!loading && subjects.length === 0 ? (
          <div className="surface-panel rounded-[2rem] p-8 md:col-span-2 xl:col-span-3">
            <p className="eyebrow text-ink/45">Catalog</p>
            <h3 className="font-display mt-4 text-3xl text-ink">
              No subjects are available yet.
            </h3>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink/65">
              Subjects will appear here once they are available in the catalog.
            </p>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
};
