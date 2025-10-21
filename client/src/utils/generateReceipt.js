import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateReceipt = (sale) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // ===== HEADER =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Winlet Pharmaceuticals (PVT) LTD", pageWidth / 2, 22, { align: "center" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(13);
  doc.text("Sales Receipt", pageWidth / 2, 31, { align: "center" });

  doc.setDrawColor(160);
  doc.line(15, 35, pageWidth - 15, 35);

  // ===== CUSTOMER DETAILS BOX =====
  const boxTop = 48;
  const boxHeight = 34;

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(12, boxTop, pageWidth - 24, boxHeight, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Customer Details", 14, boxTop - 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  let leftX = 16;
  let y = boxTop + 10;

  doc.text(`Name:`, leftX, y);
  doc.text(`${sale.customer?.name || "N/A"}`, leftX + 28, y);

  y += 7;

  // ✅ Handle long address properly
  doc.text(`Address:`, leftX, y);
  const addressText = doc.splitTextToSize(
    sale.customer?.address || "N/A",
    75
  );
  doc.text(addressText, leftX + 28, y);

  // increase y based on address height
  y += addressText.length * 6 + 2;

  doc.text(`Phone:`, leftX, y);
  doc.text(`${sale.customer?.phone || "N/A"}`, leftX + 28, y);

  // ===== INVOICE DETAILS (right side of box) =====
  const rightX = pageWidth - 90;
  const infoYStart = boxTop + 10;

  doc.setFont("helvetica", "bold");
  doc.text("Invoice Details", rightX, infoYStart);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Invoice No:`, rightX, infoYStart + 8);
  doc.text(`${sale.invoiceNumber || sale._id || "-"}`, rightX + 35, infoYStart + 8);

  doc.text(`Date:`, rightX, infoYStart + 15);
  doc.text(
    `${new Date(sale.date || Date.now()).toLocaleDateString()}`,
    rightX + 35,
    infoYStart + 15
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
      product.name + "-" + (product.description || ""),
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
    startY: boxTop + boxHeight + 12,
    theme: "grid",
    styles: {
      fontSize: 10, // ⬆️ Bigger table text
      valign: "middle",
      lineWidth: 0.2,
      lineColor: [100, 100, 100],
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [33, 97, 140],
      textColor: 255,
      halign: "center",
      fontSize: 11, // ⬆️ Larger header text
      fontStyle: "bold",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 38 },
      2: { halign: "center", cellWidth: 25 },
      3: { halign: "center", cellWidth: 28 },
      4: { halign: "center", cellWidth: 22 },
      5: { halign: "center", cellWidth: 20 },
      6: { halign: "center", cellWidth: 20 },
      7: { halign: "center", cellWidth: 15 },
      8: { halign: "center", cellWidth: 28 },
    },
  });

  // ===== TOTALS =====
  const totalAmount = sale.items.reduce((sum, item) => {
    const product = item.product || {};
    const salePrice = Number(product.salePrice || item.salePrice || 0);
    const quantity = Number(item.quantity || 0);
    return sum + salePrice * quantity;
  }, 0);

  const paymentReceived = Number(sale.paymentReceived || 0);
  const balance = totalAmount - paymentReceived;

  const bottomMargin = 40;
  const finalY = Math.max(doc.lastAutoTable.finalY + 12, pageHeight - bottomMargin);

  doc.setDrawColor(180);
  doc.line(12, finalY - 8, pageWidth - 12, finalY - 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);

  doc.text(`Grand Total: ${Math.round(totalAmount)}`, pageWidth - 12, finalY, {
    align: "right",
  });
  doc.text(`Total Paid: ${Math.round(paymentReceived)}`, pageWidth - 12, finalY + 9, {
    align: "right",
  });
  doc.text(`Balance: ${Math.round(balance)}`, pageWidth - 12, finalY + 18, {
    align: "right",
  });

  // ===== FOOTER =====
  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 15, { align: "center" });

  // ===== SAVE =====
  doc.save(`receipt_${sale.invoiceNumber || Date.now()}.pdf`);
};
