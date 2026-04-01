"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Building2, Stethoscope, Store } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CreateOutletDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    type: "Pharmacy"
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch("/api/outlets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success("Outlet created successfully");
        setOpen(false);
        router.refresh();
        window.location.reload(); 
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create outlet");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 md:h-12 px-6 bg-gray-900 text-white font-bold hover:scale-[1.02] transition-all gap-2 rounded-xl text-xs uppercase tracking-widest shadow-lg">
          <Plus className="h-4 w-4" /> New Outlet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-blue-600 p-8 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
               <Building2 className="h-6 w-6" />
               Create New Outlet
            </DialogTitle>
            <p className="text-blue-100 font-medium">Add a new pharmacy or clinic to the platform</p>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-black uppercase text-gray-400 tracking-widest">Outlet Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. Sahakar Hyper Pharmacy - Calicut" 
                className="rounded-xl border-gray-100 bg-gray-50/50 focus:ring-blue-500 h-12"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs font-black uppercase text-gray-400 tracking-widest">Location</Label>
              <Input 
                id="location" 
                placeholder="e.g. Calicut Main Road" 
                className="rounded-xl border-gray-100 bg-gray-50/50 focus:ring-blue-500 h-12"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-gray-400 tracking-widest">Outlet Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: "Pharmacy"})}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                    formData.type === "Pharmacy" 
                      ? "border-blue-600 bg-blue-50 text-blue-600 shadow-sm" 
                      : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                  }`}
                >
                  <Store className="h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Pharmacy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: "Clinic"})}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                    formData.type === "Clinic" 
                      ? "border-blue-600 bg-blue-50 text-blue-600 shadow-sm" 
                      : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                  }`}
                >
                  <Stethoscope className="h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Clinic</span>
                </button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              disabled={loading}
            >
              {loading ? "Registering..." : "Create Outlet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
