import { auth } from "@/lib/auth";
import SignUpForm from "./_components/sign-up-form";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Page = async ({}) => {
  const disableSignUp = auth.options.emailAndPassword.disableSignUp;
  // // console.log("Validation", disableSignUp);
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session) {
    redirect("/dashboard");
  }
  return (
    <>
      <div className="w-full  h-screen flex justify-center items-center">
        <SignUpForm signUpDisabled={disableSignUp} />
      </div>
    </>
  );
};

export default Page;
