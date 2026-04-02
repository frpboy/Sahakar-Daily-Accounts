"use client";

import { Container } from "@/components/ui/container";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Building2, ShieldCheck, Bell, Save, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [auditMode, setAuditMode] = useState(true);

  return (
    <Container className="py-10 max-w-5xl space-y-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">
            System Settings
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
            Configure global business rules and enterprise behavior
          </p>
        </div>
        <Button className="bg-black text-white gap-3 h-12 px-8 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all">
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>

      <div className="grid gap-8">
        {/* Business Core */}
        <Card className="border border-gray-200 shadow-none rounded-none overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/50 border-b py-4 px-8">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gray-900 text-white rounded-none shadow-sm">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-900">
                  Business Profile
                </CardTitle>
                <CardDescription className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mt-0.5">
                  Core Identity
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Business Legal Name
              </Label>
              <Input
                defaultValue="Sahakar Daily Accounts"
                className="h-12 border-gray-200 rounded-none font-bold text-gray-900 focus-visible:ring-gray-900 px-4"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Primary Domain/Link
              </Label>
              <Input
                defaultValue="sahakar-accounts.com"
                className="h-12 border-gray-200 rounded-none font-bold text-gray-900 focus-visible:ring-gray-900 px-4"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Base Currency
              </Label>
              <Input
                defaultValue="INR (₹)"
                className="h-12 border-gray-200 rounded-none font-bold text-gray-900 focus-visible:ring-gray-900 px-4"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Fiscal Year Start
              </Label>
              <Input
                type="date"
                defaultValue="2024-04-01"
                className="h-12 border-gray-200 rounded-none font-bold text-gray-900 focus-visible:ring-gray-900 px-4"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Security & Audit */}
          <Card className="border border-gray-200 shadow-none rounded-none overflow-hidden bg-white">
            <CardHeader className="py-4 px-6 border-b bg-gray-50/30">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-gray-500">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Security &
                Auditing
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                    Enterprise Audit Logs
                  </Label>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Track every database mutation and login event.
                  </p>
                </div>
                <Switch
                  checked={auditMode}
                  onCheckedChange={setAuditMode}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                    Enforce Multi-factor (MFA)
                  </Label>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Global requirement for Ho-Accountants access.
                  </p>
                </div>
                <Switch
                  defaultChecked={false}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Alerts & Comms */}
          <Card className="border border-gray-200 shadow-none rounded-none overflow-hidden bg-white">
            <CardHeader className="py-4 px-6 border-b bg-gray-50/30">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-gray-500">
                <Bell className="h-4 w-4 text-blue-500" /> Notifications &
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                    Browser Push Alerts
                  </Label>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Instant alerts for new daily submissions.
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                    Email Daily Summary
                  </Label>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Send consolidated report at end of day.
                  </p>
                </div>
                <Switch
                  defaultChecked={true}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="p-6 bg-blue-50 rounded-none flex items-start gap-4 border border-blue-200">
          <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-blue-900 leading-relaxed font-bold uppercase tracking-wide">
            <span className="font-black underline mr-2">Warning:</span> Only
            Administrators can modify System Settings. Changes made here affect
            all users globally and are recorded in the system audit trail for
            security compliance.
          </p>
        </div>
      </div>
    </Container>
  );
}
