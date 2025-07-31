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
import { Separator } from "@/components/ui/separator";
import { authClient, signIn } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Github } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const FormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

export default function LoginForm() {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  //   const isLoading = form.formState.isSubmitting;
  const handleLogin = async (e: React.FormEvent) => {
    setSubmitting(true);
    e.preventDefault();
    const { data } = await signIn.email(
      {
        email: form.getValues("email"),
        password: form.getValues("password"),
        callbackURL: "/dashboard",
      },
      {
        onRequest: () => {
          //show loading
          toast.loading("Logging you in...");
        },
        onSuccess: (ctx) => {
          // // console.log("On Success", ctx);
          toast.success("Logged in successfully");
          setSubmitting(false);
          //redirect to the dashboard or sign in page
        },
        onError: (ctx) => {
          // display the error message
          toast.error(ctx.error.message);
          setSubmitting(false);
        },
      }
    );
    // // console.log("Data:", data);
  };
  const handleGithubSignIn = async (e: React.FormEvent) => {
    setSubmitting(true);
    e.preventDefault();

    const { data } = await authClient.signIn.social(
      {
        provider: "github",
        callbackURL: "/dashboard",
      },
      {
        onRequest: () => {
          //show loading
          toast.loading("Logging you in...");
        },
        onSuccess: (ctx) => {
          // // console.log("On Success", ctx);
          toast.success("Logged in successfully");
          setSubmitting(false);
          //redirect to the dashboard or sign in page
        },
        onError: (ctx) => {
          // display the error message
          toast.error(ctx.error.message);
          setSubmitting(false);
        },
      }
    );
  };
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your email and password to Login
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <FormField
                control={form.control}
                disabled={submitting}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Enter your email address.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                disabled={submitting}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormDescription>Enter your password.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                disabled={submitting}
                type="submit"
                className="w-full hover:cursor-pointer"
              >
                Login
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?&nbsp;
              <Link href="/sign-up" className="underline underline-offset-4">
                Sign Up
              </Link>
            </div>
          </form>
        </Form>
        <Separator className="my-5" />
        <Button onClick={handleGithubSignIn} size={"sm"} className="w-full" variant={"secondary"}>
          Login with Github <Github />
        </Button>
      </CardContent>
    </Card>
  );
}
