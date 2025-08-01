import { FC } from "react";
import { Chat } from "./_components/chat-container";

interface PageProps {}

const Page: FC<PageProps> = ({}) => {
  return (
    <>
      <div><Chat/></div>
    </>
  );
};

export default Page;
