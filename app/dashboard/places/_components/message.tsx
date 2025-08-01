"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { cn, sanitizeText } from "@/lib/utils";

import { MessageReasoning } from "@/components/message-reasoning";
import type { UIMessage, UseChatHelpers } from "@ai-sdk/react";
import { SparklesIcon } from "lucide-react";
import { Markdown } from "../../_components/markdown";

const PurePreviewMessage = ({
  message,
  isLoading,
  setMessages,
  requiresScrollPadding,
}: {
  message: UIMessage;
  isLoading: boolean;
  setMessages: UseChatHelpers<UIMessage>["setMessages"];
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");

  type ReasoningPart = Extract<
    (typeof message.parts)[number],
    { type: "reasoning" }
  >;
  type TextPart = Extract<(typeof message.parts)[number], { type: "text" }>;

  const reasoningText = (message.parts as ReasoningPart[])
    .filter((p) => p.type === "reasoning" && p.text.trim().length > 0)
    .map((p) => p.text)
    .join("\n");

  const textParts = (message.parts as TextPart[]).filter(
    (p) => p.type === "text" && typeof p.text === "string"
  );

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            "flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
            {
              "w-full": mode === "edit",
              "group-data-[role=user]/message:w-fit": mode !== "edit",
            }
          )}
        >
          {message.role === "assistant" && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <SparklesIcon size={14} className="translate-y-px" />
            </div>
          )}

          <div
            className={cn("flex flex-col gap-4 w-full", {
              "min-h-96": message.role === "assistant" && requiresScrollPadding,
            })}
          >
            {message.role === "assistant" && reasoningText && (
              <MessageReasoning
                isLoading={isLoading}
                reasoning={reasoningText}
              />
            )}

            {textParts.map((part, i) => {
              const key = `message-${message.id}-text-${i}`;
              return (
                <div key={key} className="flex flex-row gap-2 items-start">
                  <div
                    data-testid="message-content"
                    className={cn("flex flex-col gap-4", {
                      "bg-primary text-primary-foreground px-3 py-2 rounded-xl":
                        message.role === "user",
                    })}
                  >
                    <Markdown>{sanitizeText(part.text ?? "")}</Markdown>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = PurePreviewMessage;


export const ThinkingMessage = () => {
  const role = "assistant";

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cn(
          "flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl",
          {
            "group-data-[role=user]/message:bg-muted": true,
          }
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground animate-pulse">
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
