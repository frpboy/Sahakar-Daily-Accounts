"use client";

import { useState, useEffect, Suspense } from "react";
import { Container } from "@/components/ui/container";
import { User, Lock, Bell, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PersonalProfile, SecuritySettings } from "@/components/settings/SettingsPages";
import { NotificationSettings } from "@/components/settings/NotificationSettings";

type Role = "admin" | "ho_accountant" | "outlet_manager" | "outlet_accountant";

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "profile";

  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userOutlet, setUserOutlet] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const { data: userData } = await supabase
          .from("users")
          .select("*, outlets(*)")
          .eq("id", user.id)
          .single();

        if (userData) {
          setUserName(userData.name);
          setUserEmail(userData.email);
          setUserPhone(userData.phone || "");
          setUserRole(userData.role as Role);
          setUserOutlet(userData.outlets);
        }
      }
      setIsLoading(false);
    }
    fetchData();
  }, [supabase]);

  const handleUpdateProfile = async (data: { name: string; phone: string }) => {
    await supabase.from("users").update({ name: data.name, phone: data.phone }).eq("id", userId);
    setUserName(data.name);
    setUserPhone(data.phone);
  };

  const handleUpdatePassword = async (password: string) => {
    await supabase.auth.updateUser({ password });
  };

  const sidebarItems = [
    { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
    { id: "password", label: "Change Password", icon: <Lock className="h-4 w-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  ];

  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="h-8 w-8 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );

    switch (activeTab) {
      case "profile":
        return (
          <PersonalProfile
            userName={userName}
            email={userEmail}
            phone={userPhone}
            role={userRole}
            outlet={userOutlet}
            onSave={handleUpdateProfile}
          />
        );
      case "password":
        return <SecuritySettings onUpdatePassword={handleUpdatePassword} />;
      case "notifications":
        return <NotificationSettings />;
      default:
        return null;
    }
  };

  return (
    <Container className="py-10 max-w-5xl">
      <div className="mb-8 border-b border-gray-200 pb-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">{userRole?.replace("_", " ") ?? ""}</p>
      </div>

      <div className="grid md:grid-cols-[200px,1fr] gap-8 items-start">
        <aside className="space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                activeTab === item.id
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </aside>

        <main className="bg-white border border-gray-100 rounded-lg p-8 min-h-[400px]">
          {renderContent()}
        </main>
      </div>
    </Container>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <Container className="py-10 max-w-5xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-8 w-8 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </Container>
    }>
      <SettingsContent />
    </Suspense>
  );
}
