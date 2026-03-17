type ProgressPayload = {
  lastPositionSeconds: number;
  isCompleted: boolean;
};

export const createDebouncedProgressSender = (
  onSend: (payload: ProgressPayload) => void | Promise<void>,
  delayMs = 5000
) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let latestPayload: ProgressPayload | null = null;

  const flush = async () => {
    if (!latestPayload) {
      return;
    }

    const payload = latestPayload;
    latestPayload = null;
    await onSend(payload);
  };

  return {
    push(payload: ProgressPayload) {
      latestPayload = payload;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        timeoutId = null;
        void flush();
      }, delayMs);
    },
    async flushNow() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      await flush();
    }
  };
};

