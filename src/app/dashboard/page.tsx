import { getSessionContext } from "@/lib/auth-utils";
import AdminView from "@/components/dashboards/AdminView";
import HOAccountantView from "@/components/dashboards/HOAccountantView";
import OutletManagerView from "@/components/dashboards/OutletManagerView";
import OutletAccountantView from "@/components/dashboards/OutletAccountantView";
export default async function DashboardPage() {
  const { role, outletId } = await getSessionContext();

  let view;
  switch (role) {
    case "admin":
      view = <AdminView />;
      break;
    case "ho_accountant":
      view = <HOAccountantView />;
      break;
    case "outlet_manager":
      view = <OutletManagerView outletId={outletId} />;
      break;
    case "outlet_accountant":
      view = <OutletAccountantView outletId={outletId} />;
      break;
    default:
      view = <div className="p-8 text-center text-red-500 font-bold">Access Denied</div>;
  }

  return view;
}
