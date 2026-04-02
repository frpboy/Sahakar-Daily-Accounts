"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Stethoscope, Loader2 } from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { useRouter } from "next/navigation";

interface OutletCreationModalProps {
  type: "Hyper Pharmacy" | "Smart Clinic";
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OutletCreationModal({
  type,
  isOpen,
  onClose,
  onSuccess,
}: OutletCreationModalProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      notifyError("Please enter an outlet name");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/outlets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location, type }),
      });

      if (response.ok) {
        notifySuccess(`${type} created successfully!`);
        setName("");
        setLocation("");
        onSuccess();
        onClose();
        router.refresh();
      } else {
        const error = await response.json();
        notifyError(error.error || "Failed to create outlet");
      }
    } catch {
      notifyError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-none border border-gray-200 shadow-2xl p-8">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="h-20 w-20 bg-gray-900 text-white rounded-none flex items-center justify-center shadow-lg">
              {type === "Hyper Pharmacy" ? (
                <Building2 className="h-10 w-10" />
              ) : (
                <Stethoscope className="h-10 w-10" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] leading-none">
                Terminal Initialization
              </p>
              <DialogTitle className="text-2xl font-black text-gray-900 tracking-tighter uppercase">
                New {type}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-8">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-0"
              >
                Branch Descriptor
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`SAHAKAR ${type.toUpperCase()} - AREA`}
                className="h-12 bg-white border border-gray-200 rounded-none font-bold text-gray-900 placeholder:text-gray-300 focus-visible:ring-1 focus-visible:ring-gray-900 transition-all px-4"
                required
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="location"
                className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-0"
              >
                Geographic Pointer
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="REGIONAL CENTER"
                className="h-12 bg-white border border-gray-200 rounded-none font-bold text-gray-900 placeholder:text-gray-300 focus-visible:ring-1 focus-visible:ring-gray-900 transition-all px-4"
                required
              />
            </div>
            <div className="bg-gray-50 rounded-none p-5 border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                  System Allocation Hash
                </p>
                <p className="font-mono text-xs font-black text-gray-900 tracking-[0.2em]">
                  {type === "Hyper Pharmacy" ? "SHP-###" : "SSC-###"}
                </p>
              </div>
              <div
                className={`h-2.5 w-2.5 ${type === "Hyper Pharmacy" ? "bg-gray-900" : "bg-gray-400"} animate-pulse`}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 mt-10">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-none bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-none hover:bg-gray-800 transition-all"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `Execute Provisioning`
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full h-12 rounded-none border-gray-200 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
            >
              Cancel Operation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
