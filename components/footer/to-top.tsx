"use client";
import { ChevronUpCircle } from "lucide-react";
import { Button } from "../ui/button";



const ToTop = ({}) => {

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <>
      <div className="flex w-full">
        <Button
          variant="ghost"
          size={"icon"}
          title="Back to top"
          aria-label="Back to top"
          onClick={scrollToTop}
          className="text-primary underline hover:no-underline hover:text-indigo-400 hover:cursor-pointer"
        >
          <ChevronUpCircle />
        </Button>
      </div>
    </>
  );
};

export default ToTop;
