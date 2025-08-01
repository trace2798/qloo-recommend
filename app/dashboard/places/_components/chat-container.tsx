"use client";

import { saveMessage } from "@/app/actions";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIDataTypes, UIMessagePart, UITools } from "ai";
import { useState } from "react";
import { toast } from "sonner";
import { Greeting } from "./greetings";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";

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

  const [input, setInput] = useState<string>("");

  const { messages, setMessages, sendMessage, status, stop, regenerate } =
    useChat({
      messages: messagesFromDb,
      transport: new DefaultChatTransport({
        api: "/api/places",
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
        // console.log("Final message received!");
        // console.log("Final message:", message);
        // console.log("Final message parts:", message.parts);
        const dbParts = message.parts
          .filter(isTextPart)
          .map((p) => ({ content: p.text }));
        // await saveMessage(dbParts, message.role, userId);
      },
      onError: (error) => {
        if (error) {
          // console.log("ERROR", error);
          toast.error("ERROR");
        }
      },
    });

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
