export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

interface SalesDay {
  date: string;
  cash: number;
  upi: number;
  credit: number;
  expenses: number;
  purchase: number;
  closingStock: number;
}

export function randomSalesData(days: number, isClinic: boolean): SalesDay[] {
  const data: SalesDay[] = [];
  const today = new Date();

  const baseRevenue = isClinic ? 15000 : 25000;
  const revenueVariance = isClinic ? 8000 : 12000;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const totalSales =
      baseRevenue + Math.floor(Math.random() * revenueVariance);

    const cashRatio = 0.35 + Math.random() * 0.15;
    const upiRatio = 0.45 + Math.random() * 0.15;
    const creditRatio = 1 - cashRatio - upiRatio;

    const cash = Math.round(totalSales * cashRatio * 100) / 100;
    const upi = Math.round(totalSales * upiRatio * 100) / 100;
    const credit = Math.round(totalSales * creditRatio * 100) / 100;

    const expenses =
      Math.round(totalSales * (0.08 + Math.random() * 0.06) * 100) / 100;
    const purchase =
      Math.round(totalSales * (0.15 + Math.random() * 0.1) * 100) / 100;
    const closingStock =
      Math.round(totalSales * (0.05 + Math.random() * 0.1) * 100) / 100;

    data.push({
      date: formatDate(date),
      cash,
      upi,
      credit,
      expenses,
      purchase,
      closingStock,
    });
  }

  return data;
}
