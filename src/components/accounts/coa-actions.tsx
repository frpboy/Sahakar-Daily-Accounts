"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAccountGroup, createChartOfAccount } from "@/lib/actions/coa";
import { toast } from "sonner";

interface CoAActionsProps {
  categories: any[];
}

export function CoAActions({ categories }: CoAActionsProps) {
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group Form State
  const [groupName, setGroupName] = useState("");
  const [groupCategoryId, setGroupCategoryId] = useState("");
  const [groupParentId, setGroupParentId] = useState<string | null>(null);

  // Account Form State
  const [accountCode, setAccountCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountGroupId, setAccountGroupId] = useState("");
  const [accountDescription, setAccountDescription] = useState("");

  const allGroups = categories.flatMap((cat) => cat.groups || []);

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName || !groupCategoryId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createAccountGroup({
        name: groupName,
        categoryId: groupCategoryId,
        parentGroupId: groupParentId,
      });

      if (result.success) {
        toast.success("Account group created successfully");
        setIsGroupDialogOpen(false);
        setGroupName("");
        setGroupCategoryId("");
        setGroupParentId(null);
      } else {
        toast.error(result.error || "Failed to create group");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!accountCode || !accountName || !accountGroupId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createChartOfAccount({
        code: accountCode,
        name: accountName,
        groupId: accountGroupId,
        description: accountDescription,
      });

      if (result.success) {
        toast.success("Account created successfully");
        setIsAccountDialogOpen(false);
        setAccountCode("");
        setAccountName("");
        setAccountGroupId("");
        setAccountDescription("");
      } else {
        toast.error(result.error || "Failed to create account");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex gap-3">
      {/* Add Group Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="border-gray-200 text-gray-900 font-black text-[10px] uppercase tracking-widest px-6 h-10"
          >
            <Plus className="mr-2 h-3.5 w-3.5 text-gray-400" /> Create Group
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Account Group</DialogTitle>
            <DialogDescription>
              ESTABLISH A NEW HIERARCHICAL GROUP FOR FINANCIAL CLASSIFICATION
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddGroup} className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label
                htmlFor="name"
                className="text-[10px] font-black uppercase tracking-widest text-gray-400"
              >
                Group Designation
              </Label>
              <Input
                id="name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="E.G. FIXED ASSETS, OPERATIONAL EXPENSES"
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="category"
                className="text-[10px] font-black uppercase tracking-widest text-gray-400"
              >
                Primary Classification
              </Label>
              <Select
                value={groupCategoryId}
                onValueChange={setGroupCategoryId}
              >
                <SelectTrigger className="rounded-none border-gray-200 text-[10px] font-bold uppercase tracking-wider">
                  <SelectValue placeholder="SELECT CLASSIFICATION" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-gray-200">
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id}
                      className="text-[10px] font-bold uppercase tracking-wider"
                    >
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="parentGroup"
                className="text-[10px] font-black uppercase tracking-widest text-gray-400"
              >
                Parent Hierarchy (Optional)
              </Label>
              <Select
                value={groupParentId || "none"}
                onValueChange={(val) =>
                  setGroupParentId(val === "none" ? null : val)
                }
              >
                <SelectTrigger className="rounded-none border-gray-200 text-[10px] font-bold uppercase tracking-wider">
                  <SelectValue placeholder="ROOT LEVEL (NO PARENT)" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-gray-200">
                  <SelectItem
                    value="none"
                    className="text-[10px] font-bold uppercase tracking-wider"
                  >
                    ROOT LEVEL (NO PARENT)
                  </SelectItem>
                  {allGroups.map((group: any) => (
                    <SelectItem
                      key={group.id}
                      value={group.id}
                      className="text-[10px] font-bold uppercase tracking-wider"
                    >
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-[10px] font-black uppercase tracking-[0.2em] shadow-none"
              >
                {isSubmitting ? "PROCESSING..." : "CONFIRM & SAVE GROUP"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Account Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-black text-white px-6 h-10 font-black text-[10px] uppercase tracking-widest shadow-none hover:bg-gray-800">
            <Plus className="mr-2 h-3.5 w-3.5" /> Add Account
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Ledger Account</DialogTitle>
            <DialogDescription>
              DEFINE A NEW SPECIFIC LEDGER UNDER THE SELECTED GROUP
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAccount} className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="code"
                  className="text-[10px] font-black uppercase tracking-widest text-gray-400"
                >
                  Entity Code
                </Label>
                <Input
                  id="code"
                  value={accountCode}
                  onChange={(e) => setAccountCode(e.target.value)}
                  placeholder="E.G. 1001"
                  className="font-mono"
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="group"
                  className="text-[10px] font-black uppercase tracking-widest text-gray-400"
                >
                  Target Group
                </Label>
                <Select
                  value={accountGroupId}
                  onValueChange={setAccountGroupId}
                >
                  <SelectTrigger className="rounded-none border-gray-200 text-[10px] font-bold uppercase tracking-wider">
                    <SelectValue placeholder="SELECT GROUP" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-gray-200">
                    {allGroups.map((group: any) => (
                      <SelectItem
                        key={group.id}
                        value={group.id}
                        className="text-[10px] font-bold uppercase tracking-wider"
                      >
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="accName"
                className="text-[10px] font-black uppercase tracking-widest text-gray-400"
              >
                Account Designation
              </Label>
              <Input
                id="accName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="E.G. PETTY CASH, BANK REVENUE"
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="desc"
                className="text-[10px] font-black uppercase tracking-widest text-gray-400"
              >
                Internal Memo (Optional)
              </Label>
              <Input
                id="desc"
                value={accountDescription}
                onChange={(e) => setAccountDescription(e.target.value)}
                placeholder="SPECIFY THE PURPOSE OF THIS LEDGER"
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-[10px] font-black uppercase tracking-[0.2em] shadow-none"
              >
                {isSubmitting ? "PROCESSING..." : "FINALIZE LEDGER ENTRY"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
