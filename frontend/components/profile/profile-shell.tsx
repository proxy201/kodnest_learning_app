"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/auth/auth-provider";
import { Alert } from "@/components/common/alert";
import { Spinner } from "@/components/common/spinner";
import { AppShell } from "@/components/layout/app-shell";
import { type SubjectSummary, fetchSubjects } from "@/lib/subjects";

export const ProfileShell = () => {
  const { accessToken, user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const averageProgress = subjects.length
    ? Math.round(
        subjects.reduce((total, subject) => total + subject.progressPercent, 0) /
          subjects.length
      )
    : 0;
  const completedLessons = subjects.reduce(
    (total, subject) => total + subject.completedVideos,
    0
  );
  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchSubjects(accessToken);
        setSubjects(response.subjects.filter((subject) => subject.isEnrolled));
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load your profile."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [accessToken]);

  return (
    <AuthGuard>
      <AppShell
        description="Account details and enrolled subjects in one place."
        eyebrow="Profile"
        title="Your Profile"
      >
        {loading ? (
          <div className="surface-panel rounded-[2rem] p-8">
            <Spinner label="Loading profile..." />
          </div>
        ) : null}

        {error ? <Alert>{error}</Alert> : null}

        <section className="grid gap-6 lg:grid-cols-[0.7fr_1fr]">
          <div className="surface-dark hero-grid rounded-[2rem] p-8 text-mist">
            <p className="eyebrow text-white/62">Account</p>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/12 bg-white/10 text-xl font-semibold text-white">
                {initials || "LP"}
              </div>
              <div>
                <h2 className="font-display text-4xl leading-none text-white">
                  {user?.name}
                </h2>
                <p className="mt-2 text-base text-mist/75">{user?.email}</p>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Role", value: user?.role ?? "student" },
                { label: "Active tracks", value: String(subjects.length).padStart(2, "0") },
                { label: "Avg progress", value: `${averageProgress}%` }
              ].map((item) => (
                <div className="metric-tile rounded-[1.5rem] px-4 py-4" key={item.label}>
                  <p className="text-xs uppercase tracking-[0.2em] text-mist/58">
                    {item.label}
                  </p>
                  <p className="mt-3 text-xl font-semibold capitalize text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/6 px-5 py-4 text-sm leading-7 text-mist/78">
              {completedLessons} lessons completed across active subjects.
            </div>
          </div>

          <div className="surface-panel rounded-[2rem] p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="eyebrow text-ink/45">Enrolled Subjects</p>
                <h3 className="font-display mt-3 text-3xl leading-none text-ink">
                  Current subjects
                </h3>
              </div>
              <Link
                className="action-secondary rounded-full px-4 py-2 text-sm font-medium transition"
                href="/"
              >
                Browse catalog
              </Link>
            </div>
            <div className="mt-6 space-y-4">
              {subjects.map((subject) => (
                <div
                  className="surface-soft rounded-[1.5rem] px-5 py-4"
                  key={subject.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-ink">
                        {subject.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-ink/65">
                        {subject.description ?? "Structured lessons with tracked progress."}
                      </p>
                    </div>
                    <span className="glass-chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/70">
                      {subject.progressPercent}%
                    </span>
                  </div>
                  <div className="progress-track mt-4 h-2 overflow-hidden rounded-full">
                    <div
                      className="progress-fill h-full rounded-full"
                      style={{ width: `${subject.progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                    <p className="text-ink/55">
                      {subject.completedVideos}/{subject.videoCount} lessons completed
                    </p>
                    <Link
                      className="font-semibold text-ink transition hover:text-[#10a37f]"
                      href={`/subjects/${subject.id}`}
                    >
                      Open subject
                    </Link>
                  </div>
                </div>
              ))}

              {!loading && subjects.length === 0 ? (
                <div className="surface-soft rounded-[1.5rem] px-5 py-5 text-sm leading-7 text-ink/68">
                  You are not enrolled in any subjects yet.
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </AppShell>
    </AuthGuard>
  );
};
