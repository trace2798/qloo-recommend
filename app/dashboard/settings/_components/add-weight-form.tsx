"use client";

import { addNewWeight, generateWeight } from "@/app/actions"; // this file must have “use server” at top
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

const AddWeightForm = ({ userId, dob }: { userId: string; dob: string }) => {
  const [userInput, setUserInput] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useTransitionRouter();
  const handleSubmit = async () => {
    setLoading(true);
    // this will now run when you click “Submit”
    const { weight } = await generateWeight(userInput);
    // console.log("AI Response in lbs:", weight.weight);
    const res = await addNewWeight(userId, weight.weight, dob);
    if (res.status === 200) {
      toast.success("Weight saved!");
      setLoading(false);
      setOpen(false);
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Add New Weight</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Weight</DialogTitle>
          <DialogDescription>Update your weight in kg or lbs</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {loading ? (
            <Skeleton className="w-full h-10 animate-pulse" />
          ) : (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user-input" className="text-right">
                Weight
              </Label>
              <Input
                id="user-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g. 70kg or 154 lbs"
                className="col-span-3"
                disabled={loading}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddWeightForm;
