import { db } from "@/db";
import { accountCategories, accountGroups, chartOfAccounts } from "@/db/schema";
import { TopNav } from "@/components/shared/TopNav";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

export default async function ChartOfAccountsPage() {
  // 1. Initial check: Ensure categories and groups exist
  let categories = await db.select().from(accountCategories);
  if (categories.length === 0) {
    await db.insert(accountCategories).values([
      { name: "Assets" },
      { name: "Liabilities" },
      { name: "Equity" },
      { name: "Revenue" },
      { name: "Expenses" },
    ]);
    categories = await db.select().from(accountCategories);
  }

  // Ensure initial groups exist for demo
  const groups = await db.select().from(accountGroups);
  if (groups.length === 0) {
    const assetsCat = categories.find(c => c.name === "Assets");
    const liabilitiesCat = categories.find(c => c.name === "Liabilities");
    const revenueCat = categories.find(c => c.name === "Revenue");
    const expensesCat = categories.find(c => c.name === "Expenses");

    if (assetsCat && liabilitiesCat && revenueCat && expensesCat) {
      const insertedGroups = await db.insert(accountGroups).values([
        { name: "Cash and Bank", categoryId: assetsCat.id },
        { name: "Fixed Assets", categoryId: assetsCat.id },
        { name: "Current Liabilities", categoryId: liabilitiesCat.id },
        { name: "Operating Revenue", categoryId: revenueCat.id },
        { name: "Operating Expenses", categoryId: expensesCat.id },
      ]).returning();

      // Optionally add a first account too
      const cashGroup = insertedGroups.find(g => g.name === "Cash and Bank");
      if (cashGroup) {
        await db.insert(chartOfAccounts).values([
          { code: "1001", name: "Main Cash Account", groupId: cashGroup.id, isActive: "true" },
          { code: "1002", name: "SBI Bank Account", groupId: cashGroup.id, isActive: "true" },
          { code: "1003", name: "PhonePe Outlet", groupId: cashGroup.id, isActive: "true" },
        ]);
      }
    }
  }

  // 2. Fetch all accounts with their groups and categories
  const accounts = await db.query.chartOfAccounts.findMany({
    with: {
      group: {
        with: {
          category: true,
        },
      },
    },
  });

  return (
    <>
      <TopNav isAdmin={true} />
      <Container className="py-8 font-sans">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
              <p className="text-muted-foreground mt-2">
                Manage your enterprise account structure and financial categorization.
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>

          <Card className="overflow-hidden border-none shadow-premium-lg bg-white/70 backdrop-blur-md">
            <CardHeader className="bg-gray-50/50 border-b">
              <CardTitle className="text-lg font-semibold">Account Tree</CardTitle>
              <CardDescription>
                Search and filter through your general ledger accounts.
              </CardDescription>
              <div className="pt-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search accounts..."
                    className="pl-8 max-w-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/30">
                    <TableHead className="w-[100px] px-6">Code</TableHead>
                    <TableHead className="px-6">Account Name</TableHead>
                    <TableHead className="px-6">Category</TableHead>
                    <TableHead className="px-6">Group</TableHead>
                    <TableHead className="px-6 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No accounts found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    accounts.map((account) => (
                      <TableRow key={account.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="px-6 py-4 font-mono font-medium">{account.code}</TableCell>
                        <TableCell className="px-6 py-4 font-medium">{account.name}</TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {account.group?.category?.name}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-gray-600 font-sans">
                          {account.group?.name}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" className="font-sans">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
