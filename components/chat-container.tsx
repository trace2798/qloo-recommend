"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
// import { ChatHeader } from "@/components/chat-header";

import { unstable_serialize } from "swr/infinite";

import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";

export function Chat({}: {}) {
  const { mutate } = useSWRConfig();

  const [input, setInput] = useState<string>("");

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            messages,
            ...body,
          },
        };
      },
    }),
    onData: (dataPart) => {},
    onFinish: () => {},
    onError: (error) => {
      if (error) {
        console.log("ERROR", error);
        toast.error("ERROR");
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

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
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        {/* <ChatHeader
          chatId={id}
          selectedModelId={initialChatModel}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={false}
          session={session}
        /> */}
        <h1>HEADER CHAT</h1>

        <Messages
          chatId={"awerxtcryvghbj267672"}
          status={status}
          messages={messages}
          setMessages={setMessages}
          regenerate={regenerate}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          <MultimodalInput
            chatId={"awerxtcryvghbj267672"}
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
