"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  User, Mail, Phone, MapPin, Building2, Globe, Settings,
  Search, Plus, Bell,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Helper components
const SectionHeader = ({ title, subtitle }: { title: string, subtitle: string, color?: "emerald" | "red" | "blue" }) => (
  <div className="space-y-1 mb-8">
    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    <p className="text-xs text-gray-500">{subtitle}</p>
  </div>
);


export function PersonalProfile({ 
  userName, email, phone, role, outlet, onSave 
}: { 
  userName: string, email: string, phone: string, role: string | null, outlet?: any, onSave: (data: any) => Promise<void> 
}) {
  const [formData, setFormData] = useState({ name: userName, phone: phone });
  const [isSaving, setIsSaving] = useState(false);

  const isGlobal = role === 'admin' || role === 'ho_accountant';
  const displayRole = (role || 'AUTHENTICATING').replace('_', ' ');
  const outletName = outlet?.name || "TIRUR";
  const fullLabel = isGlobal ? `${userName} - ${displayRole}` : `${userName} - ${outletName} - ${displayRole}`;

  const handleUpdate = async () => {
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Personal Profile" subtitle="Your Profile" />

      <div className="grid gap-8 max-w-2xl">
        <div className="space-y-6 bg-gray-50/50 border border-gray-100 p-8 rounded-none">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Name</label>
              <div className="relative">
                <Input value={fullLabel} readOnly className="rounded-none border-gray-100 bg-gray-50/50 pl-10 h-11 text-xs font-black uppercase tracking-widest text-gray-900 cursor-default" />
                <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Email Address</label>
                <div className="relative">
                  <Input disabled value={email} className="rounded-none border-gray-100 bg-gray-50/50 pl-10 h-11 text-xs font-mono text-gray-400 cursor-not-allowed" />
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-300" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Phone Number</label>
                <div className="relative">
                  <Input 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="rounded-none border-gray-200 focus:border-gray-900 focus:ring-0 pl-10 h-11 bg-white text-xs font-black tracking-widest" 
                  />
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isGlobal && outlet && (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Your Assigned Outlet
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{outlet.name}</p>
                {(outlet.type || outlet.code) && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {[outlet.type, outlet.code].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 bg-emerald-100 border border-emerald-200 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-3">Contact admin to change your outlet assignment</p>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button 
            disabled={isSaving}
            onClick={handleUpdate}
            className="px-10 py-5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.25em] shadow-premium-lg hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SecuritySettings({ onUpdatePassword }: { onUpdatePassword: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setIsUpdating(true);
    await onUpdatePassword(password);
    setIsUpdating(false);
    setPassword("");
    setConfirm("");
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Change Password" subtitle="Update your login password" />

      <div className="grid gap-8 max-w-2xl">
        <div className="p-8 border border-gray-200 bg-white space-y-8">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">New Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password" className="rounded-none border-gray-200 italic text-[10px] h-12"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Confirm Password</label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password" className="rounded-none border-gray-200 italic text-[10px] h-12"
              />
            </div>
            <Button 
              disabled={isUpdating || !password}
              onClick={handleUpdate}
              className="rounded-none bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] w-full py-6 shadow-premium-lg"
            >
              {isUpdating ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

export function SessionsScreen({ sessions }: { sessions?: any[] }) {
  const defaultSessions = [
    { id: 1, device: "Desktop Terminal", os: "Windows 11", location: "Kozhikode, India", status: "Active", current: true },
    { id: 2, device: "Mobile Handheld", os: "Android Core", location: "Malappuram, India", status: "Verified", current: false },
  ];
  const list = sessions || defaultSessions;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Session Management" subtitle="Active Terminal Oversight" color="blue" />

      <div className="grid gap-4 max-w-3xl">
        {list.map((session) => (
          <div key={session.id} className={cn(
            "p-6 border flex items-center justify-between",
            session.current ? "bg-emerald-900/5 border-emerald-900 shadow-sm" : "bg-white border-gray-100"
          )}>
            <div className="flex items-center gap-6">
              <div className={cn(
                "h-10 w-10 flex items-center justify-center",
                session.current ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
              )}>
                {session.current ? <Globe className="h-5 w-5 animate-spin-slow" /> : <Globe className="h-5 w-5 opacity-40" />}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-black text-gray-900 uppercase italic">{session.device} - {session.os}</p>
                  {session.current && <span className="bg-emerald-900 text-white text-[8px] font-black px-2 uppercase tracking-widest italic animate-pulse">Live</span>}
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{session.location}</p>
              </div>
            </div>
            {!session.current && (
              <button className="text-[10px] font-black text-red-600 uppercase italic border-b border-red-200 hover:text-red-900 transition-colors">Revoke Access</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function VisualPreferences() {
  const [isCompact, setIsCompact] = useState(false);
  const [isDark, setIsDark] = useState(false);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Visual Preferences" subtitle="Interface Customization Framework" color="blue" />

      <div className="grid gap-6 max-w-xl">
        <div 
          onClick={() => setIsCompact(!isCompact)}
          className={cn(
            "flex items-center justify-between p-6 border transition-all cursor-pointer group",
            isCompact ? "border-gray-900 bg-gray-50" : "border-gray-100 bg-white hover:border-gray-400"
          )}
        >
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest italic group-hover:underline decoration-emerald-500">Compact Mode</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase">Show more data on smaller screens</p>
          </div>
          <Switch checked={isCompact} />
        </div>

        <div 
          onClick={() => setIsDark(!isDark)}
          className={cn(
            "flex items-center justify-between p-6 border transition-all cursor-pointer group",
            isDark ? "border-gray-900 bg-gray-900 text-white" : "border-gray-100 bg-white hover:border-gray-400"
          )}
        >
          <div className="space-y-1">
            <p className={cn("text-xs font-black uppercase tracking-widest italic group-hover:underline decoration-emerald-500", isDark ? "text-white" : "text-gray-900")}>Dark Mode</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase">Enterprise midnight aesthetic</p>
          </div>
          <Switch checked={isDark} />
        </div>
      </div>
    </div>
  );
}

export function UserManagementScreen({ users }: { users: any[] }) {
  const [search, setSearch] = useState("");
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <SectionHeader title="User Governance" subtitle="Master Staff Access Directory" />
        <Button className="rounded-none bg-gray-900 text-white px-6 py-4 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:pr-8">
          Invite New Identity <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Input 
            placeholder="Search within identity cluster..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-none border-gray-100 pl-10 text-[10px] uppercase font-black tracking-widest h-12" 
          />
          <Search className="absolute left-3 top-4 h-4 w-4 text-gray-300" />
        </div>

        <div className="border border-gray-100 bg-white overflow-hidden shadow-sm">
          <div className="grid grid-cols-[1fr,150px,180px,100px] p-4 bg-gray-50 border-b border-gray-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">User Descriptor</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Role Access</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Deployed Node</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Auth Status</p>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="p-20 text-center text-[10px] font-black uppercase text-gray-300 italic">No identity pointers found matching criteria</p>
            ) : filteredUsers.map((u, i) => (
              <div key={i} className="grid grid-cols-[1fr,150px,180px,100px] p-5 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer group">
                <div className="space-y-0.5">
                  <p className="text-xs font-black uppercase italic tracking-tighter group-hover:underline decoration-emerald-500">{u.name}</p>
                  <p className="text-[9px] font-mono text-gray-400 font-bold uppercase">{u.email}</p>
                </div>
                <span className="text-[9px] font-black text-gray-900 bg-gray-100 px-2 py-0.5 w-fit uppercase tracking-widest">{u.role.replace('_', ' ')}</span>
                <p className={cn(
                  "text-[10px] font-black px-2 py-0.5 w-fit uppercase tracking-widest italic",
                  u.outlets ? "text-emerald-900 bg-emerald-50" : "text-gray-400 bg-gray-100"
                )}>
                  {u.outlets?.name || "Global Access"}
                </p>
                <div className="flex items-center gap-2">
                  <div className={cn("h-1.5 w-1.5 rounded-full", u.is_active === 'true' ? "bg-emerald-500" : "bg-red-500")} />
                  <span className="text-[9px] font-black text-gray-900 uppercase">{u.is_active === 'true' ? "Active" : "Locked"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OutletsScreen({ outlets, users }: { outlets: any[], users: any[] }) {
  const getOutletStaffCount = (outletId: string) => users.filter(u => u.outlet_id === outletId).length;
  const getOutletManager = (outletId: string) => users.find(u => u.outlet_id === outletId && u.role === 'outlet_manager')?.name || "Not Assigned";

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <SectionHeader title="Outlets Infrastructure" subtitle="Node Deployment & Assignment" />
        <Button variant="outline" className="rounded-none border-gray-900 text-gray-900 px-6 py-4 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-900 hover:text-white transition-all">
          Provision New Node <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {outlets.map((o, i) => {
          const staffCount = getOutletStaffCount(o.id);
          const managerName = getOutletManager(o.id);

          return (
            <div key={i} className="p-8 border border-gray-100 bg-white group hover:border-gray-900 transition-all flex flex-col justify-between hover:shadow-premium-lg">
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="h-12 w-12 bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-colors">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase tracking-widest italic group-hover:underline decoration-emerald-500 underline-offset-4">
                      {o.name}
                    </h4>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic">{o.type} - <span className="font-mono tracking-normal">{o.code}</span></p>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Manager</p>
                    <p className={cn(
                      "text-[10px] font-black uppercase italic",
                      managerName === "Not Assigned" ? "text-red-500" : "text-gray-900"
                    )}>{managerName}</p>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Staff</p>
                    <p className="text-[10px] font-black uppercase italic text-gray-900">{staffCount} Unit Pointers</p>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Location</p>
                    <p className="text-[10px] font-black uppercase italic text-gray-900">{o.location}</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                <Button variant="outline" className="flex-1 rounded-none border-gray-900 text-gray-900 text-[8px] font-black uppercase tracking-widest h-10 hover:bg-gray-900 hover:text-white">
                  Assign Staff
                </Button>
                <Button variant="outline" className="flex-1 rounded-none border-gray-900 text-gray-900 text-[8px] font-black uppercase tracking-widest h-10 hover:bg-gray-900 hover:text-white">
                  Node Settings
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

export function FinancialYearScreen({ data, onAdd }: { data: any[], onAdd: () => void }) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <SectionHeader title="Temporal Governance" subtitle="Financial Year & Accounting Cycles" color="emerald" />
        <Button onClick={onAdd} className="rounded-none bg-gray-900 text-white px-6 py-4 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
          New Cycle <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 max-w-3xl">
        {data.length === 0 ? (
          <div className="p-20 border border-dashed border-gray-100 bg-gray-50/20 text-center">
            <Clock className="h-10 w-10 text-gray-100 mx-auto mb-4" />
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">No active temporal cycles defined in DB</p>
          </div>
        ) : data.map((fy) => (
          <div key={fy.id} className="p-6 border border-gray-100 bg-white flex items-center justify-between group hover:border-gray-900 transition-all">
            <div className="flex items-center gap-6">
              <div className="h-10 w-10 bg-gray-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-black text-gray-900 uppercase italic tracking-widest">{fy.name}</p>
                  {fy.isCurrent && <span className="bg-emerald-900 text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-widest">Current</span>}
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{fy.startDate} - {fy.endDate}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="text-[9px] font-black text-gray-400 hover:text-gray-900 uppercase underline underline-offset-4">Audit Settings</button>
              <button className="text-[9px] font-black text-red-400 hover:text-red-900 uppercase underline underline-offset-4">Freeze Entries</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportingRulesScreen({ preferences, onUpdate }: { preferences: any[], onUpdate: (key: string, value: string) => void }) {
  const rules = [
    { key: "allow_negative_cash", label: "Negative Cash Logic", desc: "Allow entry generation with negative balance pointers." },
    { key: "mandatory_expense_photo", label: "Attachment Enforcement", desc: "Require voucher photos for every expense node." },
    { key: "auto_sync_stock", label: "Automated Inventory Sync", desc: "Propagate stock changes instantly across all terminals." },
    { key: "strict_closing_hours", label: "Close-of-Day Lockdown", desc: "Disable entries after 22:00 node time." },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Reporting Rules" subtitle="System Behavior & Logic Constraints" color="blue" />

      <div className="grid gap-6 max-w-2xl">
        {rules.map((rule) => {
          const pref = preferences.find(p => p.key === rule.key && !p.outletId);
          const isActive = pref?.value === 'true';

          return (
            <div key={rule.key} className="p-6 border border-gray-100 bg-white flex items-center justify-between group hover:border-gray-900 transition-all">
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-widest italic group-hover:underline decoration-emerald-500">{rule.label}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase max-w-sm leading-relaxed">{rule.desc}</p>
              </div>
              <Switch checked={isActive} onCheckedChange={(checked) => onUpdate(rule.key, checked ? 'true' : 'false')} />
            </div>
          )
        })}
      </div>
    </div>
  );
}

export function AuditTrailScreen({ logs }: { logs: any[] }) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title="Audit Trail" subtitle="Eternal Administrative Ledger" color="red" />

      <div className="border border-gray-100 bg-white overflow-hidden shadow-sm">
        <div className="grid grid-cols-[160px,120px,1fr,150px] p-4 bg-gray-50 border-b border-gray-100">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Temporal Pointer</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Actor Identity</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Action Sequence</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Entity Logic</p>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="p-20 text-center text-[10px] font-black uppercase text-gray-300 italic">The ledger is currently empty of administrative mutations</p>
          ) : logs.map((log, i) => (
            <div key={i} className="grid grid-cols-[160px,120px,1fr,150px] p-5 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
              <p className="text-[9px] font-mono text-gray-400 font-bold">{new Date(log.createdAt).toLocaleString().toUpperCase()}</p>
              <p className="text-[9px] font-black text-gray-900 uppercase italic underline decoration-gray-300">{log.userName}</p>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{log.action}</p>
                {log.newData && <p className="text-[8px] font-mono text-emerald-600 font-bold truncate max-w-sm uppercase">Mutation: AUTH_SUCCESS - {JSON.stringify(log.newData)}</p>}
              </div>
              <span className="text-[9px] font-black text-gray-400 bg-gray-50 px-2 py-0.5 border border-gray-100 w-fit uppercase tracking-widest">{log.entityType} - {log.entityId?.slice(0, 8)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PreferenceToggleList({ title, subtitle, rules, preferences, onUpdate }: { title: string, subtitle: string, rules: { key: string, label: string, desc: string }[], preferences: any[], onUpdate: (key: string, value: string) => void }) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title={title} subtitle={subtitle} color="blue" />

      <div className="grid gap-6 max-w-2xl">
        {rules.map((rule) => {
          const pref = preferences.find(p => p.key === rule.key);
          const isActive = pref?.value === 'true';

          return (
            <div key={rule.key} className="p-6 border border-gray-100 bg-white flex items-center justify-between group hover:border-gray-900 transition-all">
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-widest italic group-hover:underline decoration-emerald-500">{rule.label}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase max-w-sm leading-relaxed">{rule.desc}</p>
              </div>
              <Switch checked={isActive} onCheckedChange={(checked) => onUpdate(rule.key, checked ? 'true' : 'false')} />
            </div>
          )
        })}
      </div>
    </div>
  );
}

export function RemindersScreen({ reminders, onToggle }: { reminders: any[], onToggle: (id: string, active: boolean) => void }) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <SectionHeader title="Submission Reminders" subtitle="Operational Queue Alerts" color="blue" />
        <Button className="rounded-none bg-gray-900 text-white px-6 py-4 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
          New Alert <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 max-w-2xl">
        {reminders.length === 0 ? (
          <div className="p-12 border border-dashed border-gray-100 bg-gray-50/20 text-center">
            <Bell className="h-8 w-8 text-gray-100 mx-auto mb-4" />
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">No operational alerts scheduled</p>
          </div>
        ) : reminders.map((r) => (
          <div key={r.id} className="p-6 border border-gray-100 bg-white flex items-center justify-between group hover:border-gray-900 transition-all">
            <div className="flex items-center gap-6">
              <div className="h-10 w-10 bg-gray-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-gray-900 uppercase italic tracking-widest">{r.time} NODE TIME</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">{r.days} - ACTIVE SEQUENCE</p>
              </div>
            </div>
            <Switch checked={r.isActive} onCheckedChange={(checked) => onToggle(r.id, checked)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlaceholderScreen({ tag, title }: { tag: string, title: string }) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader title={tag} subtitle={`${title} Module Internal Logic`} />

      <div className="p-16 border-2 border-dashed border-gray-100 bg-gray-50/20 text-center space-y-8">
        <div className="relative h-24 w-24 mx-auto">
          <div className="absolute inset-0 border-2 border-dashed border-gray-200 rounded-full animate-spin-slow opacity-20" />
          <div className="absolute inset-4 border border-gray-100 rotate-45" />
          <Settings className="absolute inset-0 h-10 w-10 text-gray-100 m-auto" />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-black uppercase tracking-widest italic text-gray-900">{tag} - Node Deployment</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-sm mx-auto leading-relaxed italic">
            This module is currently initializing its configuration schema. 
            Backend verification for {title.toLowerCase()} is in progress.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-8 bg-gray-100" />
          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active Runtime</span>
          <div className="h-px w-8 bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

