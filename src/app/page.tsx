import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const { data: sessionData } = await auth.getSession();
  if (sessionData?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Daily Outlet Account Management System
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Manage your daily outlet accounts with ease
        </p>
        <div className="space-x-4">
          <a
            href="/entry"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Entry
          </a>
          <a
            href="/reports"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Reports
          </a>
        </div>
        <p className="text-sm text-gray-500 mt-8">
          Authentication is fully configured with Neon Auth.
        </p>
      </div>
    </div>
  );
}
