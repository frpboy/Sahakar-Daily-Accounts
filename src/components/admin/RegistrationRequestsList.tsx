"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserPlus, 
  Mail, 
  Phone,
  Shield,
  Building2
} from "lucide-react";
import { format } from "date-fns";
import { approveRequest, rejectRequest } from "@/lib/actions/users";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Request = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string | null;
  createdAt: Date | null;
};

type Outlet = {
  id: string;
  name: string;
};

interface RegistrationRequestsListProps {
  requests: Request[];
  outlets: Outlet[];
}

export function RegistrationRequestsList({ requests, outlets }: RegistrationRequestsListProps) {
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [role, setRole] = useState<"admin" | "ho_accountant" | "outlet_manager" | "outlet_accountant">("outlet_manager");
  const [outletId, setOutletId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const pendingRequests = requests.filter(r => r.status === "pending");

  const handleApproveClick = (request: Request) => {
    setSelectedRequest(request);
    setIsApproveOpen(true);
  };

  const onApprove = async () => {
    if (!selectedRequest) return;
    
    setLoading(true);
    try {
      const result = await approveRequest(selectedRequest.id, role, outletId || undefined);
      if (result.success) {
        const successMessage = 'message' in result ? result.message : "Request processed successfully";
        toast.success(successMessage);
        setIsApproveOpen(false);
        setSelectedRequest(null);
      } else {
        const errorMessage = 'error' in result ? result.error : "An unknown error occurred";
        toast.error(errorMessage);
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onReject = async (requestId: string) => {
    if (!confirm("Are you sure you want to reject this request?")) return;
    
    try {
      const result = await rejectRequest(requestId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Pending Requests ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {pendingRequests.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <UserPlus className="h-6 w-6 text-gray-300" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">No pending requests</h3>
                <p className="text-xs text-gray-500 mt-1">New user requests will appear here</p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{request.name}</h3>
                        <Badge variant="outline" className="text-[10px] font-normal py-0">
                          PENDING
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {request.email}
                        </span>
                        {request.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {request.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1 italic text-xs">
                          {request.createdAt ? `Requested ${format(new Date(request.createdAt), "dd MMM, hh:mm a")}` : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        className="bg-primary text-white hover:bg-primary/90 gap-1.5"
                        onClick={() => handleApproveClick(request)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1.5"
                        onClick={() => onReject(request.id)}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Approve User Request</DialogTitle>
            <DialogDescription>
              Assign a role and outlet to <strong>{selectedRequest?.name}</strong> to complete their registration.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                Assign Role
              </Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="ho_accountant">HO Accountant</SelectItem>
                  <SelectItem value="outlet_manager">Outlet Manager</SelectItem>
                  <SelectItem value="outlet_accountant">Outlet Accountant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(role === "outlet_manager" || role === "outlet_accountant") && (
              <div className="grid gap-2">
                <Label htmlFor="outlet" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  Assign Outlet
                </Label>
                <Select value={outletId} onValueChange={setOutletId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
            <Button 
              onClick={onApprove} 
              disabled={loading || ((role === "outlet_manager" || role === "outlet_accountant") && !outletId)}
            >
              {loading ? "Creating User..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
