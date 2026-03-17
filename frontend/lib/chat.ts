import { apiFetch, buildAuthHeaders } from "./api";

export type ProjectChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export const askProjectAssistant = (
  messages: ProjectChatMessage[],
  accessToken?: string | null
) =>
  apiFetch<{ reply: string }>("/api/chat", {
    method: "POST",
    headers: buildAuthHeaders(accessToken),
    body: JSON.stringify({ messages })
  });
