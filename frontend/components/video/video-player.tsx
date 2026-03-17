"use client";

import { useEffect, useRef, useState } from "react";

import { VideoProgressBar } from "@/components/video/video-progress-bar";
import { getYoutubeVideoId } from "@/lib/youtube";

type PlayerWindow = Window & {
  YT?: {
    Player: new (
      elementId: string,
      config: Record<string, unknown>
    ) => {
      getCurrentTime: () => number;
      getDuration: () => number;
      seekTo: (seconds: number, allowSeekAhead: boolean) => void;
      destroy: () => void;
    };
    PlayerState: {
      PLAYING: number;
      PAUSED: number;
      ENDED: number;
    };
  };
  onYouTubeIframeAPIReady?: () => void;
};

const loadYoutubeApi = () =>
  new Promise<void>((resolve) => {
    const playerWindow = window as PlayerWindow;

    if (playerWindow.YT?.Player) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }

    playerWindow.onYouTubeIframeAPIReady = () => resolve();
  });

export const VideoPlayer = ({
  youtubeUrl,
  startPosition,
  onProgress,
  onCompleted
}: {
  youtubeUrl: string;
  startPosition: number;
  onProgress: (payload: { lastPositionSeconds: number; isCompleted: boolean }) => void;
  onCompleted: () => void;
}) => {
  const elementId = useRef(`yt-${Math.random().toString(36).slice(2)}`);
  const playerRef = useRef<{
    getCurrentTime: () => number;
    getDuration: () => number;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    destroy: () => void;
  } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentTime, setCurrentTime] = useState(startPosition);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const videoId = getYoutubeVideoId(youtubeUrl);

    if (!videoId) {
      return;
    }

    const playerWindow = window as PlayerWindow;

    const syncProgress = (isCompleted: boolean) => {
      if (!playerRef.current) {
        return;
      }

      const nextTime = Math.round(playerRef.current.getCurrentTime());
      const nextDuration = Math.round(playerRef.current.getDuration());
      setCurrentTime(nextTime);
      setDuration(nextDuration);
      onProgress({
        lastPositionSeconds: nextTime,
        isCompleted
      });
    };

    const startTracking = () => {
      if (intervalRef.current) {
        return;
      }

      intervalRef.current = setInterval(() => syncProgress(false), 5000);
    };

    const stopTracking = (isCompleted = false) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      syncProgress(isCompleted);
    };

    const mountPlayer = async () => {
      await loadYoutubeApi();

      playerRef.current = new playerWindow.YT!.Player(elementId.current, {
        videoId,
        playerVars: {
          start: startPosition
        },
        events: {
          onReady: () => {
            if (startPosition > 0) {
              playerRef.current?.seekTo(startPosition, true);
              setCurrentTime(startPosition);
            }
          },
          onStateChange: (event: { data: number }) => {
            if (!playerWindow.YT) {
              return;
            }

            if (event.data === playerWindow.YT.PlayerState.PLAYING) {
              startTracking();
            }

            if (event.data === playerWindow.YT.PlayerState.PAUSED) {
              stopTracking(false);
            }

            if (event.data === playerWindow.YT.PlayerState.ENDED) {
              stopTracking(true);
              onCompleted();
            }
          }
        }
      });
    };

    void mountPlayer();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (playerRef.current) {
        syncProgress(false);
        playerRef.current.destroy();
      }
    };
  }, [onCompleted, onProgress, startPosition, youtubeUrl]);

  return (
    <div className="surface-panel space-y-5 rounded-[2rem] p-6">
      <div className="overflow-hidden rounded-[1.5rem] bg-ink shadow-[0_20px_40px_rgba(7,17,31,0.22)]">
        <div className="aspect-video w-full" id={elementId.current} />
      </div>
      <VideoProgressBar currentTime={currentTime} duration={duration} />
    </div>
  );
};
