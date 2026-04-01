"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  TrendingUp, 
  MessageSquare, 
  AlertCircle,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface DashboardStats {
  totalSales: number;
  totalExpenses: number;
  saleCash: number;
  saleUpi: number;
  saleCredit: number;
  closingStock: number;
  outletsStatus: any[];
  auditLogs: any[];
}

interface OutletManagerProps {
  outletId?: string | null;
}

export default function OutletManagerView({ outletId }: OutletManagerProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (outletId) {
      fetchStats();
    }
  }, [outletId]);

  async function fetchStats() {
    try {
      const response = await fetch(`/api/dashboard-stats?outletId=${outletId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch outlet stats:", error);
    } finally {
      // Done fetching
    }
  }

  const outletName = stats?.outletsStatus[0]?.name || "Loading Branch...";
  const hasSubmitted = stats?.outletsStatus[0]?.isSubmitted || false;

  return (
    <Container className="py-8 space-y-8 max-w-5xl text-gray-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="mb-3 px-2 py-0.5 bg-gray-900 text-white inline-block text-[8px] font-black uppercase tracking-[0.3em] font-mono">OPERATIONAL CONSOLE</div>
           <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{outletName}</h1>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Daily Operations & Compliance Manager</p>
        </div>
        
        {!hasSubmitted ? (
          <Link href="/entry" className="w-full md:w-auto">
            <Button className="w-full h-12 md:h-14 md:px-10 rounded-none bg-black text-white font-black text-xs uppercase tracking-[0.2em] shadow-none hover:bg-gray-800 transition-all border-none">
               <Plus className="mr-3 h-5 w-5" /> Submit Accounts
            </Button>
          </Link>
        ) : (
          <div className="flex items-center gap-4 bg-emerald-50 px-8 py-4 rounded-none border border-emerald-100">
             <div className="h-2 w-2 rounded-none bg-emerald-500 animate-pulse" />
             <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">SUBMITTED_SUCCESS_LINKED</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="md:col-span-2 border border-blue-200 shadow-none rounded-none bg-blue-50/30 overflow-hidden relative">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <TrendingUp className="h-40 w-40" />
           </div>
           <CardHeader className="py-4 px-6 border-b border-blue-100 bg-blue-50/50">
              <CardTitle className="text-[10px] font-black uppercase text-blue-700 tracking-[0.2em]">Monthly Revenue Target</CardTitle>
           </CardHeader>
           <CardContent className="p-8 space-y-8">
              <div className="flex justify-between items-end relative z-10">
                 <div>
                    <p className="text-5xl font-black text-gray-900 font-mono tracking-tighter">72%</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">{formatCurrency(stats?.totalSales || 0)} CURRENT_REVENUE_POOL</p>
                 </div>
                 <div className="px-3 py-1 border border-blue-200 bg-white text-gray-900 text-[9px] font-black uppercase tracking-widest">VERIFIED_DATA_PTR</div>
              </div>
              <div className="w-full h-2 bg-blue-100 rounded-none overflow-hidden mt-4">
                 <div className="h-full bg-blue-500 transition-all duration-1000 w-[72%]" />
              </div>
           </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-none rounded-none bg-gray-900 text-white p-8 flex flex-col justify-between overflow-hidden relative">
           <div className="space-y-6">
              <div className="p-3 bg-white/10 w-fit rounded-none border border-white/5">
                 <Archive className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Inventory Value</p>
                 <p className="text-4xl font-black font-mono tracking-tighter text-white">{formatCurrency(stats?.closingStock || 0)}</p>
              </div>
           </div>
           <div className="pt-6 border-t border-white/10 mt-6 flex items-center gap-2 text-[9px] font-black tracking-[0.2em] text-emerald-500 uppercase">
               <AlertCircle className="h-3 w-3" />
               SYS_STOCK_SYNC_OK
           </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
         <Card className="border border-gray-200 shadow-none rounded-none overflow-hidden bg-white">
            <CardHeader className="py-4 px-6 border-b bg-gray-50/50">
               <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Revenue Distribution Mix</CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex items-center justify-between gap-12">
               <div className="flex-1 space-y-5">
                  <div className="flex items-center justify-between py-2 border-b border-gray-50 group hover:bg-gray-50/50 transition-colors px-2">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3"><div className="h-1.5 w-1.5 rounded-none bg-emerald-500" /> CASH_TENDERED</span>
                     <span className="font-bold text-gray-900 font-mono text-xs">{formatCurrency(stats?.saleCash || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50 group hover:bg-gray-50/50 transition-colors px-2">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3"><div className="h-1.5 w-1.5 rounded-none bg-blue-500" /> DIGITAL_UPI</span>
                     <span className="font-bold text-gray-900 font-mono text-xs">{formatCurrency(stats?.saleUpi || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50 group hover:bg-gray-50/50 transition-colors px-2">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3"><div className="h-1.5 w-1.5 rounded-none bg-amber-500" /> CREDIT_OUTSTANDING</span>
                     <span className="font-bold text-gray-900 font-mono text-xs">{formatCurrency(stats?.saleCredit || 0)}</span>
                  </div>
               </div>
               <div className="hidden md:block relative h-36 w-36 border border-gray-100 p-4">
                    <div className="h-full w-full border-[6px] border-emerald-500 relative">
                        <div className="absolute top-[-6px] right-[-6px] bottom-[-6px] left-[-6px] border-[6px] border-blue-500 border-b-transparent border-l-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center bg-white">
                           <div className="text-center">
                              <span className="block text-[8px] font-black text-gray-300 uppercase tracking-widest">TOTAL</span>
                              <span className="block text-xs font-black text-gray-900 font-mono">{formatCurrency(stats?.totalSales || 0)}</span>
                           </div>
                        </div>
                    </div>
               </div>
            </CardContent>
         </Card>

         <Card className="border border-gray-200 shadow-none rounded-none bg-white p-0 overflow-hidden flex flex-col">
            <CardHeader className="py-4 px-6 border-b bg-gray-50/50">
               <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2"><MessageSquare className="h-4 w-4 opacity-50" /> System Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-0">
              {stats?.auditLogs && stats.auditLogs.length > 0 ? stats.auditLogs.slice(0, 3).map((log, i) => (
                <div key={i} className={`flex gap-6 items-start p-6 border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i === 1 ? 'bg-blue-50/30' : ''}`}>
                   <div className="h-10 w-10 rounded-none bg-gray-900 text-white flex items-center justify-center font-black text-[10px] uppercase tracking-widest">{log.user[0]}</div>
                   <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{log.user}</p>
                        <p className="text-[9px] font-black text-gray-300 font-mono">{new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                      </div>
                      <p className="text-xs font-bold text-gray-900 leading-tight uppercase tracking-tight">{log.action} ON {log.outlet}</p>
                   </div>
                </div>
              )) : (
                <div className="p-12 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.3em]">
                   No operational activity detected
                </div>
              )}
            </CardContent>
         </Card>
      </div>
    </Container>
  );
}


