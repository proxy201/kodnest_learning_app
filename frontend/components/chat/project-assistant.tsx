"use client";

import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type FormEvent
} from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Alert } from "@/components/common/alert";
import { Button } from "@/components/common/button";
import { askProjectAssistant, type ProjectChatMessage } from "@/lib/chat";

const STARTER_MESSAGE: ProjectChatMessage = {
  role: "assistant",
  content:
    "Ask me about this learning platform project, including subjects, auth, progress, dashboard flow, or deployment."
};

const trimMessages = (messages: ProjectChatMessage[]) => messages.slice(-10);

export const ProjectAssistant = () => {
  const { accessToken, status } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ProjectChatMessage[]>([STARTER_MESSAGE]);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }

    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [isOpen, messages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = input.trim();

    if (!content || isSending) {
      return;
    }

    const userMessage: ProjectChatMessage = {
      role: "user",
      content
    };
    const nextMessages = trimMessages([...messages, userMessage]);

    setInput("");
    setError(null);
    setIsSending(true);
    startTransition(() => {
      setMessages(nextMessages);
    });

    try {
      const response = await askProjectAssistant(nextMessages, accessToken);
      const assistantMessage: ProjectChatMessage = {
        role: "assistant",
        content: response.reply
      };

      startTransition(() => {
        setMessages((currentMessages) =>
          trimMessages([...currentMessages, assistantMessage])
        );
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to reach the project assistant."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        className="action-primary fixed bottom-6 right-6 z-40 rounded-full px-5 py-3 text-sm font-semibold transition"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {isOpen ? "Close assistant" : "Project assistant"}
      </button>

      {isOpen ? (
        <section className="surface-panel fixed bottom-24 right-4 z-40 flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-4 rounded-[1.75rem] p-4 sm:right-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-ink/45">Assistant</p>
              <h2 className="mt-2 text-xl font-semibold text-ink">
                Project-only chatbot
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                {status === "authenticated"
                  ? "Answers can use your current project progress."
                  : "Answers stay limited to this project."}
              </p>
            </div>
            <span className="glass-chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/62">
              {status === "authenticated" ? "Signed in" : "Public"}
            </span>
          </div>

          <div
            className="surface-soft max-h-[22rem] space-y-3 overflow-y-auto rounded-[1.5rem] px-3 py-3"
            ref={listRef}
          >
            {messages.map((message, index) => (
              <div
                className={`rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "bg-white/8 text-ink"
                    : "ml-auto bg-[#10a37f]/14 text-ink"
                }`.trim()}
                key={`${message.role}-${index}`}
              >
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/45">
                  {message.role === "assistant" ? "Assistant" : "You"}
                </p>
                <p>{message.content}</p>
              </div>
            ))}
            {isSending ? (
              <div className="rounded-[1.25rem] bg-white/8 px-4 py-3 text-sm text-ink/65">
                Thinking...
              </div>
            ) : null}
          </div>

          {error ? <Alert>{error}</Alert> : null}

          <form className="flex flex-col gap-3" onSubmit={(event) => void handleSubmit(event)}>
            <input
              className="glass-input rounded-2xl px-4 py-3 transition"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about subjects, auth, progress, or deployment..."
              type="text"
              value={input}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs leading-5 text-ink/52">
                Unrelated questions are blocked.
              </p>
              <Button disabled={isSending || input.trim().length === 0} type="submit">
                {isSending ? "Sending..." : "Send"}
              </Button>
            </div>
          </form>
        </section>
      ) : null}
    </>
  );
};
