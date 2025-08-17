import React, { useState } from "react";
import { DatePicker, Button, Card, Table, message } from "antd";
import dayjs from "dayjs";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const { RangePicker } = DatePicker;

const Report = () => {
  const [dates, setDates] = useState([]);
  const [report, setReport] = useState(null);
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchReport = async () => {
    if (!dates || dates.length !== 2) return message.error("Select start and end dates");

    try {
      const startDate = dayjs(dates[0]).format("YYYY-MM-DD");
      const endDate = dayjs(dates[1]).format("YYYY-MM-DD");

      const { data } = await axios.get(
        `${API_URL}/api/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`,
        { withCredentials: true }
      );

      if (!data.success) return message.error(data.message || "Failed to fetch report");

      setReport(data);
    } catch (error) {
      message.error("Failed to fetch report");
    }
  };

  const downloadPDF = () => {
  if (!report) return message.error("Generate report first");

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Profit & Loss Report", 14, 20);
  doc.setFontSize(12);
  doc.text(
    `Period: ${dayjs(dates[0]).format("YYYY-MM-DD")} to ${dayjs(dates[1]).format("YYYY-MM-DD")}`,
    14,
    28
  );
  doc.text(`Total Sales: Rs. ${report.totalSalesAmount}`, 14, 36);
  doc.text(`Total Cost: Rs. ${report.totalCost}`, 14, 44);
  doc.text(`Total Expenses: Rs. ${report.totalExpenses}`, 14, 52);
  doc.text(`Profit / Loss: Rs. ${report.profit}`, 14, 60);

  // Sales Table
  autoTable(doc, {
    startY: 70,
    head: [["Product", "Quantity", "Unit Price", "Discount", "Total", "Date"]],
    body: report.sales.map((s) => [
      s.productName,
      s.quantity,
      s.salePrice,
      s.discount,
      s.totalAmount,
      dayjs(s.date).format("YYYY-MM-DD"),
    ]),
    theme: "grid",
  });

  // Expenses Table
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Description", "Amount", "Date"]],
    body: report.expenses.map((e) => [
      e.description,
      e.amount,
      dayjs(e.date).format("YYYY-MM-DD"),
    ]),
    theme: "grid",
  });

  doc.save(
    `Profit_Loss_${dayjs(dates[0]).format("YYYYMMDD")}_${dayjs(dates[1]).format(
      "YYYYMMDD"
    )}.pdf`
  );
};

  const salesColumns = [
    { title: "Product", dataIndex: "productName", key: "productName" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    { title: "Unit Sale Price", dataIndex: "salePrice", key: "salePrice" },
    { title: "Discount", dataIndex: "discount", key: "discount" },
    { title: "Total Amount", dataIndex: "totalAmount", key: "totalAmount" },
    { title: "Date", dataIndex: "date", key: "date", render: (date) => dayjs(date).format("YYYY-MM-DD") },
  ];

  const expensesColumns = [
    { title: "Description", dataIndex: "description", key: "description" },
    { title: "Amount", dataIndex: "amount", key: "amount" },
    { title: "Date", dataIndex: "date", key: "date", render: (date) => dayjs(date).format("YYYY-MM-DD") },
  ];

  return (
    <div>
      <h2>Profit & Loss Report</h2>
      <RangePicker onChange={(dates) => setDates(dates)} style={{ marginBottom: 16 }} />
      <Button type="primary" onClick={fetchReport} style={{ marginLeft: 8 }}>
        Get Report
      </Button>
      {report && (
        <Button type="default" onClick={downloadPDF} style={{ marginLeft: 8 }}>
          Download PDF
        </Button>
      )}

      {report && (
        <div style={{ marginTop: 24 }}>
          <Card style={{ marginBottom: 24 }}>
            <p>Total Sales Amount: Rs. {report.totalSalesAmount}</p>
            <p>Total Cost: Rs. {report.totalCost}</p>
            <p>Total Expenses: Rs. {report.totalExpenses}</p>
            <p>
              Profit / Loss:{" "}
              <b style={{ color: report.profit >= 0 ? "green" : "red" }}>
                Rs. {report.profit}
              </b>
            </p>
          </Card>

          <Card title="Sales">
            <Table
              columns={salesColumns}
              dataSource={report.sales}
              rowKey={(record, index) => index}
              pagination={{ pageSize: 5 }}
            />
          </Card>

          <Card title="Expenses" style={{ marginTop: 24 }}>
            <Table
              columns={expensesColumns}
              dataSource={report.expenses}
              rowKey={(record, index) => index}
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default Report;
