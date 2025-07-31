import { Analysis } from "@/components/analysis";
import { FC } from "react";

interface PageProps {}

const Page: FC<PageProps> = ({}) => {
  return (
    <>
      <div className="w-full px-[5vw] py-12 flex flex-col space-y-10 min-h-screen">
        <Analysis />
      </div>
    </>
  );
};

export default Page;
