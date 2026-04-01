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
import { formatCurrency, formatDate } from "@/lib/utils";

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
        cell: (info) => formatDate(info.getValue() as string),
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
        accessorKey: "profit",
        header: "Profit",
        cell: (info) => {
          const profit = info.getValue() as number;
          const isPositive = profit >= 0;
          return (
            <span className={isPositive ? "text-green-600" : "text-red-600"}>
              {formatCurrency(profit)}
            </span>
          );
        },
        size: 100,
      },
    ],
    []
  );

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
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
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
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
