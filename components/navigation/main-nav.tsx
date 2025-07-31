"use client";
import { useState, useEffect } from "react";
import { MotionConfig, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

const TABS = [
  "Home",
  "About",
];

export default function MainNav() {
  const currentRoute = usePathname();
  const [activeTab, setActiveTab] = useState(TABS[0]);

  useEffect(() => {
    const matchingTab =
      TABS.find((tab) =>
        currentRoute === "/"
          ? tab === "Home"
          : `/${tab.toLowerCase()}` === currentRoute
      ) || TABS[0]; // Default to Home if no match
    setActiveTab(matchingTab);
  }, [currentRoute]);

  return (
    <div className="items-center relative hidden min-[943px]:flex mx-auto ">
      <MotionConfig transition={{ type: "spring", bounce: 0, duration: 0.4 }}>
        <motion.ul
          layout
          className={cn("mx-auto flex w-fit gap-2 flex-row justify-center")}
        >
          {TABS.map((tab) => (
            <motion.li
              layout
              key={tab}
              className={cn(
                "relative cursor-pointer px-2 py-1 text-sm outline-none transition-colors ",
                activeTab === tab
                  ? "text-primary font-medium"
                  : "text-primary/70 font-[420]"
              )}
              tabIndex={0}
            >
              <Link
                prefetch={true}
                href={tab === "Home" ? "/" : `/${tab.toLowerCase()}`}
                onFocus={() => setActiveTab(tab)}
                onMouseOver={() => setActiveTab(tab)}
                onMouseLeave={() =>
                  setActiveTab(
                    TABS.find((t) =>
                      currentRoute === "/"
                        ? t === "Home"
                        : `/${t.toLowerCase()}` === currentRoute
                    ) || TABS[0]
                  )
                }
                className="relative block text-inherit text-base px-2 py-1"
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-lg bg-neutral-100/20"
                  />
                )}
                <span className="relative">{tab}</span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </MotionConfig>
    </div>
  );
}
