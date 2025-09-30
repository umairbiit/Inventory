// src/utils/generateReceipt.js
import jsPDF from "jspdf";

export const generateReceipt = (sale) => {
  if (!sale) return;

  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("Sales Receipt", 20, 20);

  // Sale info
  doc.setFontSize(12);
  doc.text(`Receipt No: ${sale._id}`, 20, 40);
  doc.text(`Date: ${new Date(sale.date || Date.now()).toLocaleDateString()}`, 20, 50);
  doc.text(`Customer: ${sale.customer?.name || "N/A"}`, 20, 60);

  // Items list
  let y = 80;
  sale.items.forEach((item, i) => {
    const text = `${i + 1}. ${item.product?.name} x${item.quantity} @ ${item.salePrice} (Disc: ${item.discount})`;
    doc.text(text, 20, y);
    y += 10;
  });

  // Totals
  y += 10;
  doc.text(`Total: ${sale.totalAmount} PKR`, 20, y);
  y += 10;
  doc.text(`Paid: ${sale.paymentReceived} PKR`, 20, y);
  y += 10;
  doc.text(`Balance: ${sale.balance} PKR`, 20, y);

  // Save the PDF
  doc.save(`receipt_${sale._id}.pdf`);
};
