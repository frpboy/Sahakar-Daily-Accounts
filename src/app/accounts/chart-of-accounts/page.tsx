import { getFullChartOfAccounts } from "@/lib/actions/coa";
import { 
  Building2, 
  ChevronRight, 
  FolderIcon, 
  Search, 
} from "lucide-react";
import { CoAActions } from "@/components/accounts/coa-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/ui/container";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

export default async function ChartOfAccountsPage() {
  const result = await getFullChartOfAccounts();
  const categories = (result.success && result.data) ? result.data : [];

  return (
    <>
      <Container className="py-8 space-y-8 animate-in fade-in duration-500">
        {/* Header Section Standardized */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Chart of Accounts</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Manage financial categories, groups, and account hierarchies</p>
          </div>
          <CoAActions categories={categories} />
        </div>

        {/* Search & Filters Section - Standardized high-contrast */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-y border-gray-100 py-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input 
              placeholder="SEARCH ACCOUNTS OR CODES..." 
              className="pl-10 h-10 border-gray-200 bg-white rounded-none text-[10px] font-bold uppercase tracking-wider focus-visible:ring-black focus-visible:border-black"
            />
          </div>
          <div className="flex flex-wrap gap-2">
              <Badge className="px-4 py-1.5 cursor-pointer bg-black text-white rounded-none text-[10px] font-black uppercase tracking-widest border-none">All</Badge>
              {categories?.map((cat: any) => (
                  <Badge key={cat.id} variant="outline" className="px-4 py-1.5 cursor-pointer hover:bg-gray-50 bg-white rounded-none border-gray-200 text-gray-500 font-bold text-[10px] uppercase tracking-wider">
                    {cat.name}
                  </Badge>
              ))}
          </div>
        </div>

        {/* Hierarchy View */}
        <div className="space-y-12">
          {categories?.map((category: any) => (
            <div key={category.id} className="space-y-6">
              <div className="flex items-center gap-3 border-l-4 border-black pl-4">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{category.name}</h2>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{category.groups?.length || 0} Groups</span>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {category.groups?.map((group: any) => (
                  <Card key={group.id} className="border border-gray-200 shadow-none bg-white rounded-none overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b py-3 px-6 flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-3">
                        <FolderIcon className="h-3.5 w-3.5 text-gray-400" />
                        <CardTitle className="text-[11px] font-black text-gray-900 uppercase tracking-wider">{group.name}</CardTitle>
                      </div>
                      <div className="px-2 py-0.5 border border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        {group.accounts?.length || 0} Accounts
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Code</TableHead>
                            <TableHead>Account Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.accounts?.map((acc: any) => (
                            <TableRow key={acc.id} className="group/row">
                              <TableCell>
                                <span className="font-mono text-xs font-bold text-gray-400 group-hover/row:text-gray-900 transition-colors">
                                  {acc.code}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="font-bold text-gray-900 text-xs uppercase tracking-tight">{acc.name}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-[10px] font-medium text-gray-400 line-clamp-1 uppercase tracking-tight">{acc.description || '—'}</span>
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-none ${
                                  acc.isActive === 'true' 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-gray-100 text-gray-400"
                                }`}>
                                  {acc.isActive === 'true' ? 'Active' : 'Hidden'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <ChevronRight className="h-4 w-4 text-gray-200 group-hover/row:text-gray-900 transition-colors" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {group.accounts?.length === 0 && (
                        <div className="py-12 text-center text-gray-300 text-[10px] font-black uppercase tracking-widest">
                          No accounting entries under this group
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 bg-gray-50/30 rounded-none border border-dashed border-gray-200">
              <Building2 className="h-12 w-12 text-gray-200" />
              <div className="space-y-2">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">No Categories Detected</h3>
                <p className="text-[10px] font-bold text-gray-300 max-w-xs uppercase tracking-wider">
                    Configure your enterprise accounting groups to begin building the chart of accounts hierarchy.
                </p>
              </div>
              <Button className="bg-black text-white font-black rounded-none px-10 py-6 h-auto text-[10px] uppercase tracking-[0.2em] hover:bg-gray-800">Initialize Default Schema</Button>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
