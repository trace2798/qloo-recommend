import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "./_components/main-nav";
import Footer from "@/components/footer/footer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/login");
  }
  return (
    <div>
      <Navbar
        email={session.user.email}
        name={session.user.name}
        image={session.user.image || ""}
      />
      <section>{children}</section>
      <Footer />
    </div>
  );
}
