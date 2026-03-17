"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/auth/auth-provider";
import { Alert } from "@/components/common/alert";
import { Spinner } from "@/components/common/spinner";
import { AppShell } from "@/components/layout/app-shell";
import { SubjectSidebar } from "@/components/sidebar/subject-sidebar";
import { VideoMeta } from "@/components/video/video-meta";
import { VideoPlayer } from "@/components/video/video-player";
import { createDebouncedProgressSender } from "@/lib/progress";
import {
  type SubjectTree,
  type VideoDetail,
  fetchSubjectTree,
  fetchVideoDetail,
  fetchVideoProgress,
  saveVideoProgress
} from "@/lib/subjects";

export const LearnShell = ({
  subjectId,
  videoId
}: {
  subjectId: number;
  videoId: number;
}) => {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [tree, setTree] = useState<SubjectTree | null>(null);
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [startPosition, setStartPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const totalLessons =
    tree?.sections.reduce((total, section) => total + section.videos.length, 0) ?? 0;
  const completedLessons =
    tree?.sections.reduce(
      (total, section) =>
        total + section.videos.filter((lesson) => lesson.is_completed).length,
      0
    ) ?? 0;

  const progressSender = useMemo(
    () =>
      accessToken
        ? createDebouncedProgressSender(async (payload) => {
            await saveVideoProgress(videoId, accessToken, payload);
          })
        : null,
    [accessToken, videoId]
  );

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const loadLesson = async () => {
      try {
        setLoading(true);
        setError(null);
        const [subjectTree, videoDetail, progress] = await Promise.all([
          fetchSubjectTree(subjectId, accessToken),
          fetchVideoDetail(videoId, accessToken),
          fetchVideoProgress(videoId, accessToken)
        ]);

        if (videoDetail.locked) {
          router.push(`/subjects/${subjectId}`);
          return;
        }

        setTree(subjectTree);
        setVideo(videoDetail);
        setStartPosition(
          Math.max(
            videoDetail.lastPositionSeconds,
            progress.lastPositionSeconds
          )
        );
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load the lesson."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadLesson();

    return () => {
      if (progressSender) {
        void progressSender.flushNow();
      }
    };
  }, [accessToken, progressSender, router, subjectId, videoId]);

  const handleProgress = (payload: {
    lastPositionSeconds: number;
    isCompleted: boolean;
  }) => {
    progressSender?.push(payload);
  };

  const handleCompleted = async () => {
    if (!progressSender || !video) {
      return;
    }

    progressSender.push({
      lastPositionSeconds: video.durationSeconds ?? startPosition,
      isCompleted: true
    });
    await progressSender.flushNow();

    if (video.nextVideoId) {
      router.push(`/subjects/${subjectId}/video/${video.nextVideoId}`);
    }
  };

  const goToNext = async () => {
    if (video?.nextVideoId) {
      await progressSender?.flushNow();
      router.push(`/subjects/${subjectId}/video/${video.nextVideoId}`);
    }
  };

  return (
    <AuthGuard>
      <AppShell
        description={
          video
            ? `${video.subjectTitle} / ${video.sectionTitle}`
            : "Watch the lesson and move through the course outline."
        }
        eyebrow="Learning"
        title={video?.title ?? "Learning View"}
      >
        {loading ? (
          <div className="surface-panel rounded-[2rem] p-8">
            <Spinner label="Loading lesson..." />
          </div>
        ) : null}

        {error ? <Alert>{error}</Alert> : null}

        {tree && video ? (
          <section className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
            <SubjectSidebar
              currentVideoId={videoId}
              subjectId={subjectId}
              tree={tree}
            />
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {[
                  { label: "Lesson", value: video.title },
                  { label: "Section", value: video.sectionTitle },
                  { label: "Resume", value: `${startPosition}s` },
                  {
                    label: "Progress",
                    value: `${completedLessons}/${totalLessons}`
                  },
                  {
                    label: "Status",
                    value: video.isCompleted
                      ? "Completed"
                      : video.nextVideoId
                        ? "In progress"
                        : "Final lesson"
                  }
                ].map((item) => (
                  <div className="surface-panel rounded-[1.5rem] px-5 py-5" key={item.label}>
                    <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
                      {item.label}
                    </p>
                    <p className="mt-3 line-clamp-2 text-base font-semibold text-ink">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <VideoPlayer
                onCompleted={() => void handleCompleted()}
                onProgress={handleProgress}
                startPosition={startPosition}
                youtubeUrl={video.youtubeUrl}
              />
              <VideoMeta
                description={video.description}
                nextVideoId={video.nextVideoId}
                onNext={() => void goToNext()}
                prevVideoId={video.prevVideoId}
                subjectId={subjectId}
                title={video.title}
              />
            </div>
          </section>
        ) : null}
      </AppShell>
    </AuthGuard>
  );
};
