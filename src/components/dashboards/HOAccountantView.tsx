"use client";

import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { 
  Download, 
  Filter, 
  ArrowRightLeft, 
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HOAccountantView() {
  return (
    <Container className="py-8 space-y-8 text-gray-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Financial Intelligence</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Consolidated auditing and system-wide performance oversight</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
           <Button variant="outline" className="h-10 px-6 rounded-none border-gray-200 text-gray-900 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all">
             <Filter className="mr-2 h-3.5 w-3.5 text-gray-400" /> Filters
           </Button>
           <Button className="h-10 px-6 rounded-none bg-black text-white font-black text-[10px] uppercase tracking-widest shadow-none hover:bg-gray-800 transition-all border-none">
             <Download className="mr-2 h-3.5 w-3.5" /> Export Ledger
           </Button>
        </div>
      </div>

      {/* Audit Queue */}
      <div className="grid lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-3 border border-gray-200 shadow-none rounded-none overflow-hidden bg-white">
           <CardHeader className="py-3 px-6 border-b bg-gray-50/50">
              <div className="flex justify-between items-center">
                 <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Consolidated Performance Ledger</CardTitle>
                 <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-4">
                    <span className="flex items-center gap-1.5 opacity-60"><div className="h-1.5 w-1.5 rounded-none bg-emerald-500" /> VERIFIED</span>
                    <span className="flex items-center gap-1.5 opacity-60"><div className="h-1.5 w-1.5 rounded-none bg-amber-500" /> PENDING REVIEW</span>
                 </div>
              </div>
           </CardHeader>
           <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left min-w-[700px] border-collapse">
                 <thead>
                    <tr className="bg-gray-50/30 text-[9px] uppercase font-black text-gray-400 tracking-widest border-b">
                       <th className="px-6 py-3 font-black">Outlet Entity</th>
                       <th className="px-6 py-3 font-black text-right">Gross Sales</th>
                       <th className="px-6 py-3 font-black text-right">Ops Expenses</th>
                       <th className="px-6 py-3 font-black text-right">Purchases</th>
                       <th className="px-6 py-3 font-black text-right">Net Result</th>
                       <th className="px-6 py-3 font-black text-center">Status Ptr</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {[
                      { outlet: "Melattur", sales: 45200, expenses: 8400, purchase: 12000, status: "Verified" },
                      { outlet: "Tirur", sales: 38900, expenses: 12500, purchase: 15000, status: "Pending" },
                      { outlet: "Palakkad", sales: 52100, expenses: 9200, purchase: 18000, status: "Verified" },
                      { outlet: "Kochi", sales: 41000, expenses: 14000, purchase: 11000, status: "Pending" },
                    ].map((row, i) => {
                      const net = row.sales - row.expenses - row.purchase;
                      return (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                           <td className="px-6 py-3 font-bold text-gray-900 text-xs uppercase tracking-tight">{row.outlet}</td>
                           <td className="px-6 py-3 text-emerald-500 font-mono text-[11px] font-bold text-right">{formatCurrency(row.sales)}</td>
                           <td className="px-6 py-3 text-red-500 font-mono text-[11px] font-bold text-right">{formatCurrency(row.expenses)}</td>
                           <td className="px-6 py-3 text-gray-400 font-mono text-[11px] text-right">{formatCurrency(row.purchase)}</td>
                           <td className={`px-6 py-3 font-black font-mono text-[11px] text-right ${net >= 0 ? "text-gray-900 border-l border-gray-50" : "text-red-500 bg-red-50/30 font-bold"}`}>
                             {formatCurrency(net)}
                           </td>
                           <td className="px-6 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-none text-[8px] font-black uppercase tracking-widest border ${row.status === "Verified" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-500 border-amber-100"}`}>
                                 {row.status}
                              </span>
                           </td>
                        </tr>
                      )
                    })}
                 </tbody>
              </table>
           </CardContent>
        </Card>

        {/* Action Sidebar */}
        <div className="space-y-6">
           <Card className="border border-amber-200 shadow-none rounded-none bg-amber-50/30 overflow-hidden">
              <CardHeader className="py-3 px-5 border-b border-amber-100 bg-amber-50/50">
                 <CardTitle className="text-[10px] font-black uppercase text-amber-700 tracking-[0.2em] flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" /> Flagged Ops
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                 <div className="p-4 bg-white border border-amber-100 rounded-none shadow-none group">
                    <p className="text-[9px] font-black text-amber-500 mb-2 uppercase tracking-widest">Kochi_Branch_PTR</p>
                    <p className="font-bold text-xs text-gray-900 leading-tight uppercase tracking-tight">₹14,000 | AC MAINTENANCE</p>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-50">
                       <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">01 MAY 2026</span>
                       <Button size="sm" className="h-7 px-3 bg-amber-500 hover:bg-amber-600 text-white border-none rounded-none text-[9px] font-black uppercase tracking-widest">VERIFY</Button>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="border border-gray-200 shadow-none rounded-none bg-gray-50/30 p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-gray-900 text-white rounded-none">
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                 </div>
                 <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Analytics Interface</p>
              </div>
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-tight">
                 Switch to comparative engine to analyze variance across historical data pools.
              </p>
              <Button variant="outline" className="w-full h-10 mt-2 px-6 rounded-none border-gray-200 text-gray-900 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all transition-all">Compare Trends</Button>
           </Card>
        </div>
      </div>
    </Container>
  );
}

