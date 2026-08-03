import { jsPDF } from "jspdf";

/**
 * Enterprise B2B Export Utility (CSV / PDF)
 * Designed for senior analyst requirements: low footprint, strict escaping, and clean formatting.
 */
export const ExportUtility = {
  /**
   * Safely formats and triggers a CSV spreadsheet download.
   */
  exportCSV(headers: string[], data: (string | number)[][], filename: string): void {
    const escapeCsv = (val: string | number) => {
      const str = String(val ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = headers.map(escapeCsv).join(",");
    const bodyLines = data.map(row => row.map(escapeCsv).join(","));
    const content = "\ufeff" + [headerLine, ...bodyLines].join("\r\n"); // UTF-8 BOM
    
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Generates a clean PDF ledger document using jsPDF.
   * Leverages vanilla grid line placement to keep implementation concise (< 150 lines).
   */
  exportPDF(title: string, headers: string[], data: (string | number)[][], filename: string): void {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Draw Document Title & Metas
    doc.setFont("courier", "bold");
    doc.setFontSize(16);
    doc.text(title.toUpperCase(), margin, 15);
    
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text(`GENERATED AT: ${new Date().toISOString()}`, margin, 20);
    doc.line(margin, 22, pageWidth - margin, 22);

    // Calculate grid dimensions
    const colCount = headers.length;
    const colWidth = (pageWidth - (margin * 2)) / colCount;
    
    let yPosition = 28;
    const rowHeight = 8;
    const textOffset = 5;

    // Draw Header Row
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(margin, yPosition - 4, pageWidth - (margin * 2), rowHeight, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("courier", "bold");
    doc.setFontSize(8);

    headers.forEach((header, index) => {
      doc.text(header.substring(0, Math.floor(colWidth / 2)), margin + (index * colWidth) + 2, yPosition);
    });

    yPosition += rowHeight;
    doc.setTextColor(0, 0, 0);
    doc.setFont("courier", "normal");

    // Draw Data Rows
    data.forEach((row, rowIndex) => {
      // Check page overflow
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = 20;
        
        // Redraw table headers on new page
        doc.setFillColor(30, 41, 59);
        doc.rect(margin, yPosition - 4, pageWidth - (margin * 2), rowHeight, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("courier", "bold");
        headers.forEach((header, index) => {
          doc.text(header.substring(0, Math.floor(colWidth / 2)), margin + (index * colWidth) + 2, yPosition);
        });
        yPosition += rowHeight;
        doc.setTextColor(0, 0, 0);
        doc.setFont("courier", "normal");
      }

      // Alternating row background shading
      if (rowIndex % 2 === 1) {
        doc.setFillColor(241, 245, 249); // Slate-100
        doc.rect(margin, yPosition - 4, pageWidth - (margin * 2), rowHeight, "F");
      }

      row.forEach((cell, cellIndex) => {
        const text = String(cell ?? "").substring(0, Math.floor(colWidth / 1.8));
        doc.text(text, margin + (cellIndex * colWidth) + 2, yPosition);
      });

      yPosition += rowHeight;
    });

    // Save File
    doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
  }
};
