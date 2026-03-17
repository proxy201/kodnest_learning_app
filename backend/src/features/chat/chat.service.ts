import { env } from "../../config/env.js";
import type { AuthUserPayload } from "../../lib/auth.js";
import { getSubjectList } from "../subjects/subject.service.js";
import type { ChatMessageInput } from "./chat.schema.js";

const HUGGING_FACE_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";
const PROJECT_ONLY_REPLY =
  "I can only help with this learning platform project. Ask me about subjects, auth, progress, dashboard, deployment, or project features.";
const PROJECT_SCOPE_KEYWORDS = [
  "learning platform",
  "lms",
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

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

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

const buildProjectContext = async (user: AuthUserPayload | null) => {
  const subjects = await getSubjectList(user);
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
    "- Deployment: Render-friendly setup with the frontend proxying /api/* requests to the backend.",
    user
      ? `Authenticated user: ${user.name} (${user.email}), role=${user.role}.`
      : "Authenticated user: none.",
    "Visible subject context:",
    ...(subjectLines.length > 0 ? subjectLines : ["- No subjects are currently available."])
  ].join("\n");
};

const buildSystemPrompt = (projectContext: string) => `
You are the in-app assistant for this learning platform project.

Rules:
- Answer only about this LMS project, its features, project structure, subject flow, auth flow, progress tracking, deployment, or user-visible behavior.
- If the request is outside this project, reply exactly with: "${PROJECT_ONLY_REPLY}"
- Never invent project features that are not present in the provided context.
- Be concise, helpful, and practical.
- If the user asks about their subjects or progress, use the provided project context.

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
  if (!env.HUGGING_FACE_API_KEY || !env.HUGGING_FACE_MODEL) {
    throw new ChatConfigError(
      "Project assistant is not configured. Set HUGGING_FACE_API_KEY and HUGGING_FACE_MODEL in backend/.env."
    );
  }

  const conversation = messages
    .map((message) => ({
      role: message.role,
      content: message.content.trim()
    }))
    .filter((message) => message.content.length > 0)
    .slice(-10);

  if (!isProjectScopedConversation(conversation)) {
    return PROJECT_ONLY_REPLY;
  }

  const projectContext = await buildProjectContext(user);
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
    const errorMessage =
      (payload &&
        typeof payload.error === "object" &&
        payload.error &&
        "message" in payload.error &&
        typeof payload.error.message === "string" &&
        payload.error.message) ||
      (typeof payload?.error === "string" ? payload.error : null) ||
      "Unable to get a response from Hugging Face.";

    throw new ChatConfigError(errorMessage, response.status);
  }

  const payload = (await response.json()) as HuggingFaceChatResponse;
  const reply = extractAssistantReply(payload);

  return reply || "I can help with this project, but I could not generate a reply just now.";
};
