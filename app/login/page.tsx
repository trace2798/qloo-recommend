import { auth } from "@/lib/auth";
import LoginForm from "./_components/login-form";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Page = async ({}) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session) {
    redirect("/dashboard");
  }
  return (
    <>
      <div className="w-full flex h-screen justify-center items-center">
        <div className="absolute top-0 left-0 w-full h-full -z-10">
          <img src="/body.png" className="w-full h-full object-cover blur-md" />
        </div>
        <LoginForm />
      </div>
    </>
  );
};

export default Page;
