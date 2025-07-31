import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db";
import { userInfo, userWeightHistory } from "@/db/schema";
import { auth } from "@/lib/auth";
import { format, parseISO } from "date-fns";
import { desc, eq } from "drizzle-orm";
import {
  Goal,
  Mars,
  PersonStanding,
  RulerDimensionLine,
  Venus,
  Weight,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AddWeightForm from "./_components/add-weight-form";
import UpdateProfileInfoForm from "./_components/update-weight-form";

const Page = async ({}) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/login");
  }

  const currentUserInfo = await db.query.userInfo.findFirst({
    where: eq(userInfo.userId, session.user.id),
  });
  // console.log("currentUserInfo", currentUserInfo);
  const latestWeight = await db.query.userWeightHistory.findMany({
    where: eq(userWeightHistory.userId, session.user.id),
    orderBy: desc(userWeightHistory.updatedAt),
  });

  return (
    <>
      <div className="flex flex-col w-full px-[5vw] space-y-3 min-h-screen">
        <div className="flex flex-col mt-12">
          <h1 className="text-5xl font-bold uppercase">Settings</h1>
          <h2 className="text-lg text-primary/80">
            Your current profile data and weight history
          </h2>
        </div>

        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-6xl mx-auto">
          <div className="flex flex-col space-y-3">
            <div className="flex justify-between">
              <h2 className="text-3xl font-medium uppercase">Profile info</h2>
              <div>
                <UpdateProfileInfoForm
                  userId={session.user.id}
                  profileId={currentUserInfo?.id as string}
                  initialProfile={{
                    height: currentUserInfo?.height as number,
                    sex: currentUserInfo?.sex as "male" | "female",
                    dob: currentUserInfo?.dob as string,
                    goalWeight: currentUserInfo?.goalWeight as number,
                  }}
                />
              </div>
            </div>

            <Separator />
            <div className="flex flex-col space-y-3">
              <Card className="flex items-center justify-center">
                <CardHeader className="flex flex-row items-center justify-center gap-5 p-3">
                  <div>
                    <Goal className="size-14" strokeWidth={1} />
                  </div>
                  <div className="flex flex-col justify-center items-center p-0 mt-0">
                    <CardTitle className="text-lg">
                      {currentUserInfo?.goalWeight} lbs
                    </CardTitle>
                    <CardDescription>Goal Weight</CardDescription>
                  </div>
                </CardHeader>
              </Card>
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
                      {currentUserInfo?.height} m
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
                      {/* {currentUserInfo?.dob != null
                        ? format(new Date(currentUserInfo.dob), "dd MMMM, yyyy")
                        : "—"} */}
                      {/* {currentUserInfo?.dob} */}
                      {currentUserInfo?.dob
                        ? format(parseISO(currentUserInfo.dob), "dd MMMM, yyyy")
                        : "—"}
                    </CardTitle>
                    <CardDescription>Date of Birth</CardDescription>
                  </div>
                </CardHeader>
              </Card>

              <Card className="flex items-center justify-center">
                <CardHeader className="flex flex-row items-center justify-center gap-5 p-3">
                  <div>
                    {currentUserInfo?.sex === "male" ? (
                      <Mars className="size-12" strokeWidth={1} />
                    ) : (
                      <Venus className="size-12" strokeWidth={1} />
                    )}
                  </div>
                  <div className="flex flex-col justify-center items-center space-y-2">
                    <CardTitle className="text-lg first-letter:capitalize">
                      {currentUserInfo?.sex}
                    </CardTitle>
                    <CardDescription>Sex</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            <div className="flex justify-between">
              <h2 className="text-3xl font-medium uppercase">Weight History</h2>
              <div>
                <AddWeightForm
                  userId={session.user.id}
                  dob={currentUserInfo?.dob as string}
                />
              </div>
            </div>

            <Separator />
            <div className="flex flex-col space-y-3">
              {latestWeight.map((weight) => (
                <Card
                  key={weight.id}
                  className="flex items-center justify-center"
                >
                  <CardHeader className="flex flex-row items-center justify-center gap-5 p-3">
                    <div>
                      <Weight className="size-12" strokeWidth={1} />
                    </div>
                    <div className="flex flex-col justify-center items-center space-y-1">
                      <CardTitle className="text-lg first-letter:capitalize">
                        {weight.weight} lbs
                      </CardTitle>
                      <CardDescription>
                        Age: {weight.ageAtEntry}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
