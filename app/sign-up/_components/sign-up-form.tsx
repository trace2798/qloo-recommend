"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { redirect } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const FormSchema = z.object({
  name: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email(),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

export default function SignUpForm({
  signUpDisabled,
}: {
  signUpDisabled: boolean;
}) {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  const handleSignUp = async (e: React.FormEvent) => {
    setSubmitting(true);
    e.preventDefault();
    const loadingToastId = toast.loading("Signing up...");
    const { data, error } = await signUp.email(
      {
        email: form.getValues("email"),
        password: form.getValues("password"),
        name: form.getValues("name"),
        callbackURL: "/dashboard",
      },

      {
        onRequest: (ctx) => {
          //show loading
        },
        onSuccess: (ctx) => {
          // // console.log("On Success", ctx);
          toast.dismiss(loadingToastId);
          toast.success("Signed up successfully");
          setSubmitting(false);
          redirect("/dashboard");
          //redirect to the dashboard or sign in page
        },
        onError: (ctx) => {
          // display the error message
          toast.dismiss(loadingToastId);
          toast.error(ctx.error.message);
          setSubmitting(false);
        },
      }
    );
    // // console.log("Data:", data);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Signup</CardTitle>
        <CardDescription>
          Enter your email below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <FormField
                control={form.control}
                disabled={submitting || signUpDisabled}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="John doe" {...field} />
                    </FormControl>
                    <FormDescription>Enter your name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                disabled={submitting || signUpDisabled}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Enter your email address</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                disabled={submitting || signUpDisabled}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormDescription>Enter password</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {signUpDisabled ? (
                <>
                  <Label className="text-base text-center w-full text-blue-300">
                    Sign up is currently disabled. Contact Admin or try again
                    later
                  </Label>
                  {/* <Button
                    disabled={submitting || signUpDisabled}
                    type="submit"
                    className="w-full hover:cursor-not-allowed"
                  >
                    Sign up
                  </Button> */}
                </>
              ) : (
                <Button
                  disabled={submitting}
                  type="submit"
                  className="w-full hover:cursor-pointer"
                >
                  Sign Up
                </Button>
              )}
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?&nbsp;
              <Link href="/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
