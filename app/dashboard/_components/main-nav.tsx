"use client";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import MobileNavigation from "./mobile-navigation";
import TestNav from "./test-nav";

const Navbar = ({
  email,
  name,
  image,
}: {
  email: string;
  name: string;
  image: string;
}) => {
  const { scrollY } = useScroll();

  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (previous && latest > previous && latest > 0) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });
  return (
    <>
      <motion.nav
        variants={{
          visible: { y: 0 },
          hidden: { y: "-100%" },
        }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="sticky top-0 z-50 px-[5vw] py-3 flex items-center justify-between backdrop-blur-md border-b"
      >
        <div className="flex items-center">
          <a
            href={"/"}
            className="text-primary hover:text-primary/80 hover:cursor-pointer"
          >
            <div className=" ml-3 flex flex-col">
              <p className="text-2xl md:text-4xl font-generalSans font-semibold">
                Rec&Sight
              </p>
            </div>
          </a>
        </div>
        <div className="flex">
          <TestNav email={email} name={name} imageUrl={image} />
        </div>

        {/* <SocialDialog /> */}
        <div className="flex min-[943px]:hidden flex-row items-center space-x-4">
          <MobileNavigation />
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
