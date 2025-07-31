"use client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ScrollArea } from "../ui/scroll-area";

const MobileNavigation = ({}) => {
  const [open, setOpen] = useState(false);
  const currentPath = usePathname();

  // Parent container variants for staggering
  const containerVariants = {
    visible: {
      transition: {
        staggerChildren: 0.3, // Delay between the appearance of each child
      },
    },
  };

  // const numberVariants = {
  //   hidden: { opacity: 0, y: 50 }, // Start off-screen to the right
  //   visible: (index: number) => ({
  //     opacity: 1,
  //     y: 0,
  //     transition: { delay: index * 0.2 }, // Delay for the number based on index
  //   }),
  // };

  const wordVariants = {
    hidden: { opacity: 0, x: 50 }, // Start off-screen to the right
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: index * 0.2 + 0.2, duration: 0.5 }, // Delay for the words based on index
    }),
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Menu Open Button"
          className="flex min-[1190px]:hidden"
        >
          <Menu />
        </SheetTrigger>
        <ScrollArea>
          <SheetContent
            title="Menu"
            side="right"
            className="w-[90vw] max-w-md p-0 pb-4 h-screen flex flex-col sm:justify-between backdrop-blur-lg bg-white/10"
          >
            <div className="flex items-center mt-6 p-5">
              <Link
                title="link to home page"
                aria-label="link to home page"
                href={"/"}
                className="text-primary hover:text-indigo-400"
              >
                <div className="flex items-left justify-center flex-col space-y-2">
                  <h1 className="text-4xl font-semibold uppercase">
                    Rec&Sight
                  </h1>
                </div>
              </Link>
            </div>
            <div className="pb-10 flex flex-col mt-3 sm:mt-0">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="flex flex-col"
              >
                {menuOptions.map((item, index) => {
                  return (
                    <div
                      key={`menuitem-${index}`}
                      title={`menu item to go back to ${item.title} page`}
                      className="flex items-center border-b-[0.5px] border-primary/40 dark:border-primary/40"
                    >
                      <Link
                        prefetch={true}
                        href={item.href}
                        className={cn(
                          "py-3 px-4 hover:text-indigo-400 transition-colors flex space-x-3 w-full text-primary/30 tracking-wide",
                          item.href === "/"
                            ? currentPath === "/" &&
                                // "text-[#0070f3] bg-accent font-bold"
                                " text-primary font-semibold uppercase"
                            : currentPath.startsWith(item.href) &&
                                "text-primary font-semibold uppercase"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        <motion.div
                          className="text-3xl sm:text-4xl font-switzerVariable font-semibold w-full"
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={wordVariants}
                        >
                          {item.title}
                        </motion.div>
                      </Link>
                    </div>
                  );
                })}
              </motion.div>
            </div>
          </SheetContent>
        </ScrollArea>
      </Sheet>
    </>
  );
};

export default MobileNavigation;

const menuOptions = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "About",
    href: "/about",
  },
];
