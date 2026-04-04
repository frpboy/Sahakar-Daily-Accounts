"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { dailyEntrySchema, DailyEntryInput } from "@/lib/validations/entry";
import { submitDailyAccount } from "@/lib/actions/accounts";
import {
  calculateTotalSales,
  formatCurrency,
  cn,
  getISTDate,
} from "@/lib/utils";

interface DailyEntryFormProps {
  outlets: Array<{ id: string; name: string }>;
  defaultOutletId?: string;
  isAdmin?: boolean;
}

export function DailyEntryForm({
  outlets,
  defaultOutletId,
  isAdmin = false,
}: DailyEntryFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [isTally, setIsTally] = useState<boolean | null>(null);
  const [entryExists, setEntryExists] = useState(false);
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);

  const form = useForm<DailyEntryInput>({
    resolver: zodResolver(dailyEntrySchema),
    defaultValues: {
      date: getISTDate(),
      outletId: defaultOutletId || "",
      totalSalesAmount: 0,
      saleCash: 0,
      saleUpi: 0,
      saleCredit: 0,
      saleReturn: 0,
      expenses: 0,
      purchase: 0,
      closingStock: 0,
    },
  });

  const cash = form.watch("saleCash");
  const upi = form.watch("saleUpi");
  const credit = form.watch("saleCredit");
  const totalSalesAmount = form.watch("totalSalesAmount");
  const watchedDate = form.watch("date");
  const watchedOutletId = form.watch("outletId");

  // Check if an entry already exists for the selected date + outlet
  useEffect(() => {
    const outletId = watchedOutletId || defaultOutletId;
    if (!watchedDate || !outletId) return;

    const dateStr =
      watchedDate instanceof Date
        ? watchedDate.toISOString().split("T")[0]
        : "";
    if (!dateStr) return;

    setOverwriteConfirmed(false);
    fetch(`/api/all-reports?outletId=${outletId}&startDate=${dateStr}&endDate=${dateStr}`)
      .then((r) => r.json())
      .then((rows) => setEntryExists(Array.isArray(rows) && rows.length > 0))
      .catch(() => setEntryExists(false));
  }, [watchedDate, watchedOutletId, defaultOutletId]);

  useEffect(() => {
    const total = calculateTotalSales(cash ?? 0, upi ?? 0, credit ?? 0);
    setPaymentTotal(total);

    if (totalSalesAmount > 0) {
      const tallyStatus = Math.abs(total - totalSalesAmount) < 0.01;
      setIsTally(tallyStatus);
      if (tallyStatus) {
        toast.success("Amount is tally! All payments received.");
      } else {
        toast.error(
          "Amount mismatch! Payment total doesn't match the total sales."
        );
      }
    } else {
      setIsTally(null);
    }
  }, [cash, upi, credit, totalSalesAmount]);

  async function onSubmit(values: DailyEntryInput) {
    if (entryExists && !overwriteConfirmed) return;
    setIsLoading(true);
    try {
      const result = await submitDailyAccount(values);

      if (result.success) {
        toast.success(result.message || "Entry saved successfully!");
        form.reset({
          date: new Date(),
          outletId: values.outletId,
          totalSalesAmount: 0,
          saleCash: 0,
          saleUpi: 0,
          saleCredit: 0,
          saleReturn: 0,
          expenses: 0,
          purchase: 0,
          closingStock: 0,
        });
        setIsTally(null);
        setEntryExists(false);
        setOverwriteConfirmed(false);
      } else {
        toast.error(result.error || "Failed to save entry");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b pb-4 mb-4">
        <CardTitle className="text-xl font-bold">Daily Entry Form</CardTitle>
        <CardDescription className="text-gray-500">
          Enter the daily sales and expense figures for your outlet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Date & Outlet Selection */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold uppercase tracking-wider text-gray-700">
                      Date
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={
                          field.value instanceof Date
                            ? field.value.toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) => {
                          const [y, m, d] = e.target.value
                            .split("-")
                            .map(Number);
                          field.onChange(new Date(y, m - 1, d));
                        }}
                        className="rounded-sm border-gray-200 focus:border-black focus:ring-black"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAdmin && (
                <FormField
                  control={form.control}
                  name="outletId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold uppercase tracking-wider text-gray-700">
                        Outlet
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-sm border-gray-200 focus:ring-black">
                            <SelectValue placeholder="Select outlet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {outlets.map((outlet) => (
                            <SelectItem key={outlet.id} value={outlet.id}>
                              {outlet.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Total Sales Amount Section - Enterprise Minimalist */}
            <div
              className={cn(
                "rounded-md border p-6 transition-colors duration-200",
                isTally === false
                  ? "border-red-500 bg-red-50/50"
                  : isTally === true
                    ? "border-emerald-500 bg-emerald-50/30"
                    : "border-gray-200 bg-gray-50/30"
              )}
            >
              <div className="mb-4">
                <h3
                  className={cn(
                    "text-lg font-bold uppercase tracking-tight",
                    isTally === false
                      ? "text-red-700"
                      : isTally === true
                        ? "text-emerald-700"
                        : "text-gray-900"
                  )}
                >
                  Total Sales Amount
                </h3>
                <p className="text-xs text-gray-500 uppercase font-medium">
                  Financial Control Point
                </p>
              </div>
              <FormField
                control={form.control}
                name="totalSalesAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-gray-600">
                      Amount Calculated from Sales Report
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">
                          ₹
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className={cn(
                            "pl-8 rounded-sm text-2xl h-14 font-mono transition-all",
                            isTally === false
                              ? "border-red-400 bg-white text-red-700 focus:border-red-600 focus:ring-red-600"
                              : "border-gray-200 bg-white focus:border-black focus:ring-black"
                          )}
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber || 0)
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isTally === true && (
                <div className="mt-3 flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-bold uppercase text-xs tracking-widest">
                    Amount is Tally!
                  </span>
                </div>
              )}
              {isTally === false && (
                <div className="mt-3 flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-bold uppercase text-xs tracking-widest">
                    Amount Mismatch!
                  </span>
                </div>
              )}
            </div>

            {/* Payment Methods Section */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">
                    Payment Methods
                  </h3>
                  <p className="text-xs text-gray-500">
                    Breakdown of collections
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="saleCash"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700">
                        CASH
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">
                            ₹
                          </span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            className="pl-6 font-mono rounded-sm focus:border-black focus:ring-black"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber || 0)
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="saleUpi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700">
                        UPI / DIGITAL
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">
                            ₹
                          </span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            className="pl-6 font-mono rounded-sm focus:border-black focus:ring-black"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber || 0)
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="saleCredit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700">
                        CREDIT / PENDING
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">
                            ₹
                          </span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            className="pl-6 font-mono rounded-sm focus:border-black focus:ring-black"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber || 0)
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Payment Total Display - High Contrast */}
              <div className="rounded-sm border border-gray-200 bg-white p-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      Payment Total
                    </p>
                    <p className="text-3xl tabular-nums font-bold tracking-tight text-black mt-1">
                      {formatCurrency(paymentTotal)}
                    </p>
                  </div>
                  {totalSalesAmount > 0 && (
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        Difference
                      </p>
                      <p
                        className={cn(
                          "text-xl tabular-nums font-bold mt-1",
                          Math.abs(paymentTotal - totalSalesAmount) < 0.01
                            ? "text-emerald-600"
                            : "text-red-600 bg-red-100/50 px-2 rounded-sm"
                        )}
                      >
                        {formatCurrency(totalSalesAmount - paymentTotal)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Operational Section */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">
                Operations
              </h3>
              <div className="grid gap-4 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="saleReturn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-red-600">
                        SALES RETURN
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">
                            ₹
                          </span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            className="pl-6 font-mono rounded-sm focus:border-red-400 focus:ring-red-400"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber || 0)
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700">
                        EXPENSES
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">
                            ₹
                          </span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="0"
                            className="pl-6 font-mono rounded-sm focus:border-black focus:ring-black"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber || 0)
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700">
                        PURCHASE
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">
                            ₹
                          </span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="0"
                            className="pl-6 font-mono rounded-sm focus:border-black focus:ring-black"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber || 0)
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="closingStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700">
                        CLOSING STOCK
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">
                            ₹
                          </span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="0"
                            className="pl-6 font-mono rounded-sm focus:border-black focus:ring-black"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber || 0)
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Overwrite warning */}
            {entryExists && !overwriteConfirmed && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 flex items-start justify-between gap-4">
                <p className="text-sm text-amber-800 font-medium">
                  An entry already exists for this date. Submitting will overwrite it.
                </p>
                <button
                  type="button"
                  onClick={() => setOverwriteConfirmed(true)}
                  className="shrink-0 text-sm font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700"
                >
                  Yes, overwrite
                </button>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-100">
              <Button
                type="submit"
                disabled={isLoading || (entryExists && !overwriteConfirmed)}
                size="lg"
                className={cn(
                  "min-w-[200px] rounded-sm font-bold uppercase tracking-widest transition-all",
                  isTally === false
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-black hover:bg-zinc-800 text-white"
                )}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Saving..." : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
