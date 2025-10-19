import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateReceipt = (sale) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // ===== HEADER =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Winlet Pharmaceuticals (PVT) LTD", pageWidth / 2, 20, { align: "center" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  doc.text("Sales Receipt", pageWidth / 2, 28, { align: "center" });

  doc.setDrawColor(160);
  doc.line(15, 32, pageWidth - 15, 32);

  // ===== CUSTOMER DETAILS BOX =====
  const boxTop = 45;
  const boxHeight = 30;

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(12, boxTop, pageWidth - 24, boxHeight, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Customer Details", 14, boxTop - 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let leftX = 16;
  let y = boxTop + 8;

  doc.text(`Name:`, leftX, y);
  doc.text(`${sale.customer?.name || "N/A"}`, leftX + 25, y);

  y += 6;

  // ✅ Handle long address properly
  doc.text(`Address:`, leftX, y);
  const addressText = doc.splitTextToSize(
    sale.customer?.address || "N/A",
    70 // same as maxWidth before
  );
  doc.text(addressText, leftX + 25, y);

  // increase y based on address height (approx 5 mm per line)
  y += addressText.length * 5.5 + 1.5; // small buffer for spacing

  doc.text(`Phone:`, leftX, y);
  doc.text(`${sale.customer?.phone || "N/A"}`, leftX + 25, y);


  // ===== INVOICE DETAILS (right side of box) =====
  const rightX = pageWidth - 90;
  const infoYStart = boxTop + 8;

  doc.setFont("helvetica", "bold");
  doc.text("Invoice Details", rightX, infoYStart);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Invoice No:`, rightX, infoYStart + 7);
  doc.text(`${sale.invoiceNumber || sale._id || "-"}`, rightX + 30, infoYStart + 7);

  doc.text(`Date:`, rightX, infoYStart + 13);
  doc.text(
    `${new Date(sale.date || Date.now()).toLocaleDateString()}`,
    rightX + 30,
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

    // Calculate discount percentage
    const discountPercent =
      retailPrice > 0 ? Math.round(((retailPrice - salePrice) / retailPrice) * 100) : 0;

    // Total = salePrice × quantity
    const total = Math.round(salePrice * quantity);

    return [
      srNo++,
      product.name + "-" + product.description || "N/A",
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
    startY: boxTop + boxHeight + 10,
    theme: "grid",
    styles: {
      fontSize: 9,
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [120, 120, 120],
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [40, 116, 166],
      textColor: 255,
      halign: "center",
      fontStyle: "bold",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { halign: "center", cellWidth: 22 },
      3: { halign: "center", cellWidth: 25 },
      4: { halign: "center", cellWidth: 20 },
      5: { halign: "center", cellWidth: 20 },
      6: { halign: "center", cellWidth: 20 },
      7: { halign: "center", cellWidth: 15 },
      8: { halign: "center", cellWidth: 25 },
    },
  });

  // ✅ Calculate totals on frontend (from sale items)
  const totalAmount = sale.items.reduce((sum, item) => {
    const product = item.product || {};
    const salePrice = Number(product.salePrice || item.salePrice || 0);
    const quantity = Number(item.quantity || 0);
    return sum + salePrice * quantity;
  }, 0);

  const paymentReceived = Number(sale.paymentReceived || 0);
  const balance = totalAmount - paymentReceived;


  // ===== TOTALS SECTION =====
  const bottomMargin = 40;
  const finalY = Math.max(doc.lastAutoTable.finalY + 10, pageHeight - bottomMargin);

  doc.setDrawColor(200);
  doc.line(12, finalY - 6, pageWidth - 12, finalY - 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  doc.text(`Grand Total: ${Math.round(totalAmount)}`, pageWidth - 12, finalY, {
    align: "right",
  });
  doc.text(`Total Paid: ${Math.round(paymentReceived)}`, pageWidth - 12, finalY + 8, {
    align: "right",
  });
  doc.text(`Balance: ${Math.round(balance)}`, pageWidth - 12, finalY + 16, {
    align: "right",
  });


  // ===== FOOTER =====
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 14, { align: "center" });

  // ===== SAVE PDF =====
  doc.save(`receipt_${sale.invoiceNumber || Date.now()}.pdf`);
};
