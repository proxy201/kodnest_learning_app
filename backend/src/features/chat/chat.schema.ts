import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(1500)
});

export const chatRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(1500).optional(),
    messages: z.array(chatMessageSchema).min(1).max(12).optional()
  })
  .superRefine((value, context) => {
    if (!value.message && !value.messages?.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either a message or a messages array.",
        path: ["message"]
      });
    }
  });

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

export const normalizeChatMessages = (input: ChatRequestInput): ChatMessageInput[] => {
  if (input.messages?.length) {
    return input.messages;
  }

  return [
    {
      role: "user",
      content: input.message!.trim()
    }
  ];
};
