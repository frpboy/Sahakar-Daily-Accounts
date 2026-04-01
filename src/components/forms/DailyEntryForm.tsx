"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [totalSales, setTotalSales] = useState(0);

  const form = useForm<DailyEntryInput>({
    resolver: zodResolver(dailyEntrySchema),
    defaultValues: {
      date: new Date(),
      outletId: defaultOutletId || "",
      saleCash: 0,
      saleUpi: 0,
      saleCredit: 0,
      expenses: 0,
      purchase: 0,
      closingStock: 0,
    },
  });

  // Watch sales fields to calculate total
  const cash = form.watch("saleCash");
  const upi = form.watch("saleUpi");
  const credit = form.watch("saleCredit");

  React.useEffect(() => {
    setTotalSales(calculateTotalSales(cash ?? 0, upi ?? 0, credit ?? 0));
  }, [cash, upi, credit]);

  async function onSubmit(values: DailyEntryInput) {
    setIsLoading(true);
    try {
      const result = await submitDailyAccount(values);

      if (result.success) {
        toast.success(result.message || "Entry saved successfully!");
        form.reset({
          date: new Date(),
          outletId: values.outletId,
          saleCash: 0,
          saleUpi: 0,
          saleCredit: 0,
          expenses: 0,
          purchase: 0,
          closingStock: 0,
        });
      } else {
        toast.error(result.error || "Failed to save entry");
      }
    } catch (error) {
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
                      <Select value={field.value} onValueChange={field.onChange}>
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

            {/* Sales Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sales</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="saleCash"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale by Cash</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                      <FormLabel>Sale by UPI</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                      <FormLabel>Sale by Credit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Total Sales Display */}
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
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
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isLoading} size="lg" className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Saving..." : "Submit Entry"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
