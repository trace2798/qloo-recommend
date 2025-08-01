"use client";

import UserAccountNav from "@/components/user-account-nav";
import { cn } from "@/lib/utils";
import { MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = ["Dashboard", "Rec", "Insight", "Places"];

function slugify(tab: string) {
  return tab.toLowerCase().replace(/\s+/g, "-");
}

export default function TestNav({ email, imageUrl, name }: any) {
  const pathname = usePathname() || "";

  const segments = pathname.split("/").filter(Boolean);
  const subroute = segments[1] ?? "";

  const activeTab =
    TABS.find((tab) => {
      if (tab === "Dashboard") {
        return !subroute;
      }
      return slugify(tab) === subroute;
    }) || "Dashboard";

  return (
    <div className="items-center relative hidden min-[943px]:flex mx-auto">
      <MotionConfig transition={{ type: "spring", bounce: 0, duration: 0.4 }}>
        <motion.ul
          layout
          className={cn("mx-auto flex w-fit gap-2 flex-row justify-center")}
        >
          {TABS.map((tab) => {
            const slug = slugify(tab);
            const href =
              tab === "Dashboard" ? "/dashboard" : `/dashboard/${slug}`;
            const isActive = activeTab === tab;
            return (
              <motion.li
                layout
                key={tab}
                className={cn(
                  "relative cursor-pointer px-2 py-1 text-sm transition-colors",
                  isActive
                    ? "text-primary font-medium"
                    : "text-primary/70 font-[420]"
                )}
              >
                <Link href={href} className="relative block px-2 py-1">
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 rounded-lg bg-neutral-100/20"
                    />
                  )}
                  <span className="relative">{tab}</span>
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>
        <UserAccountNav email={email} name={name} imageUrl={imageUrl} />
      </MotionConfig>
    </div>
  );
}
