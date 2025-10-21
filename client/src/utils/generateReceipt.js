import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateReceipt = (sale) => {
  const doc = new jsPDF("l", "mm", "a4");
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // ===== HEADER =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Winlet Pharmaceuticals (PVT) LTD", pageWidth / 2, 12, { align: "center" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(13);
  doc.text("Sales Receipt", pageWidth / 2, 18, { align: "center" });

  doc.setDrawColor(160);
  //doc.line(10, 26, pageWidth - 10, 26);
  doc.line(10, 20, pageWidth - 10, 20);

  // ===== CUSTOMER DETAILS BOX =====
  const boxTop = 28;
  const boxHeight = 26;

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(10, boxTop, pageWidth - 20, boxHeight, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Customer Details", 12, boxTop - 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let leftX = 14;
  let y = boxTop + 9;

  doc.text(`Name:`, leftX, y);
  doc.text(`${sale.customer?.name || "N/A"}`, leftX + 25, y);

  y += 6;
  doc.text(`Address:`, leftX, y);
  const addressText = doc.splitTextToSize(sale.customer?.address || "N/A", 70);
  doc.text(addressText, leftX + 25, y);
  y += addressText.length * 5 + 2;

  doc.text(`Phone:`, leftX, y);
  doc.text(`${sale.customer?.phone || "N/A"}`, leftX + 25, y);

  // ===== INVOICE DETAILS (right side) =====
  const rightX = pageWidth - 80;
  const infoYStart = boxTop + 9;

  doc.setFont("helvetica", "bold");
  doc.text("Invoice Details", rightX, infoYStart);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Invoice No:`, rightX, infoYStart + 7);
  doc.text(`${sale.invoiceNumber || sale._id || "-"}`, rightX + 33, infoYStart + 7);

  doc.text(`Date:`, rightX, infoYStart + 13);
  doc.text(
    `${new Date(sale.date || Date.now()).toLocaleDateString()}`,
    rightX + 33,
    infoYStart + 13
  );

  // ===== ITEMS TABLE =====
  const tableColumn = [
    "Sr No",
    "Product Detail",
    "Batch Number",
    "Date of Expiry",
    "Retail Price",
    "Discount",
    "Sale Price",
    "Qty",
    "Total Amount",
  ];

  let srNo = 1;
  const tableRows = sale.items.map((item) => {
    const product = item.product || {};
    const salePrice = Math.round(product.salePrice || item.salePrice || 0);
    const retailPrice = Math.round(product.retailPrice || item.retailPrice || 0);
    const quantity = Math.round(item.quantity || 0);
    const discountPercent =
      retailPrice > 0 ? Math.round(((retailPrice - salePrice) / retailPrice) * 100) : 0;
    const total = Math.round(salePrice * quantity);

    return [
      srNo++,
      product.name + " - " + (product.description || ""),
      product.batchNumber || "-",
      product.expirationDate
        ? new Date(product.expirationDate).toLocaleDateString()
        : "-",
      retailPrice,
      `${discountPercent}%`,
      salePrice,
      quantity,
      total,
    ];
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: boxTop + boxHeight + 6, // slightly tighter
    theme: "grid",
    styles: {
      fontSize: 10,
      valign: "middle",
      lineWidth: 0.2,
      lineColor: [0, 0, 0],
      textColor: [0, 0, 0],
      cellPadding: 2,
      fontStyle: "bold",
    },
    headStyles: {
      fillColor: [33, 97, 140],
      textColor: 255,
      halign: "center",
      fontSize: 10,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { halign: "center" },
      1: { halign: "left" },
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "center" },
      6: { halign: "center" },
      7: { halign: "center" },
      8: { halign: "center" },
    },
    margin: { left: 8, right: 8 },
    tableWidth: "full", // 🔥 true full width
    useCss: true,
  });

  // ===== TOTALS & FOOTER (Pinned at bottom) =====
  const totalAmount = sale.items.reduce((sum, item) => {
    const product = item.product || {};
    const salePrice = Number(product.salePrice || item.salePrice || 0);
    const quantity = Number(item.quantity || 0);
    return sum + salePrice * quantity;
  }, 0);

  const paymentReceived = Number(sale.paymentReceived || 0);
  const balance = totalAmount - paymentReceived;

  const totalPages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Totals always near bottom (adjust if table fills the page)
    const footerY = pageHeight - 35;

    doc.setDrawColor(180);
    doc.line(10, footerY - 5, pageWidth - 10, footerY - 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Grand Total: ${Math.round(totalAmount)}`, pageWidth - 10, footerY, {
      align: "right",
    });
    doc.text(`Total Paid: ${Math.round(paymentReceived)}`, pageWidth - 10, footerY + 8, {
      align: "right",
    });
    doc.text(`Balance: ${Math.round(balance)}`, pageWidth - 10, footerY + 16, {
      align: "right",
    });

    // Footer message
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 10, { align: "center" });
  }

  // ===== SAVE =====
  doc.save(`receipt_${sale.invoiceNumber || Date.now()}.pdf`);
};
