
import { 
  History, 
  Search, 
  Filter, 
  ArrowRight, 
  Activity,
  User,
  Calendar,
  Database,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { format } from "date-fns";

export default async function AuditLogsPage() {
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(50);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Container className="py-10 max-w-7xl">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                <History className="h-8 w-8 text-blue-600" />
                Audit Intelligence
              </h1>
              <p className="text-gray-500 mt-1">Real-time tracking of all system mutations and operational changes.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-11 border-gray-200">
                <Filter className="mr-2 h-4 w-4" /> Filter Logs
              </Button>
              <Button className="h-11 bg-gray-900 border-none shadow-lg">
                Export Audit Trail
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard icon={<Activity className="h-4 w-4" />} label="Total Mutations" value={logs.length.toString()} color="blue" />
            <StatCard icon={<User className="h-4 w-4" />} label="Active Actors" value="3" color="purple" />
            <StatCard icon={<Database className="h-4 w-4" />} label="Entities Tracked" value="5" color="orange" />
            <StatCard icon={<Calendar className="h-4 w-4" />} label="Retention" value="90 Days" color="green" />
          </div>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-white border-b py-6 px-8">
               <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search by user, entity, or action..." className="pl-10 h-11 border-gray-100 bg-gray-50/50 rounded-xl" />
                  </div>
                  <div className="flex items-center gap-2">
                     <Badge variant="outline" className="h-7 border-blue-100 text-blue-600 bg-blue-50/50 uppercase font-black text-[9px] tracking-widest px-3">LIVE UPDATES ENABLED</Badge>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-400 tracking-widest border-b">
                       <th className="px-8 py-4">Timestamp</th>
                       <th className="px-8 py-4">Actor</th>
                       <th className="px-8 py-4">Action</th>
                       <th className="px-8 py-4">Mutation</th>
                       <th className="px-8 py-4 text-right">Context</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {logs.map((log) => (
                       <tr key={log.id} className="hover:bg-gray-50/30 transition-colors group cursor-pointer">
                         <td className="px-8 py-5 whitespace-nowrap">
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-gray-900">{format(log.createdAt!, "HH:mm:ss")}</span>
                             <span className="text-[10px] font-medium text-gray-400">{format(log.createdAt!, "MMM dd, yyyy")}</span>
                           </div>
                         </td>
                         <td className="px-8 py-5">
                           <div className="flex items-center gap-3">
                             <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-700">
                               {log.userName?.substring(0, 2).toUpperCase() || "SY"}
                             </div>
                             <div className="flex flex-col">
                               <span className="text-xs font-bold text-gray-900">{log.userName || "System"}</span>
                               <span className="text-[10px] font-medium text-gray-400 tracking-tighter truncate max-w-[120px]">{log.userId}</span>
                             </div>
                           </div>
                         </td>
                         <td className="px-8 py-5">
                           <Badge className={`border-none px-3 py-1 font-black text-[9px] tracking-widest uppercase ${getActionColor(log.action)}`}>
                             {log.action}
                           </Badge>
                         </td>
                         <td className="px-8 py-5">
                           <div className="flex items-center gap-2">
                             <span className="text-xs font-bold text-gray-700">{log.entityType}</span>
                             <ArrowRight className="h-3 w-3 text-gray-300" />
                             <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{log.entityId || "N/A"}</span>
                           </div>
                         </td>
                         <td className="px-8 py-5 text-right">
                           <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 hover:bg-blue-50">View JSON</Button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    green: "text-green-600 bg-green-50 border-green-100",
  };

  return (
    <Card className="border-none shadow-sm rounded-2xl p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl border ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function getActionColor(action: string) {
  switch (action) {
    case "CREATE": return "bg-green-50 text-green-600";
    case "UPDATE": return "bg-blue-50 text-blue-600";
    case "DELETE": return "bg-red-50 text-red-600";
    case "LOGIN": return "bg-purple-50 text-purple-600";
    default: return "bg-gray-50 text-gray-600";
  }
}
