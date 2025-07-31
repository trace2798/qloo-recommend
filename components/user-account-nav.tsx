"use client";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Icons } from "./icons";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface UserAccountNavProps {
  email: string | undefined;
  name: string;
  imageUrl: string;
}

const UserAccountNav = ({ email, imageUrl, name }: UserAccountNavProps) => {
  const router = useRouter();
  const handleSignOut = async () => {
    const loadingToastId = toast.loading("Signing out...");
    await authClient.signOut({
      fetchOptions: {
        onRequest: () => {
          // toast.loading("Signing out...");
        },
        onSuccess: () => {
          toast.dismiss(loadingToastId);
          toast.success("Signed out successfully");
          router.push("/login"); // redirect to login page
        },
        onError: () => {
          toast.dismiss(loadingToastId);
          toast.error("Something went wrong. Try Again");
        },
      },
    });
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className="overflow-visible hover:cursor-pointer"
      >
        <Button className="rounded-full h-8 w-8">
          <Avatar className="relative size-8">
            {imageUrl ? (
              <div className="relative aspect-square h-full w-full">
                <img
                  //   fill
                  src={imageUrl}
                  alt="profile picture"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <AvatarFallback>
                <span className="sr-only">{name}</span>
                <Icons.user className="h-4 w-4 text-zinc-900 dark:text-neutral-200" />
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="" align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-0.5 leading-none">
            {name && (
              <div className="font-medium text-sm space-x-3 flex w-full justify-between">
                <span className="w-full truncate">{name}</span>
              </div>
            )}
            {email && <p className="w-[200px] truncate text-xs">{email}</p>}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer hover:text-primary/80"
          onClick={handleSignOut}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAccountNav;
