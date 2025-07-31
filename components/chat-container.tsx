"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  UIDataTypes,
  UIMessage,
  UIMessagePart,
  UITools,
} from "ai";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { Greeting } from "./greetings";
import { saveMessage } from "@/app/actions";

interface TextPart {
  type: "text";
  text: string;
}

function isTextPart(p: UIMessagePart<UIDataTypes, UITools>): p is TextPart {
  return p.type === "text";
}

export function Chat({
  userId,
  messagesFromDb,
}: {
  userId: string;
  messagesFromDb: any[];
}) {
  const { mutate } = useSWRConfig();

  const [input, setInput] = useState<string>("");

  const { messages, setMessages, sendMessage, status, stop, regenerate } =
    useChat({
      messages: messagesFromDb,
      transport: new DefaultChatTransport({
        api: "/api/rec",
        prepareSendMessagesRequest({ messages, id, body }) {
          return {
            body: {
              id,
              messages,
              userId: userId,
              ...body,
            },
          };
        },
      }),
      onData: (dataPart) => {},
      onFinish: async ({ message }) => {
        console.log("Final message received!");
        console.log("Final message:", message);
        console.log("Final message parts:", message.parts);
        const dbParts = message.parts
          .filter(isTextPart)
          .map((p) => ({ content: p.text }));
        await saveMessage(dbParts, message.role, userId);
      },
      onError: (error) => {
        if (error) {
          console.log("ERROR", error);
          toast.error("ERROR");
        }
      },
    });

  //   useEffect(() => {
  //     if (query && !hasAppendedQuery) {
  //       sendMessage({
  //         role: "user" as const,
  //         parts: [{ type: "text", text: query }],
  //       });

  //       setHasAppendedQuery(true);
  //       window.history.replaceState({}, "", `/chat/${id}`);
  //     }
  //   }, [query, sendMessage, hasAppendedQuery, id]);

  return (
    <>
      <div className="flex flex-col min-w-0 h-[80dvh] bg-background">
        <Messages
          status={status}
          messages={messages}
          setMessages={setMessages}
          regenerate={regenerate}
        />
        {messages.length === 0 && (
          <Greeting sendMessage={sendMessage} setMessages={setMessages} />
        )}
        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          <MultimodalInput
            input={input}
            setInput={setInput}
            status={status}
            stop={stop}
            messages={messages}
            setMessages={setMessages}
            sendMessage={sendMessage}
          />
        </form>
      </div>
    </>
  );
}
