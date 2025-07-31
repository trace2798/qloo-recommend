import { Chat } from "@/components/chat-container";
import { db } from "@/db";
import { message } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Page = async ({}) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/login");
  }
  const rawMessages = await db.query.message.findMany({
    where: eq(message.userId, session.user.id),
  });

  const messagesFromDb = rawMessages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    parts: msg.parts.map((p: any) => ({
      type: "text",
      text: p.content,
    })),
  }));
  console.log("MESSAGE FROM DB", messagesFromDb);
  return (
    <>
      <div className="w-full px-[5vw] py-12 flex flex-col space-y-10">
        <Chat userId={session.user.id} messagesFromDb={messagesFromDb} />
      </div>
    </>
  );
};

export default Page;
