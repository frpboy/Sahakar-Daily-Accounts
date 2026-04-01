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
import { calculateTotalSales, formatCurrency } from "@/lib/utils";

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

  const form = useForm<DailyEntryInput>({
    resolver: zodResolver(dailyEntrySchema),
    defaultValues: {
      date: new Date(),
      outletId: defaultOutletId || "",
      totalSalesAmount: 0,
      saleCash: 0,
      saleUpi: 0,
      saleCredit: 0,
      expenses: 0,
      purchase: 0,
      closingStock: 0,
    },
  });

  const cash = form.watch("saleCash");
  const upi = form.watch("saleUpi");
  const credit = form.watch("saleCredit");
  const totalSalesAmount = form.watch("totalSalesAmount");

  useEffect(() => {
    const total = calculateTotalSales(cash ?? 0, upi ?? 0, credit ?? 0);
    setPaymentTotal(total);

    if (totalSalesAmount > 0) {
      const tallyStatus = Math.abs(total - totalSalesAmount) < 0.01;
      setIsTally(tallyStatus);
      if (tallyStatus) {
        toast.success("Amount is tally! All payments received.", {
          icon: <CheckCircle2 className="h-4 w-4" />,
        });
      } else {
        toast.error(
          "Amount mismatch! Payment total doesn't match the total sales.",
          {
            icon: <AlertCircle className="h-4 w-4" />,
            duration: 2000,
          }
        );
      }
    } else {
      setIsTally(null);
    }
  }, [cash, upi, credit, totalSalesAmount]);

  async function onSubmit(values: DailyEntryInput) {
    const total = calculateTotalSales(
      values.saleCash,
      values.saleUpi,
      values.saleCredit
    );

    if (
      values.totalSalesAmount > 0 &&
      Math.abs(total - values.totalSalesAmount) >= 0.01
    ) {
      toast.error("Cannot submit! Payment amounts don't match total sales.");
      return;
    }

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
          expenses: 0,
          purchase: 0,
          closingStock: 0,
        });
        setIsTally(null);
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
    <Card>
      <CardHeader>
        <CardTitle>Daily Entry Form</CardTitle>
        <CardDescription>
          Enter your daily outlet account details
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
                    <FormLabel>Date</FormLabel>
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
                          field.onChange(new Date(e.target.value));
                        }}
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
                      <FormLabel>Outlet</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
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

            {/* Total Sales Amount Section - Red Box */}
            <div className="rounded-lg border-2 border-red-500 bg-red-50 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-red-700">
                  Total Sales Amount
                </h3>
                <p className="text-sm text-red-600">
                  Enter the total amount gained from sales
                </p>
              </div>
              <FormField
                control={form.control}
                name="totalSalesAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-red-700">
                      Total Amount (₹)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="border-red-300 bg-white text-lg font-semibold focus:border-red-500"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isTally === true && (
                <div className="mt-3 flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Amount is tally!</span>
                </div>
              )}
              {isTally === false && (
                <div className="mt-3 flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Amount mismatch!</span>
                </div>
              )}
            </div>

            {/* Payment Methods Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Methods</h3>
              <p className="text-sm text-muted-foreground">
                Enter the payment received from different methods
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="saleCash"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cash</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
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
                      <FormLabel>UPI</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
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
                      <FormLabel>Credit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Payment Total Display */}
              <div className="rounded-lg bg-muted p-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Payment Total</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(paymentTotal)}
                  </p>
                </div>
                {totalSalesAmount > 0 && (
                  <div className="mt-2 flex justify-between items-center border-t pt-2">
                    <p className="text-sm text-muted-foreground">Difference</p>
                    <p
                      className={`text-lg font-semibold ${Math.abs(paymentTotal - totalSalesAmount) < 0.01 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(totalSalesAmount - paymentTotal)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Operational Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Operations</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="expenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expenses</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
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
                      <FormLabel>Purchase</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
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
                      <FormLabel>Closing Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full"
              variant={isTally === false ? "destructive" : "default"}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Saving..." : "Submit Entry"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
