import { FC } from "react";
import { Chat } from "./_components/chat-container";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface PageProps {}

const Page: FC<PageProps> = async ({}) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/login");
  }
  return (
    <>
      <div>
        <Chat userId={session.user.id} messagesFromDb={[]} />
      </div>
    </>
  );
};

export default Page;
