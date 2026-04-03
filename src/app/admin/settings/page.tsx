"use client";

import { useState, useEffect, Suspense } from "react";
import { Container } from "@/components/ui/container";
import { 
  Users, Building2, Bell, Shield, 
  User, Lock, Laptop, Palette, Globe, 
  FileText, IndianRupee, Clock, 
  History, LogOut,
  ArrowLeft
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  PersonalProfile, 
  SecuritySettings, 
  SessionsScreen,
  VisualPreferences,
  UserManagementScreen,
  OutletsScreen,
  FinancialYearScreen,
  ReportingRulesScreen,
  AuditTrailScreen,
  RemindersScreen,
  PreferenceToggleList,
  PlaceholderScreen
} from "@/components/settings/SettingsPages";

type Role = "super_admin" | "admin" | "ho_accountant" | "outlet_manager" | "outlet_accountant";

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
  
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allOutlets, setAllOutlets] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [financialYears, setFinancialYears] = useState<any[]>([]);
  const [systemPrefs, setSystemPrefs] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        const { data: userData } = await supabase.from("users").select("*, outlets(*)").eq("id", user.id).single();

        if (userData) {
          setUserName(userData.name);
          setUserEmail(userData.email);
          setUserPhone(userData.phone || "");
          setUserRole(userData.role as Role);
          setUserOutlet(userData.outlets);
        }

        // Global Data for Admin/HO
        const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin' || userData?.role === 'ho_accountant';
        
        const queries = [
          supabase.from("system_preferences").select("*"),
          supabase.from("submission_reminders").select("*"),
        ];

        if (isAdmin) {
          queries.push(supabase.from("users").select("*, outlets(*)").order('name'));
          queries.push(supabase.from("outlets").select("*").order('name'));
          queries.push(supabase.from("audit_logs").select("*").order('created_at', { ascending: false }).limit(50));
          queries.push(supabase.from("financial_years").select("*").order('startDate', { ascending: false }));
        }

        const results = await Promise.all(queries);
        
        setSystemPrefs(results[0].data || []);
        setReminders(results[1].data || []);
        if (isAdmin) {
          setAllUsers(results[2].data || []);
          setAllOutlets(results[3].data || []);
          setAuditLogs(results[4].data || []);
          setFinancialYears(results[5].data || []);
        }
      }
      setIsLoading(false);
    }
    fetchData();
  }, [supabase]);

  // Handlers
  const handleUpdateProfile = async (data: { name: string, phone: string }) => {
    const { error } = await supabase.from("users").update({ name: data.name, phone: data.phone }).eq("id", userId);
    if (!error) {
      setUserName(data.name);
      setUserPhone(data.phone);
      await supabase.from("audit_logs").insert({ userId, userName: data.name, action: "IDENTITY_UPDATE", entityType: "USER_PROFILE", entityId: userId, newData: data });
    }
  };

  const handleUpdatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) await supabase.from("audit_logs").insert({ userId, userName, action: "SECURITY_SEQUENCE_RESET", entityType: "USER_SECURITY", entityId: userId });
  };

  const handleUpdatePreference = async (key: string, value: string, outletId?: string) => {
    const payload: any = { key, value, updatedAt: new Date().toISOString() };
    if (outletId) payload.outlet_id = outletId;
    
    const { error } = await supabase.from("system_preferences").upsert(payload, { onConflict: 'key,outlet_id' });
    if (!error) {
      setSystemPrefs(prev => {
        const existing = prev.find(p => p.key === key && p.outlet_id === outletId);
        if (existing) return prev.map(p => (p.key === key && p.outlet_id === outletId) ? { ...p, value } : p);
        return [...prev, payload];
      });
    }
  };

  const handleToggleReminder = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("submission_reminders").update({ isActive }).eq("id", id);
    if (!error) setReminders(prev => prev.map(r => r.id === id ? { ...r, isActive } : r));
  };

  const allRoles: Role[] = ["super_admin", "admin", "ho_accountant", "outlet_manager", "outlet_accountant"];
  const adminRoles: Role[] = ["super_admin", "admin"];

  const sidebarCategories = [
    {
      id: "personal",
      label: "Personal Settings",
      roles: allRoles,
      items: [
        { id: "profile", label: "Personal Profile", icon: <User className="h-4 w-4" />, roles: allRoles },
        { id: "security", label: "Security & MFA", icon: <Lock className="h-4 w-4" />, roles: allRoles },
        { id: "sessions", label: "Session Management", icon: <Laptop className="h-4 w-4" />, roles: allRoles },
        { id: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" />, roles: allRoles },
      ]
    },
    {
      id: "system",
      label: "System & Governance",
      roles: ["super_admin", "admin", "ho_accountant"],
      items: [
        { id: "users", label: "User Management", icon: <Users className="h-4 w-4" />, roles: adminRoles },
        { id: "outlets", label: "Outlets", icon: <Building2 className="h-4 w-4" />, roles: adminRoles },
        { id: "financial-year", label: "Financial Year", icon: <Clock className="h-4 w-4" />, roles: ["ho_accountant", "super_admin"] },
        { id: "reporting", label: "Reporting Rules", icon: <FileText className="h-4 w-4" />, roles: ["ho_accountant", "super_admin"] },
        { id: "audit", label: "Audit Trail", icon: <History className="h-4 w-4" />, roles: adminRoles },
      ]
    },
    {
      id: "outlet",
      label: "Outlet Level Settings",
      roles: allRoles,
      items: [
        { id: "reminders", label: "Submission Reminders", icon: <Bell className="h-4 w-4" />, roles: ["outlet_manager", "super_admin", "admin"] },
        { id: "verification", label: "Verification Rules", icon: <Shield className="h-4 w-4" />, roles: ["outlet_accountant", "super_admin", "admin"] },
        { id: "defaults", label: "Default Values", icon: <IndianRupee className="h-4 w-4" />, roles: ["outlet_manager", "super_admin", "admin"] },
        { id: "local-sync", label: "Local Notification Sync", icon: <Globe className="h-4 w-4" />, roles: ["outlet_accountant", "super_admin", "admin"] },
      ]
    }
  ];

  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-10 w-10 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing System Data...</p>
      </div>
    );

    const outletId = userOutlet?.id;

    switch (activeTab) {
      case "profile": return <PersonalProfile userName={userName} email={userEmail} phone={userPhone} role={userRole} outlet={userOutlet} onSave={handleUpdateProfile} />;
      case "security": return <SecuritySettings onUpdatePassword={handleUpdatePassword} />;
      case "sessions": return <SessionsScreen />;
      case "appearance": return <VisualPreferences />;
      case "users": return <UserManagementScreen users={allUsers} />;
      case "outlets": return <OutletsScreen outlets={allOutlets} users={allUsers} />;
      case "financial-year": return <FinancialYearScreen data={financialYears} onAdd={() => {}} />;
      case "reporting": return <ReportingRulesScreen preferences={systemPrefs} onUpdate={(k, v) => handleUpdatePreference(k, v)} />;
      case "audit": return <AuditTrailScreen logs={auditLogs} />;
      case "reminders": return <RemindersScreen reminders={reminders.filter(r => r.outlet_id === outletId || !r.outlet_id)} onToggle={handleToggleReminder} />;
      case "verification": return <PreferenceToggleList title="Verification Rules" subtitle="Validation Integrity Policies" rules={[{key: "strict_verification", label: "HO Verification Proof", desc: "Require HO Accountant approval for daily ledger finalization."}]} preferences={systemPrefs.filter(p => p.outlet_id === outletId)} onUpdate={(k, v) => handleUpdatePreference(k, v, outletId)} />;
      case "defaults": return <PreferenceToggleList title="Default Constraints" subtitle="Outlet Financial Guardrails" rules={[{key: "max_expense_limit", label: "Daily Expense Ceiling", desc: "Throttle expenses beyond defined threshold."}]} preferences={systemPrefs.filter(p => p.outlet_id === outletId)} onUpdate={(k, v) => handleUpdatePreference(k, v, outletId)} />;
      case "local-sync": return <PreferenceToggleList title="Node Synchronization" subtitle="Real-time Data Propogation" rules={[{key: "realtime_push", label: "Instant Sync", desc: "Broadcast entry updates immediately to all connected peers."}]} preferences={systemPrefs.filter(p => p.outlet_id === outletId)} onUpdate={(k, v) => handleUpdatePreference(k, v, outletId)} />;
      default: return <PlaceholderScreen tag={activeTab} title="Module Verified" />;
    }
  };

  return (
    <Container className="py-10 max-w-7xl">
      <div className="mb-10 flex items-center justify-between border-b border-gray-200 pb-8">
        <div className="space-y-1">
          <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors mb-4">
            <ArrowLeft className="h-3 w-3" /> Back to Dashboard
          </Link>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase italic flex items-center gap-6">
            <div className="h-12 w-[1px] bg-gray-200 rotate-[20deg]" /> Configuration Portal
          </h1>
          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">
            {userRole || 'AUTHENTICATING'} // System Runtime 2.4.0
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-[280px,1fr] gap-12 items-start">
        <aside className="space-y-10 sticky top-10">
          {sidebarCategories.filter(cat => !userRole || cat.roles.includes(userRole)).map((category) => (
            <div key={category.id} className="space-y-3">
              <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">{category.label}</h3>
              <nav className="space-y-1">
                {category.items.filter(item => !userRole || item.roles.includes(userRole)).map((item) => (
                  <button key={item.id} onClick={() => setActiveTab(item.id)} className={cn("w-full flex items-center justify-between px-3 py-3 transition-all text-left", activeTab === item.id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50")}>
                    <div className="flex items-center gap-3">
                      <span className={cn("transition-colors", activeTab === item.id ? "text-white" : "group-hover:text-gray-900")}>{item.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          ))}
          <div className="pt-10 border-t border-gray-100 space-y-4">
            <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-red-500">Danger Zone</h3>
            <button className="w-full flex items-center gap-3 px-3 py-3 border border-red-200 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors">
              <LogOut className="h-4 w-4" /> Sign out all devices
            </button>
          </div>
        </aside>

        <main className="min-h-[600px] bg-white border border-gray-100 p-10 relative overflow-hidden shadow-sm">
          <div className="absolute top-10 right-10 rotate-90 origin-right opacity-[0.03] pointer-events-none select-none">
            <p className="text-8xl font-black uppercase tracking-tighter italic">SAHAKAR ERP</p>
          </div>
          <div className="relative z-10">{renderContent()}</div>
          <div className="absolute bottom-10 right-10 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Secure Sync Active</p>
          </div>
        </main>
      </div>
    </Container>
  );
}
export default function SettingsPage() {
  return (
    <Suspense fallback={
      <Container className="py-10 max-w-7xl">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="h-10 w-10 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </Container>
    }>
      <SettingsContent />
    </Suspense>
  );
}
