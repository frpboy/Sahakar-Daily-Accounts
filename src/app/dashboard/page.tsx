import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { data: sessionData } = await auth.getSession();
  const user = sessionData?.user;

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Get user role from our DB
  const userProfile = await db.query.users.findFirst({
    where: eq(users.id, user.id)
  });

  if (!userProfile) {
    // No matching profile in our local DB yet. 
    // Redirecting to account page where we could trigger profile creation or just show stats.
    redirect("/auth/account");
  }

  if (userProfile.role === "admin") {
    redirect("/admin/overview");
  } else {
    // If manager, redirect to their outlet entry page
    if (userProfile.outletId) {
      redirect(`/outlet/${userProfile.outletId}/entry`);
    } else {
      // No outlet assigned yet
      redirect("/auth/account");
    }
  }
}
