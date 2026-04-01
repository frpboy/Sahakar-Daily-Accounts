"use client";

import { Container } from "@/components/ui/container";
import { TopNav } from "@/components/shared/TopNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChartOfAccountsPage() {
  return (
    <>
      <TopNav isAdmin={true} />
      <Container className="py-8">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Tree</CardTitle>
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
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono">1001</TableCell>
                    <TableCell className="font-medium">Cash in Hand</TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell>Current Assets</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono">1002</TableCell>
                    <TableCell className="font-medium">Bank Balance (HDFC)</TableCell>
                    <TableCell>Asset</TableCell>
                    <TableCell>Cash & Cash Equivalents</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono">5001</TableCell>
                    <TableCell className="font-medium">Rent Expense</TableCell>
                    <TableCell>Expense</TableCell>
                    <TableCell>Operational Expenses</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
