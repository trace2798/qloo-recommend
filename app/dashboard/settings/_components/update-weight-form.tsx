// "use client";

// import {
//   addNewWeight,
//   generateProfileInfo,
//   generateWeight,
//   updateUserProfile,
//   UserInfoUpdate,
// } from "@/app/actions"; // this file must have “use server” at top
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useTransitionRouter } from "next-view-transitions";
// import { useState } from "react";
// import { toast } from "sonner";

// interface ProfileFields {
//   height: number;
//   sex: "male" | "female";
//   dob: string;
//   goalWeight: number;
// }

// export const UpdateProfileInfoForm = ({
//   userId,
//   profileId,
//   initialProfile,
// }: {
//   userId: string;
//   profileId: string;
//   initialProfile: ProfileFields;
// }) => {
//   const [userInput, setUserInput] = useState("");
//   const [open, setOpen] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const router = useTransitionRouter();
//   const handleSubmit = async () => {
//     setLoading(true);

//     const { profile } = await generateProfileInfo(userInput, initialProfile);
//     // console.log("AI Response:", profile);

//     const updatePayload: UserInfoUpdate = {
//       height: profile.height,
//       sex: profile.sex,
//       dob: profile.dob as string,
//       goalWeight: profile.goalWeight,
//     };

//     const res = await updateUserProfile(profileId, updatePayload);

//     if (res.status === 200) {
//       toast.success("Profile Updated!");
//       setLoading(false);
//       setOpen(false);
//       router.refresh();
//     } else {
//       toast.error("Oops!! Something went wrong try again");
//       setLoading(false);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <Button variant="secondary">Update Info</Button>
//       </DialogTrigger>
//       <DialogContent className="sm:max-w-[425px]">
//         <DialogHeader>
//           <DialogTitle>Update Info</DialogTitle>
//           <DialogDescription>Update your weight in kg or lbs</DialogDescription>
//         </DialogHeader>
//         <div className="grid gap-4 py-4">
//           {loading ? (
//             <Skeleton className="w-full h-10 animate-pulse" />
//           ) : (
//             <div className="flex flex-col items-start gap-4">
//               <Label htmlFor="user-input" className="text-right">
//                 What's new?
//               </Label>
//               <Input
//                 id="user-input"
//                 value={userInput}
//                 onChange={(e) => setUserInput(e.target.value)}
//                 placeholder="Tell me what's new. I will update your profile"
//                 className="col-span-3"
//                 disabled={loading}
//               />
//             </div>
//           )}
//         </div>
//         <DialogFooter>
//           <Button onClick={handleSubmit} disabled={loading}>
//             Submit
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default UpdateProfileInfoForm;
"use client";

import type { ProfileFields, UserInfoUpdate } from "@/app/actions";
import { generateProfileInfo, updateUserProfile } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransitionRouter } from "next-view-transitions";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  userId: string;
  profileId: string;
  initialProfile: ProfileFields;
}

export default function UpdateProfileInfoForm({
  userId,
  profileId,
  initialProfile,
}: Props) {
  const [userInput, setUserInput] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useTransitionRouter();

  const handleSubmit = async () => {
    if (!userInput.trim()) {
      toast.error("Please tell me what to update.");
      return;
    }

    setLoading(true);
    try {
      const { profile } = await generateProfileInfo(userInput, initialProfile);

      const updatePayload: UserInfoUpdate = {
        height: profile.height,
        sex: profile.sex,
        dob: profile.dob,
        goalWeight: profile.goalWeight,
        updatedAt: new Date(),
      };

      const res = await updateUserProfile(profileId, updatePayload);
      if (res.status !== 200) {
        throw new Error("Update failed");
      }

      toast.success("Profile Updated!");
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile. Try again?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Update Info</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Profile</DialogTitle>
          <DialogDescription>
            Describe any changes and I’ll update your height, sex, dob or goal
            weight.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {loading ? (
            <Skeleton className="w-full h-10 animate-pulse" />
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="update-input" className="text-sm font-medium">
                What’s new?
              </Label>
              <Input
                id="update-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g. “I’m now 1.8m tall, born 1988-06-15, goal 150lbs”"
                disabled={loading}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating…" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
