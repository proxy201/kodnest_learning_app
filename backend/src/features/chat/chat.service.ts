import { env } from "../../config/env.js";
import type { AuthUserPayload } from "../../lib/auth.js";
import { getSubjectList } from "../subjects/subject.service.js";
import type { ChatMessageInput } from "./chat.schema.js";

const HUGGING_FACE_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";
const LMS_FALLBACK_GENERAL_REPLY =
  "The AI provider is unavailable right now. I can still help with this learning platform, your subjects, progress, and course flow.";
const GREETING_PATTERNS = [
  "hello",
  "hi",
  "hey",
  "good morning",
  "good afternoon",
  "good evening"
];
const PROJECT_SCOPE_KEYWORDS = [
  "learning platform",
  "lms",
  "platform",
  "website",
  "app",
  "purpose",
  "use",
  "subject",
  "subjects",
  "course",
  "courses",
  "lesson",
  "lessons",
  "video",
  "videos",
  "progress",
  "dashboard",
  "profile",
  "login",
  "log in",
  "sign in",
  "sign up",
  "register",
  "account",
  "auth",
  "authentication",
  "token",
  "refresh",
  "enroll",
  "enrollment",
  "frontend",
  "backend",
  "api",
  "stack",
  "tech stack",
  "component",
  "components",
  "route",
  "routes",
  "render",
  "deploy",
  "deployment",
  "mysql",
  "database",
  "hugging face",
  "chatbot",
  "assistant"
];

type HuggingFaceChatResponse = {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            type?: string;
            text?: string;
          }>;
    };
  }>;
  error?: {
    message?: string;
  } | string;
};

export class ChatConfigError extends Error {
  status: number;

  constructor(message: string, status = 503) {
    super(message);
    this.name = "ChatConfigError";
    this.status = status;
  }
}

type ProjectSubject = Awaited<ReturnType<typeof getSubjectList>>[number];
type ProjectContextData = {
  user: AuthUserPayload | null;
  subjects: ProjectSubject[];
};

const CHAT_LOG_PREFIX = "[chat-service]";

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

const buildMessagePreview = (value: string, limit = 140) => {
  const normalizedValue = value.replace(/\s+/g, " ").trim();

  if (normalizedValue.length <= limit) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, limit - 3)}...`;
};

const logChat = (event: string, details?: Record<string, unknown>) => {
  const payload = {
    timestamp: new Date().toISOString(),
    event,
    ...(details ?? {})
  };

  console.log(`${CHAT_LOG_PREFIX} ${JSON.stringify(payload)}`);
};

const logChatError = (event: string, details?: Record<string, unknown>) => {
  const payload = {
    timestamp: new Date().toISOString(),
    event,
    ...(details ?? {})
  };

  console.error(`${CHAT_LOG_PREFIX} ${JSON.stringify(payload)}`);
};

const isGreetingMessage = (value: string) => {
  const normalizedValue = normalize(value).replace(/[!.,?]/g, "");

  return (
    GREETING_PATTERNS.some((greeting) => normalizedValue === greeting) ||
    (GREETING_PATTERNS.some((greeting) => normalizedValue.startsWith(`${greeting} `)) &&
      normalizedValue.split(" ").length <= 6)
  );
};

const isProjectScopedConversation = (messages: ChatMessageInput[]) => {
  const combined = normalize(
    messages
      .filter((message) => message.role === "user")
      .map((message) => message.content)
      .join(" ")
  );

  return (
    PROJECT_SCOPE_KEYWORDS.some((keyword) => combined.includes(keyword)) ||
    /\/(auth|dashboard|profile|subjects|api)\b/.test(combined)
  );
};

const buildProjectContextData = async (
  user: AuthUserPayload | null
): Promise<ProjectContextData> => {
  const subjects = await getSubjectList(user);

  return {
    user,
    subjects
  };
};

const buildProjectContext = (context: ProjectContextData) => {
  const { subjects, user } = context;
  const subjectLines = subjects.slice(0, 8).map((subject) => {
    const enrollment = subject.isEnrolled ? "enrolled" : "not enrolled";
    return `- ${subject.title}: ${enrollment}, ${subject.progressPercent}% progress, ${subject.completedVideos}/${subject.videoCount} lessons completed`;
  });

  return [
    "Project summary:",
    "- Frontend: Next.js 15 with React and Tailwind CSS.",
    "- Backend: Express with TypeScript and MySQL.",
    "- Auth: JWT access tokens plus an HTTP-only refresh cookie.",
    "- Product flows: browse subjects, enroll, watch lessons, and track progress.",
    "- Main screens: home catalog, dashboard, profile, subject overview, and lesson player.",
    "- Deployment: Render/Vercel-friendly setup with env-driven frontend and backend URLs.",
    user
      ? `Authenticated user: ${user.name} (${user.email}), role=${user.role}.`
      : "Authenticated user: none.",
    "Visible subject context:",
    ...(subjectLines.length > 0 ? subjectLines : ["- No subjects are currently available."])
  ].join("\n");
};

const getLatestUserMessage = (messages: ChatMessageInput[]) =>
  normalize(
    [...messages]
      .reverse()
      .find((message) => message.role === "user")
      ?.content ?? ""
  );

const formatSubjectList = (subjects: ProjectSubject[]) => {
  if (subjects.length === 0) {
    return "No subjects are currently available in the platform.";
  }

  return subjects
    .slice(0, 5)
    .map((subject) => {
      const progressNote = subject.isEnrolled
        ? `You are enrolled with ${subject.progressPercent}% progress.`
        : "It is available to enroll.";

      return `${subject.title}: ${subject.videoCount} lessons across ${subject.sectionCount} sections. ${progressNote}`;
    })
    .join(" ");
};

const buildFallbackPrefix = (reason?: string) =>
  reason ? `${reason} ` : "";

const createLocalProjectReply = ({
  messages,
  context,
  reason
}: {
  messages: ChatMessageInput[];
  context: ProjectContextData;
  reason?: string;
}) => {
  const latestUserMessage = getLatestUserMessage(messages);
  const prefix = buildFallbackPrefix(reason);

  if (isGreetingMessage(latestUserMessage)) {
    return `${prefix}Hello. I can help with this learning platform, including subjects, lessons, progress, login, dashboard flow, and deployment setup.`;
  }

  if (
    /what (is|does).*?(platform|website|app)/.test(latestUserMessage) ||
    /(use|purpose).*?(platform|website|app)/.test(latestUserMessage)
  ) {
    return `${prefix}This platform is a learning management system for browsing subjects, enrolling in courses, watching lesson videos, and tracking progress. It includes authentication, a dashboard, a profile page, subject overviews, and guided lesson playback.`;
  }

  if (
    latestUserMessage.includes("subject") ||
    latestUserMessage.includes("course") ||
    latestUserMessage.includes("available")
  ) {
    return `${prefix}${formatSubjectList(context.subjects)}`;
  }

  if (
    latestUserMessage.includes("login") ||
    latestUserMessage.includes("log in") ||
    latestUserMessage.includes("sign in") ||
    latestUserMessage.includes("sign up") ||
    latestUserMessage.includes("register") ||
    latestUserMessage.includes("auth")
  ) {
    return `${prefix}The platform uses email/password authentication with JWT access tokens and an HTTP-only refresh cookie. Users can sign up, sign in, restore sessions, and then access their dashboard, profile, subjects, and lesson progress.`;
  }

  if (
    latestUserMessage.includes("dashboard") ||
    latestUserMessage.includes("progress") ||
    latestUserMessage.includes("profile")
  ) {
    return `${prefix}The dashboard highlights active subjects, lesson counts, and progress. The profile page shows account details and enrolled subjects. Progress is updated as lessons are watched and completed.`;
  }

  if (
    latestUserMessage.includes("deploy") ||
    latestUserMessage.includes("deployment") ||
    latestUserMessage.includes("render")
  ) {
    return `${prefix}This project is set up for deployment with a Next.js frontend, an Express backend, and a MySQL database. Environment variables control the frontend API URL, backend origin, JWT secrets, and database connectivity.`;
  }

  return `${prefix}This project is a learning platform built with a Next.js frontend and an Express/MySQL backend. It supports authentication, subject enrollment, video lessons, progress tracking, dashboard views, and deployment on Render.`;
};

const buildSystemPrompt = (projectContext: string) => `
You are the in-app AI tutor for this learning management system.

Rules:
- Help with LMS questions, current subjects, lessons, study flow, progress, and deployment/platform behavior.
- You may also answer general educational or programming questions, especially if they relate to the available subjects.
- Use the provided project context when the question is about this LMS or the user's learning progress.
- Do not claim to access private account data beyond the provided context.
- Do not provide harmful, illegal, or unsafe guidance.
- Keep answers clear, practical, and usually under 200 words.
- Never invent LMS-specific features that are not present in the provided context.

${projectContext}
`.trim();

const extractAssistantReply = (payload: HuggingFaceChatResponse) => {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (part.type === "text" ? part.text ?? "" : ""))
      .join("")
      .trim();
  }

  return "";
};

export const createProjectChatReply = async ({
  messages,
  user
}: {
  messages: ChatMessageInput[];
  user: AuthUserPayload | null;
}) => {
  const latestUserMessage = getLatestUserMessage(messages);
  const conversation = messages
    .map((message) => ({
      role: message.role,
      content: message.content.trim()
    }))
    .filter((message) => message.content.length > 0)
    .slice(-10);
  const userMessageCount = conversation.filter((message) => message.role === "user").length;
  const projectScoped = isProjectScopedConversation(conversation);
  const greetingMessage = isGreetingMessage(latestUserMessage);

  let context: ProjectContextData;

  try {
    context = await buildProjectContextData(user);
    logChat("context_loaded", {
      subjectCount: context.subjects.length,
      enrolledSubjectCount: context.subjects.filter((subject) => subject.isEnrolled).length
    });
  } catch (error) {
    logChatError("context_load_failed", {
      message:
        error instanceof Error ? error.message : "Unknown context loading error."
    });
    throw error;
  }

  if (greetingMessage) {
    logChat("greeting_short_circuit", {
      latestUserMessagePreview: buildMessagePreview(latestUserMessage)
    });
    return createLocalProjectReply({
      messages,
      context
    });
  }

  if (!env.HUGGING_FACE_API_KEY) {
    logChat("provider_not_configured", {
      fallback: projectScoped ? "local_project_reply" : "limited_lms_reply"
    });

    if (!projectScoped) {
      return LMS_FALLBACK_GENERAL_REPLY;
    }

    return createLocalProjectReply({
      messages,
      context,
      reason:
        "The external model is not configured yet, so this answer is based on local project data."
    });
  }

  try {
    const projectContext = buildProjectContext(context);
    logChat("hugging_face_request_started", {
      url: HUGGING_FACE_CHAT_URL,
      model: env.HUGGING_FACE_MODEL,
      messageCount: conversation.length
    });

    const response = await fetch(HUGGING_FACE_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.HUGGING_FACE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.HUGGING_FACE_MODEL,
        temperature: 0.2,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(projectContext)
          },
          ...conversation
        ]
      })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as HuggingFaceChatResponse | null;
      const providerError =
        typeof payload?.error === "string"
          ? payload.error
          : payload?.error?.message ?? null;

      const fallbackReason =
        response.status === 401 || response.status === 403
          ? "The Hugging Face token is not allowed to call Inference Providers, so this answer is based on local project data."
          : "The external model is unavailable right now, so this answer is based on local project data.";

      logChatError("hugging_face_request_failed", {
        status: response.status,
        statusText: response.statusText,
        providerError,
        fallbackReason
      });

      return createLocalProjectReply({
        messages: conversation,
        context,
        reason: fallbackReason
      });
    }

    const payload = (await response.json()) as HuggingFaceChatResponse;
    const reply = extractAssistantReply(payload);

    logChat("hugging_face_request_succeeded", {
      replyLength: reply.length
    });

    if (!reply) {
      logChatError("empty_provider_reply", {
        payloadKeys: Object.keys(payload ?? {})
      });
    }

    return reply || "I can help with this project, but I could not generate a reply just now.";
  } catch (error) {
    logChatError("hugging_face_request_exception", {
      message: error instanceof Error ? error.message : "Unknown fetch error."
    });
    return createLocalProjectReply({
      messages: conversation,
      context,
      reason:
        "The external model could not be reached, so this answer is based on local project data."
    });
  }
};
