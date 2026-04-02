"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { formatCurrency } from "@/lib/utils";
import { Plus, Building2, Hash, ChevronRight } from "lucide-react";
import Link from "next/link";
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
import { toast } from "sonner";

interface OutletStats {
  id: string;
  name: string;
  code: string;
  totalSales: number;
  totalExpenses: number;
  entriesCount: number;
}

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<OutletStats[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newType, setNewType] = useState<"Pharmacy" | "Clinic">("Pharmacy");

  useEffect(() => {
    fetchOutlets();
  }, []);

  async function fetchOutlets() {
    try {
      const response = await fetch("/api/outlets-stats");
      if (response.ok) {
        const data = await response.json();
        setOutlets(data);
      }
    } catch (error) {
      console.error("Failed to fetch outlets:", error);
    } finally {
      setIsDataLoading(false);
    }
  }

  async function handleCreateOutlet(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/outlets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          location: newLocation,
          type: newType,
        }),
      });

      if (response.ok) {
        toast.success(`${newType} outlet created successfully!`);
        setNewName("");
        setNewLocation("");
        setIsDialogOpen(false);
        fetchOutlets();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to create outlet");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Container className="py-10 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-gray-200 pb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
            System Outlets
          </h1>
          <div className="flex items-center gap-2">
            <span className="h-1 w-12 bg-emerald-500" />
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">
              Enterprise Branch Management & Asset Performance
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 px-8 bg-gray-900 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all rounded-none shadow-none border-none">
              <Plus className="mr-3 h-4 w-4 stroke-[3]" /> Add New Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white border border-gray-200 shadow-none rounded-none p-10 focus-visible:outline-none">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">
                Registration
              </DialogTitle>
              <DialogDescription className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                Enterprise branch provisioning. Automated ID generation
                activated.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateOutlet} className="space-y-8 pt-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                    Business Type
                  </Label>
                  <Select
                    value={newType}
                    onValueChange={(v: any) => setNewType(v)}
                  >
                    <SelectTrigger className="h-12 border-gray-200 bg-gray-50/50 rounded-none focus:ring-1 focus:ring-gray-900 font-bold text-xs uppercase tracking-tight">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-gray-200">
                      <SelectItem
                        value="Pharmacy"
                        className="text-xs font-bold"
                      >
                        HYPER PHARMACY (SHP)
                      </SelectItem>
                      <SelectItem value="Clinic" className="text-xs font-bold">
                        SMART CLINIC (SSC)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                    Outlet Name
                  </Label>
                  <Input
                    placeholder="E.G. MANJERI MAIN HUB"
                    className="h-12 border-gray-200 bg-gray-50/50 rounded-none focus:ring-1 focus:ring-gray-900 font-bold text-xs uppercase"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                    Location Code/Name
                  </Label>
                  <Input
                    placeholder="E.G. MANJERI TOWN"
                    className="h-12 border-gray-200 bg-gray-50/50 rounded-none focus:ring-1 focus:ring-gray-900 font-bold text-xs uppercase"
                    value={newLocation}
                    onChange={(e) =>
                      setNewLocation(e.target.value.toUpperCase())
                    }
                  />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="w-full h-14 bg-gray-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-none hover:bg-emerald-600 transition-all rounded-none"
                >
                  {isCreating ? "Initializing..." : "Authorize Creation"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isDataLoading ? (
        <div className="flex justify-center py-32 border border-dashed border-gray-200">
          <div className="space-y-5 text-center">
            <div className="h-1.5 w-32 bg-gray-100 mx-auto overflow-hidden">
              <div className="h-full bg-emerald-500 animate-[loading_1s_infinite_linear] w-1/2" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">
              Syncing Intelligence
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-0 border-l border-t border-gray-200 md:grid-cols-2 lg:grid-cols-3">
          {outlets.map((outlet) => (
            <Link
              key={outlet.id}
              href={`/outlets/${outlet.id}`}
              className="group"
            >
              <div className="h-full border-r border-b border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300 p-8 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-gray-900 text-white rounded-none group-hover:bg-emerald-600 transition-colors">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <span className="text-[9px] font-black text-gray-400 bg-gray-50 px-3 py-1 tracking-[0.2em] border border-gray-200 uppercase">
                      {outlet.code || "PENDING ID"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black tracking-tighter text-gray-900 uppercase italic leading-tight">
                      {outlet.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <Hash className="h-3 w-3 text-emerald-500" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        {outlet.entriesCount} ACTIVE DATA POINTS
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-10 space-y-4">
                  <div className="grid grid-cols-2 border border-gray-200 divide-x divide-gray-200">
                    <div className="p-4 space-y-1 bg-gray-50/50">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        Revenue
                      </p>
                      <p className="text-sm font-black font-mono text-gray-900">
                        {formatCurrency(outlet.totalSales)}
                      </p>
                    </div>
                    <div className="p-4 space-y-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        Net Index
                      </p>
                      <p
                        className={`text-sm font-black font-mono ${outlet.totalSales - outlet.totalExpenses >= 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {formatCurrency(
                          outlet.totalSales - outlet.totalExpenses
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end group/btn pt-2 cursor-pointer">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover/btn:text-gray-900 transition-colors mr-2">
                      Access Ledger
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover/btn:text-emerald-500 transition-all translate-x-0 group-hover/btn:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </Container>
  );
}
