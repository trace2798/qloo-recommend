"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { Greeting } from "./greetings";

export function Chat({ userId }: { userId: string }) {
  const { mutate } = useSWRConfig();

  const [input, setInput] = useState<string>("");

  const { messages, setMessages, sendMessage, status, stop, regenerate } =
    useChat({
      transport: new DefaultChatTransport({
        api: "/api/rec",
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
            chatId={""}
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
