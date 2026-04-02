"use client";

import { useEffect, useState } from "react";

import {
  User as UserIcon,
  Shield,
  Bell,
  LogOut,
  Settings,
  CheckCircle2,
  Building2,
  Code,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Layout, History } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { notifySuccess } from "@/lib/notifications";

interface Outlet {
  id: string;
  name: string;
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    async function fetchOutlets() {
      try {
        const res = await fetch("/api/outlets-list");
        if (res.ok) {
          const data = await res.json();
          setOutlets(data);
        }
      } catch (e) {
        console.error("Failed to fetch outlets:", e);
      } finally {
        setIsDataLoading(false);
      }
    }
    fetchOutlets();
  }, []);

  if (!user) return null;

  const handleRoleSwitch = (role: any) => {
    setUser({ ...user, role });
    notifySuccess(
      `Context switched to ${role.replace("_", " ").toUpperCase()}`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Container className="py-10 max-w-6xl">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-mono">
                Profile Settings
              </h1>
              <p className="text-gray-500 mt-1">
                Configure your personal information, security, and application
                experience.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border shadow-sm px-4">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Active Session ID: DOAMS-{user.id.slice(0, 5).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Sidebar Navigation */}
            <aside className="lg:col-span-3 space-y-1">
              <div className="p-4 bg-white border rounded-2xl mb-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 text-lg font-bold border-2 border-white shadow-sm">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                      {user.name}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      {user.role}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 pt-2 border-t text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                  CORE MODULES
                </div>
                <div className="mt-2 space-y-1">
                  <NavButton
                    icon={<UserIcon className="h-4 w-4" />}
                    label="Personal"
                    active
                  />
                  <NavButton
                    icon={<Shield className="h-4 w-4" />}
                    label="Security"
                  />
                  <NavButton
                    icon={<Bell className="h-4 w-4" />}
                    label="Notifications"
                  />
                </div>
                <div className="pt-4 mt-6 border-t">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-widest h-10"
                  >
                    <LogOut className="mr-3 h-4 w-4" /> Sign Out
                  </Button>
                </div>
              </div>

              {/* Developer Context Tool - Only for Admin */}
              {user.role === "admin" && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Code className="h-4 w-4 text-amber-700" />
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
                      Developer Toolkit
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-amber-600 mb-2 font-medium">
                      Switch view context:
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start text-[9px] font-bold uppercase h-8 border-amber-200 text-amber-800"
                      onClick={() => handleRoleSwitch("admin")}
                    >
                      Admin
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start text-[9px] font-bold uppercase h-8 border-amber-200 text-amber-800"
                      onClick={() => handleRoleSwitch("ho_accountant")}
                    >
                      HO Accountant
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start text-[9px] font-bold uppercase h-8 border-amber-200 text-amber-800"
                      onClick={() => handleRoleSwitch("outlet_manager")}
                    >
                      Outlet Manager
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-5 bg-gray-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Settings className="h-24 w-24" />
                </div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">
                  Storage Usage
                </p>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-blue-500 w-[12%]" />
                </div>
                <p className="text-xs font-medium text-white/60 leading-relaxed">
                  0.12 GB of 1 TB used
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-6 bg-transparent border-white/20 text-white hover:bg-white/10 h-10 text-xs font-bold uppercase tracking-widest"
                >
                  Manage Storage
                </Button>
              </div>
            </aside>

            {/* Right Main Content */}
            <div className="lg:col-span-9 space-y-8">
              {/* Personal Section */}
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b py-6">
                  <CardTitle className="text-lg font-bold">
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-xs font-medium">
                    This information is used across the system for audit trails.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label
                        htmlFor="first-name"
                        className="text-xs font-bold uppercase tracking-wider text-gray-500"
                      >
                        Full Name
                      </Label>
                      <Input
                        id="first-name"
                        defaultValue={user.name}
                        className="h-12 border-gray-100 rounded-xl focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="role-badge"
                        className="text-xs font-bold uppercase tracking-wider text-gray-500"
                      >
                        Assigned Role
                      </Label>
                      <div className="flex h-12 items-center px-4 border border-gray-100 bg-gray-50/50 rounded-xl text-sm font-bold uppercase tracking-wider text-gray-700">
                        {user.role}
                      </div>
                    </div>
                    <div className="space-y-3 col-span-full">
                      <Label
                        htmlFor="email"
                        className="text-xs font-bold uppercase tracking-wider text-gray-500"
                      >
                        Corporate Email
                      </Label>
                      <Input
                        id="email"
                        defaultValue={user.email}
                        className="h-12 border-gray-100 rounded-xl bg-gray-50/50 font-medium"
                        readOnly
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">
                          Verified Work Account
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Branch Access Section */}
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b py-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-gray-400" /> Branch &
                        Location Access
                      </CardTitle>
                      <CardDescription className="text-xs font-medium mt-1">
                        {user.role === "admin"
                          ? "You have global administrative access to all locations."
                          : `You are currently assigned to: ${user.outletName || "Global HO"}`}
                      </CardDescription>
                    </div>
                    <Badge className="bg-blue-600 text-white border-none uppercase text-[9px] font-black tracking-widest px-3">
                      {user.role === "admin" ? "MASTER ACCESS" : "LOCAL ACCESS"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-gray-50">
                    {isDataLoading ? (
                      <div className="col-span-full p-8 text-center text-xs font-bold text-gray-400">
                        LOADING BRANCHES...
                      </div>
                    ) : (
                      outlets
                        .slice(0, user.role === "admin" ? 100 : 1)
                        .map((outlet, i) => (
                          <div
                            key={outlet.id}
                            className="p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors group cursor-pointer"
                          >
                            <div className="h-10 w-10 bg-white border rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                              <Building2 className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900 line-clamp-1">
                                {outlet.name}
                              </p>
                              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">
                                BRA-{(i + 1).toString().padStart(3, "0")}
                              </p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Preferences Section */}
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b py-6">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Layout className="h-5 w-5 text-gray-400" /> Experience
                    Preferences
                  </CardTitle>
                  <CardDescription className="text-xs font-medium">
                    Fine-tune the application UI behavior.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                  <PreferenceRow
                    icon={<Layout className="h-5 w-5" />}
                    title="Compact Dashboard"
                    desc="Compress dashboard widgets for higher information density."
                  />
                  <PreferenceRow
                    icon={<Bell className="h-5 w-5" />}
                    title="Real-time Notifications"
                    desc="Get desktop alerts for branch submissions and critical alerts."
                    defaultChecked
                  />
                  <PreferenceRow
                    icon={<History className="h-5 w-5" />}
                    title="Audit Trail Logging"
                    desc="Automatically log your session actions for accountability."
                    defaultChecked
                  />
                </CardContent>
              </Card>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 pb-12">
                <Button
                  variant="ghost"
                  className="px-8 text-xs font-bold uppercase tracking-widest text-gray-400 h-12 hover:bg-gray-100"
                >
                  Reset Defaults
                </Button>
                <Button
                  className="bg-gray-900 border-none px-12 h-12 text-xs font-bold uppercase tracking-widest shadow-xl shadow-gray-200"
                  onClick={() =>
                    notifySuccess("Configuration synced successfully")
                  }
                >
                  Commit Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

function NavButton({
  icon,
  label,
  active = false,
}: {
  icon: any;
  label: string;
  active?: boolean;
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className={`w-full justify-start h-12 px-4 rounded-xl text-sm transition-all ${active ? "bg-gray-900 font-bold text-white shadow-lg shadow-gray-200" : "text-gray-500 font-medium hover:bg-gray-50"}`}
    >
      <span className={`mr-3 ${active ? "text-blue-400" : "text-gray-400"}`}>
        {icon}
      </span>
      {label}
    </Button>
  );
}

function PreferenceRow({
  icon,
  title,
  desc,
  defaultChecked = false,
}: {
  icon: any;
  title: string;
  desc: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-4">
        <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
          {icon}
        </div>
        <div className="space-y-0.5">
          <Label className="text-sm font-bold text-gray-900">{title}</Label>
          <p className="text-xs font-medium text-gray-500 max-w-sm">{desc}</p>
        </div>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
