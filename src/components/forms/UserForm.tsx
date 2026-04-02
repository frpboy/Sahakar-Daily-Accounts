"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createUser, updateUser } from "@/lib/actions/users";

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
import { Switch } from "@/components/ui/switch";

interface UserFormProps {
  outlets: Array<{ id: string; name: string }>;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    outletId: string | null;
    isActive: string;
  };
  onSuccess?: () => void;
}

const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum([
    "admin",
    "ho_accountant",
    "outlet_manager",
    "outlet_accountant",
  ]),
  outletId: z.string().optional(),
  isActive: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  ho_accountant: "HO Accountant",
  outlet_manager: "Outlet Manager",
  outlet_accountant: "Outlet Accountant",
};

export function UserForm({ outlets, user, onSuccess }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      role: (user?.role as UserFormValues["role"]) || "outlet_manager",
      outletId: user?.outletId || "",
      isActive: user?.isActive !== "false",
    },
  });

  const watchRole = form.watch("role");
  const requiresOutlet = ["outlet_manager", "outlet_accountant"].includes(
    watchRole
  );

  async function onSubmit(values: UserFormValues) {
    setIsLoading(true);
    try {
      const result = user
        ? await updateUser({
            id: user.id,
            name: values.name,
            email: values.email,
            phone: values.phone,
            role: values.role,
            outletId: values.outletId || undefined,
            isActive: values.isActive,
          })
        : await createUser({
            name: values.name,
            email: values.email,
            phone: values.phone,
            role: values.role,
            outletId: values.outletId || undefined,
          });

      if (result.success) {
        toast.success(result.message || "User saved successfully!");
        if (!user) {
          form.reset();
        }
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to save user");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+91 9876543210" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="outletId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch/Outlet {requiresOutlet && "*"}</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={!requiresOutlet}
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
              {requiresOutlet && (
                <p className="text-sm text-muted-foreground">
                  Required for {ROLE_LABELS[watchRole]} role
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {user && (
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Active Status</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Deactivate to disable user access
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Saving..." : user ? "Update User" : "Create User"}
        </Button>
      </form>
    </Form>
  );
}
