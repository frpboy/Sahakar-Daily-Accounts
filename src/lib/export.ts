/**
 * Utility functions for exporting data to various formats.
 */

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];

  csvRows.push(headers.join(","));

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      const escaped = ("" + value).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportToPDF(elementId: string, filename: string) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const table = document.getElementById(elementId)?.querySelector("table");
  if (!table) {
    console.error(`[exportToPDF] No <table> found inside #${elementId}`);
    return;
  }

  // Extract headers
  const headers: string[] = [];
  table.querySelectorAll("thead th").forEach((th) => {
    headers.push(th.textContent?.trim() ?? "");
  });

  // Extract rows — replace ₹ with Rs. because jsPDF's built-in Helvetica
  // font does not include the Rupee glyph (U+20B9) and renders it as "1"
  const rows: string[][] = [];
  table.querySelectorAll("tbody tr").forEach((tr) => {
    const row: string[] = [];
    tr.querySelectorAll("td").forEach((td) => {
      row.push((td.textContent?.trim() ?? "").replace(/₹/g, "Rs."));
    });
    if (row.length > 0) rows.push(row);
  });

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(14);
  doc.text(filename, 14, 15);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 22,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename}.pdf`);
}
