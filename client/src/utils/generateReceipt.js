import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateReceipt = (sale) => {
  const doc = new jsPDF();

  // ===== Header =====
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Winlet Pharmaceuticals (PVT) LTD", 105, 20, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "italic");
  doc.text("Sales Receipt", 105, 28, { align: "center" });

  // ===== Customer Details Box =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Customer Details", 14, 40);

  doc.setDrawColor(200);
  doc.rect(12, 44, 186, 25); // nice light border box

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`M/S: ${sale.customer?.name || "N/A"}`, 16, 52);
  doc.text(`Address: ${sale.customer?.address || "N/A"}`, 16, 59, { maxWidth: 180 });
  doc.text(`Mobile No: ${sale.customer?.phone || "N/A"}`, 16, 66);

  // ===== Items Table =====
  const tableColumn = [
    "Sr No",
    "Name",
    "Batch No.",
    "Expiry Date",
    "Qty",
    "Unit Price",
    "Discount",
    "Total Amount",
  ];

  let srNo = 1;
  const tableRows = sale.items.map((item) => {
    const product = item.product || {};
    const total =
      item.quantity * (product.salePrice || 0) - (item.discount || 0);

    return [
      srNo++,
      product.name || "N/A",
      product.batchNumber || "-",
      product.expirationDate
        ? new Date(product.expirationDate).toLocaleDateString()
        : "-",
      item.quantity,
      `${product.salePrice || 0}`,
      `${item.discount || 0}`,
      `${total}`,
    ];
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 78,
    theme: "grid", // <-- grid theme adds outer + inner borders
    styles: {
      fontSize: 9,
      valign: "middle",
      lineWidth: 0.2,        // thickness of border lines
      lineColor: [0, 0, 0],  // black border lines
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      halign: "center",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 }, // Sr#
      1: { cellWidth: 35 },                   // Product
      2: { halign: "center" },                // Batch
      3: { halign: "center" },                // Expiry
      4: { halign: "center" },                // Qty
      5: { halign: "center" },                // Unit Price
      6: { halign: "center" },                // Discount
      7: { halign: "center" },                // Total
    },
  });


  // ===== Totals Section =====
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");

  doc.text(`Grand Total: ${sale.totalAmount || 0}`, 190, finalY, {
    align: "right",
  });
  doc.text(`Paid Today: ${sale.paymentReceived || 0}`, 190, finalY + 8, {
    align: "right",
  });
  doc.text(`Balance: ${sale.balance || 0}`, 190, finalY + 16, {
    align: "right",
  });

  // ===== Footer =====
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for your business!", 105, 285, { align: "center" });

  doc.save(`receipt_${sale._id || Date.now()}.pdf`);
};
