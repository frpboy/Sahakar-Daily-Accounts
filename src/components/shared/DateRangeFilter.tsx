"use client";

import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns";

interface DateRangeFilterProps {
  onRangeChange: (from: Date, to: Date) => void;
  initialLabel?: string;
}

export function DateRangeFilter({ onRangeChange, initialLabel = "Last 30 Days" }: DateRangeFilterProps) {
  const [label, setLabel] = useState(initialLabel);

  const ranges = [
    { label: "Today", getValue: () => ({ from: new Date(), to: new Date() }) },
    { label: "Yesterday", getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
    { label: "Last 7 Days", getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
    { label: "Last 30 Days", getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
    { label: "This Month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
    { label: "This Year", getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
  ];

  const handleSelect = (range: typeof ranges[0]) => {
    setLabel(range.label);
    const { from, to } = range.getValue();
    onRangeChange(from, to);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 px-6 rounded-none border-gray-200 text-gray-900 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <span>{label}</span>
          <ChevronDown className="h-3 w-3 text-gray-300" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1 mt-2 border border-gray-200 shadow-2xl rounded-none bg-white">
        <div className="px-3 py-2 border-b border-gray-50 mb-1">
           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Select Timeframe</p>
        </div>
        <div className="grid grid-cols-1 gap-px">
          {ranges.map((range) => (
            <DropdownMenuItem 
              key={range.label}
              onClick={() => handleSelect(range)}
              className="text-[10px] font-black uppercase tracking-widest p-3 rounded-none cursor-pointer transition-colors focus:bg-gray-900 focus:text-white flex items-center justify-between group"
            >
              {range.label}
              <div className="h-1.5 w-1.5 rounded-none bg-gray-100 group-focus:bg-white/40" />
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
