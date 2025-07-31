import { Separator } from "@/components/ui/separator";

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
      <div className="w-full px-[5vw] py-12 flex flex-col space-y-10 min-h-screen">
        {/* <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 w-full gap-10">
          <Card className="flex items-center justify-center p-0">
            <CardHeader className="flex flex-row items-center justify-center gap-5 p-3">
              <div>
                <RulerDimensionLine
                  className="rotate-90 size-14"
                  strokeWidth={1}
                />
              </div>
              <div className="flex flex-col justify-center items-center">
                <CardTitle className="text-lg">
                  {currentUserInfo.height} m
                </CardTitle>
                <CardDescription>Height</CardDescription>
              </div>
            </CardHeader>
          </Card>
          <Card className="flex items-center justify-center">
            <CardHeader className="flex flex-row items-center justify-center gap-5 p-3">
              <div>
                <PersonStanding className=" size-14" strokeWidth={1} />
              </div>
              <div className="flex flex-col justify-center items-center p-0 mt-0">
                <CardTitle className="text-lg">
                  {latestWeight?.ageAtEntry} years
                </CardTitle>
                <CardDescription>Age</CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="flex items-center justify-center">
            <CardHeader className="flex flex-row items-center justify-center gap-5 p-3">
              <div>
                {currentUserInfo.sex === "male" ? (
                  <Mars className="size-12" strokeWidth={1} />
                ) : (
                  <Venus className="size-12" strokeWidth={1} />
                )}
              </div>
              <div className="flex flex-col justify-center items-center space-y-2">
                <CardTitle className="text-lg first-letter:capitalize">
                  {currentUserInfo.sex}
                </CardTitle>
                <CardDescription>Sex</CardDescription>
              </div>
            </CardHeader>
          </Card>
          <Card className="flex items-center justify-center">
            <CardHeader className="flex flex-row items-center justify-center gap-5 p-3">
              <div>
                <Goal className="size-14" strokeWidth={1} />
              </div>
              <div className="flex flex-col justify-center items-center p-0 mt-0">
                <CardTitle className="text-lg">
                  {currentUserInfo.goalWeight} lbs
                </CardTitle>
                <CardDescription>Goal Weight</CardDescription>
              </div>
            </CardHeader>
          </Card>
          <Card className="flex items-center justify-center p-0">
            <CardHeader className="flex flex-row items-center justify-center gap-5 p-3">
              <div>
                <Weight className="size-14" strokeWidth={1} />
              </div>
              <div className="flex flex-col justify-center items-center p-0 mt-0">
                <CardTitle className="text-lg">
                  {latestWeight?.weight} lbs
                </CardTitle>
                <CardDescription>Current Weight</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div> */}
        <Separator />
      
      </div>
    </>
  );
};

export default Page;
