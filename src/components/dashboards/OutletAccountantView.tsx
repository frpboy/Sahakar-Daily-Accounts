"use client";

import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { 
  History, 
  CheckCircle, 
  TrendingDown,
  Clock,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OutletAccountantProps {
  outletId?: string | null;
}

export default function OutletAccountantView({}: OutletAccountantProps) {
  const branchName = "Melattur Branch"; // Mock

  return (
    <Container className="py-8 space-y-8 text-gray-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="mb-3 px-2 py-0.5 bg-gray-900 text-white inline-block text-[8px] font-black uppercase tracking-[0.3em] font-mono">INTERNAL AUDIT UNIT</div>
           <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{branchName}</h1>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Branch Verification & Ledger Compliance Monitor</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
           <Button variant="outline" className="h-10 px-6 rounded-none border-gray-200 text-gray-900 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all font-black">
              <Printer className="mr-2 h-3.5 w-3.5 text-gray-400" /> Day End Report
           </Button>
           <Button className="h-10 px-6 rounded-none bg-black text-white font-black text-[10px] uppercase tracking-widest shadow-none hover:bg-gray-800 transition-all border-none">
              <CheckCircle className="mr-2 h-3.5 w-3.5" /> Validate All Today
           </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <Card className="border border-gray-200 shadow-none rounded-none bg-white overflow-hidden">
              <CardHeader className="py-3 px-5 border-b bg-gray-50/50">
                 <CardTitle className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center gap-2">
                    <TrendingDown className="h-3 w-3 text-red-500" /> Petty Cash Ledger
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                 <div className="p-4 bg-gray-50/30 border border-gray-100 rounded-none shadow-none group">
                    <p className="text-[9px] font-black text-red-500 mb-2 uppercase tracking-widest font-mono">01 MAY 2026</p>
                    <p className="font-bold text-xs text-gray-900 leading-tight uppercase tracking-tight font-black">₹14,000 EXPENSE</p>
                    <p className="text-[10px] text-gray-400 mt-3 font-bold leading-tight uppercase tracking-tight opacity-70">"Repair cost for secondary cooling unit."</p>
                    <div className="flex justify-between items-center mt-5 pt-3 border-t border-gray-100">
                       <span className="text-[8px] font-black text-gray-400 border border-gray-200 px-2 py-0.5 rounded-none uppercase tracking-widest">MAINTENANCE</span>
                       <Button variant="ghost" className="h-7 text-[9px] text-gray-900 font-black hover:bg-gray-100 px-3 rounded-none uppercase tracking-widest border border-gray-100">REVIEW</Button>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="border border-gray-200 shadow-none rounded-none bg-gray-900 text-white p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                 <Clock className="h-4 w-4 text-emerald-500" />
                 <p className="text-[10px] font-black text-white uppercase tracking-widest">Auto-Verify Status</p>
              </div>
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-tight">
                 Submissions pre-18:30 queued for immediate audit. Flag discrepancies with correction tool.
              </p>
              <div className="w-full bg-white/10 h-1.5 rounded-none overflow-hidden mt-2">
                 <div className="h-full bg-emerald-500 w-[45%]" />
              </div>
           </Card>
        </div>

        <Card className="lg:col-span-3 border border-gray-200 shadow-none rounded-none overflow-hidden bg-white">
           <CardHeader className="py-3 px-6 border-b bg-gray-50/50">
              <div className="flex justify-between items-center">
                 <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                    <History className="h-3.5 w-3.5 opacity-50" /> Recent Submission History
                 </CardTitle>
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-60">LAST_30_DAYS_PTR</span>
              </div>
           </CardHeader>
           <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left min-w-[600px] border-collapse">
                 <thead>
                    <tr className="bg-gray-50/30 text-[9px] uppercase font-black text-gray-400 tracking-widest border-b">
                       <th className="px-6 py-3 font-black">Submission Date</th>
                       <th className="px-6 py-3 font-black text-right">Sale Gross</th>
                       <th className="px-6 py-3 font-black text-right">Expenses</th>
                       <th className="px-6 py-3 font-black text-right">Net Result</th>
                       <th className="px-6 py-3 font-black text-center">Auditor Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {[
                      { date: "May 01, 2026", sales: 45200, expenses: 8400, status: "Verified" },
                      { date: "Apr 30, 2026", sales: 38900, expenses: 2500, status: "Verified" },
                      { date: "Apr 29, 2026", sales: 52100, expenses: 9200, status: "Flagged" },
                      { date: "Apr 28, 2026", sales: 41000, expenses: 14000, status: "Verified" },
                    ].map((row, i) => {
                      const net = row.sales - row.expenses;
                      return (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                           <td className="px-6 py-3 font-bold text-gray-900 text-xs uppercase tracking-tight">{row.date}</td>
                           <td className="px-6 py-3 text-emerald-500 font-mono text-[11px] font-bold text-right">{formatCurrency(row.sales)}</td>
                           <td className="px-6 py-3 text-red-500 font-mono text-[11px] font-bold text-right">{formatCurrency(row.expenses)}</td>
                           <td className={`px-6 py-3 font-black font-mono text-[11px] text-right ${net >= 0 ? "text-gray-900 border-l border-gray-50" : "text-red-500 bg-red-50/30 font-bold"}`}>
                             {formatCurrency(net)}
                           </td>
                           <td className="px-6 py-3 text-center">
                              {row.status === "Flagged" ? (
                                 <Button variant="outline" size="sm" className="h-7 px-3 rounded-none border-red-200 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-50">Correction Required</Button>
                              ) : (
                                 <span className="px-2 py-0.5 rounded-none text-[8px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-700 border-emerald-100">VERIFIED</span>
                              )}
                           </td>
                        </tr>
                      )
                    })}
                 </tbody>
              </table>
           </CardContent>
        </Card>
      </div>
    </Container>
  );
}

