import { Chat } from "@/components/chat-container";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Page = async ({}) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/login");
  }
  return (
    <>
      <div className="w-full px-[5vw] py-12 flex flex-col space-y-10">
        <Chat userId={session.user.id} />
      </div>
    </>
  );
};

export default Page;
