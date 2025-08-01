import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
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
        <div className="grid grid-cols-2 md:grid-cols-2 w-full gap-10">
          <Card className="flex items-center text-center justify-center ">
            <CardHeader className="w-full">
              <CardTitle className="text-lg">Recommendation</CardTitle>
              <CardDescription className="text-lg">
                get Recommendation of different topics and queries.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href={"/dashboard/rec"}>
                <Button>Try It</Button>
              </Link>
            </CardFooter>
          </Card>
          <Card className="flex items-center text-center justify-center ">
            <CardHeader className="w-full">
              <CardTitle className="text-lg">Insight</CardTitle>
              <CardDescription className="text-lg">
                Get in depth insight of an entity
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href={"/dashboard/insight"}>
                <Button>Try Insight</Button>
              </Link>
            </CardFooter>
          </Card>
          <Card className="flex items-center text-center justify-center ">
            <CardHeader className="w-full">
              <CardTitle className="text-lg">Hidden gems</CardTitle>
              <CardDescription className="text-lg">
                Search for places to visit which locals love.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href={"/dashboard/places"}>
                <Button>Try It</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
        <Separator />
      </div>
    </>
  );
};

export default Page;
