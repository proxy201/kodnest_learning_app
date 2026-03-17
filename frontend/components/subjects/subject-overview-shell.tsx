"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Alert } from "@/components/common/alert";
import { Button } from "@/components/common/button";
import { Spinner } from "@/components/common/spinner";
import { AppShell } from "@/components/layout/app-shell";
import {
  type SubjectDetail,
  enrollInSubject,
  fetchFirstVideo,
  fetchSubjectDetail,
  fetchSubjectProgress
} from "@/lib/subjects";

export const SubjectOverviewShell = ({ subjectId }: { subjectId: number }) => {
  const router = useRouter();
  const { accessToken, ready } = useAuth();
  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const loadSubject = async () => {
      try {
        setLoading(true);
        setError(null);
        const detail = await fetchSubjectDetail(subjectId, accessToken);
        setSubject(detail);

        if (detail.isEnrolled && accessToken) {
          const progress = await fetchSubjectProgress(subjectId, accessToken);
          setProgressPercent(progress.progressPercent);
        } else {
          setProgressPercent(0);
        }
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load subject."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadSubject();
  }, [accessToken, ready, subjectId]);

  const startSubject = async () => {
    if (!accessToken) {
      router.push("/auth/login");
      return;
    }

    try {
      setBusy(true);
      const response = await fetchFirstVideo(subjectId, accessToken);

      if (response.videoId) {
        router.push(`/subjects/${subjectId}/video/${response.videoId}`);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to open the first lesson."
      );
    } finally {
      setBusy(false);
    }
  };

  const enroll = async () => {
    if (!accessToken) {
      router.push("/auth/login");
      return;
    }

    try {
      setBusy(true);
      await enrollInSubject(subjectId, accessToken);
      const refreshed = await fetchSubjectDetail(subjectId, accessToken);
      setSubject(refreshed);
      setProgressPercent(0);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to enroll right now."
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading || !subject) {
    return (
      <AppShell description="Loading the subject overview." eyebrow="Subject" title="Loading Subject">
        <div className="surface-panel rounded-[2rem] p-8">
          <Spinner label="Loading subject overview..." />
        </div>
      </AppShell>
    );
  }

  const totalLessons = subject.sections.reduce(
    (total, section) => total + section.videos.length,
    0
  );

  return (
    <AppShell
      description="Review the syllabus and continue from the next lesson."
      eyebrow="Subject"
      title={subject.title}
      actions={
        subject.isEnrolled ? (
          <Button disabled={busy} onClick={() => void startSubject()} type="button">
            {busy ? "Opening..." : "Continue Learning"}
          </Button>
        ) : (
          <Button disabled={busy} onClick={() => void enroll()} type="button">
            {busy ? "Enrolling..." : "Enroll Now"}
          </Button>
        )
      }
    >
      {error ? <Alert>{error}</Alert> : null}

      <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="surface-panel overflow-hidden rounded-[2rem]">
          <div
            className="relative min-h-[14rem] bg-cover bg-center p-8 text-white"
            style={{
              backgroundImage: subject.thumbnailUrl
                ? `linear-gradient(135deg, rgba(7,17,31,0.36), rgba(7,17,31,0.2)), url(${subject.thumbnailUrl})`
                : "linear-gradient(135deg, rgba(7,17,31,0.82), rgba(17,40,68,0.92))"
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(164,240,221,0.22),transparent_32%)]" />
            <div className="relative">
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                  {subject.isEnrolled ? "Enrolled" : "Open access"}
                </span>
                <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                  {subject.sections.length} sections
                </span>
              </div>
              <h2 className="font-display mt-5 max-w-2xl text-balance text-5xl leading-none">
                {subject.title}
              </h2>
            </div>
          </div>

          <div className="p-8">
            <p className="eyebrow text-ink/45">Overview</p>
            <p className="mt-4 text-base leading-7 text-ink/70">
              {subject.description ?? "A structured subject with clear sections and tracked lessons."}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Sections", value: subject.sections.length },
                { label: "Lessons", value: totalLessons },
                { label: "Progress", value: `${progressPercent}%` }
              ].map((item) => (
                <div className="surface-soft rounded-[1.5rem] px-5 py-5" key={item.label}>
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-ink">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="progress-track mt-8 h-3 overflow-hidden rounded-full">
              <div
                className="progress-fill h-full rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="surface-soft rounded-[1.5rem] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink/42">Status</p>
                <p className="mt-2 text-lg font-semibold text-ink">
                  {subject.isEnrolled ? "Ready to continue" : "Enroll to start"}
                </p>
              </div>
              <div className="surface-soft rounded-[1.5rem] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-ink/42">Structure</p>
                <p className="mt-2 text-lg font-semibold text-ink">
                  {totalLessons} guided lessons
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="surface-dark hero-grid rounded-[2rem] p-8 text-mist">
          <p className="eyebrow text-white/62">Syllabus</p>
          <div className="mt-6 space-y-4">
            {subject.sections.map((section) => (
              <div
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
                key={section.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold text-white">
                    {section.title}
                  </h2>
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-mist/70">
                    {section.videos.length} lessons
                  </span>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-mist/75">
                  {section.videos.map((video) => (
                    <li className="flex items-center justify-between gap-4" key={video.id}>
                      <span>
                        {video.order_index}. {video.title}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-mist/70">
                        Lesson
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
};
