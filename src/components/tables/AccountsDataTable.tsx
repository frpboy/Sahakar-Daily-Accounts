"use client";

import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

export interface DailyAccountRow {
  id: string;
  date: string;
  outletName: string;
  saleCash: number;
  saleUpi: number;
  saleCredit: number;
  totalSales: number;
  expenses: number;
  purchase: number;
  closingStock: number;
  profit: number;
}

interface DataTableProps {
  data: DailyAccountRow[];
  isLoading?: boolean;
}

export function AccountsDataTable({ data, isLoading }: DataTableProps) {
  const columns: ColumnDef<DailyAccountRow>[] = useMemo(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: (info) => (
          <span className="font-mono">{formatDate(info.getValue() as string).toUpperCase()}</span>
        ),
        size: 100,
      },
      {
        accessorKey: "outletName",
        header: "Outlet",
        size: 150,
      },
      {
        accessorKey: "saleCash",
        header: "Cash",
        cell: (info) => formatCurrency(info.getValue() as number),
        size: 100,
      },
      {
        accessorKey: "saleUpi",
        header: "UPI",
        cell: (info) => formatCurrency(info.getValue() as number),
        size: 100,
      },
      {
        accessorKey: "saleCredit",
        header: "Credit",
        cell: (info) => formatCurrency(info.getValue() as number),
        size: 100,
      },
      {
        accessorKey: "totalSales",
        header: "Total Sales",
        cell: (info) => formatCurrency(info.getValue() as number),
        size: 120,
      },
      {
        accessorKey: "expenses",
        header: "Expenses",
        cell: (info) => formatCurrency(info.getValue() as number),
        size: 100,
      },
      {
        accessorKey: "purchase",
        header: "Purchase",
        cell: (info) => formatCurrency(info.getValue() as number),
        size: 100,
      },
      {
        accessorKey: "closingStock",
        header: "Closing Stock",
        cell: (info) => formatCurrency(info.getValue() as number),
        size: 120,
      },
      {
        id: "profit",
        accessorKey: "profit",
        header: "Profit/Loss",
        cell: (info) => {
          const profit = info.getValue() as number;
          const isPositive = profit >= 0;
          return (
            <span className={cn(
               "font-bold font-mono px-2 py-0.5 rounded-sm",
               isPositive ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
            )}>
              {formatCurrency(profit)}
            </span>
          );
        },
        size: 120,
      },
    ],
    []
  );

  // TanStack table intentionally uses non-memoizable internals; this warning is expected.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading data...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data found. Create your first entry!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-sm border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-300">
          <Table className="border-collapse">
            <TableHeader className="sticky top-0 bg-gray-50 z-10 shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-gray-200 hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id} 
                      className="h-10 px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap align-middle"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id} 
                      className={cn(
                        "px-4 py-2 text-sm text-gray-700 whitespace-nowrap",
                        cell.column.id !== "outletName" && cell.column.id !== "date" ? "font-mono text-right" : ""
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
