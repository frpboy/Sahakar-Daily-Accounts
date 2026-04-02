import { describe, it, expect } from "vitest";
import {
  calculateTotalSales,
  calculateProfit,
  formatCurrency,
  getISTDate,
} from "./utils";

describe("Utility Functions", () => {
  describe("calculateTotalSales", () => {
    it("should sum cash, upi, and credit correctly", () => {
      expect(calculateTotalSales(100, 200, 300)).toBe(600);
    });

    it("should return 0 for all zeros", () => {
      expect(calculateTotalSales(0, 0, 0)).toBe(0);
    });

    it("should handle decimal values", () => {
      expect(calculateTotalSales(10.5, 20.25, 30.75)).toBe(61.5);
    });
  });

  describe("calculateProfit", () => {
    it("should subtract expenses and purchase from total sales", () => {
      expect(calculateProfit(1000, 200, 300)).toBe(500);
    });

    it("should return negative when expenses exceed sales", () => {
      expect(calculateProfit(100, 200, 50)).toBe(-150);
    });

    it("should return total sales when no expenses or purchase", () => {
      expect(calculateProfit(500, 0, 0)).toBe(500);
    });
  });

  describe("formatCurrency", () => {
    it("should format numbers as INR currency", () => {
      const result = formatCurrency(1000);
      expect(result).toContain("₹");
      expect(result).toContain("1,000.00");
    });

    it("should handle string inputs", () => {
      const result = formatCurrency("500");
      expect(result).toContain("500.00");
    });

    it("should format decimals correctly", () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain("1,234.56");
    });
  });

  describe("getISTDate", () => {
    it("should return a Date object", () => {
      const result = getISTDate();
      expect(result).toBeInstanceOf(Date);
    });

    it("should be close to current IST time", () => {
      const result = getISTDate();
      const now = new Date();
      const diff = Math.abs(result.getTime() - now.getTime());
      expect(diff).toBeLessThan(60000);
    });
  });
});
