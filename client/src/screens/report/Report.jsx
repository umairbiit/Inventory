import React, { useState, useEffect } from "react";
import { DatePicker, Select, Button, Card, Table, message, Space } from "antd";
import dayjs from "dayjs";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getCustomers as fetchCustomersService } from "../../services/customerService";

const { RangePicker } = DatePicker;
const { Option } = Select;

const Report = () => {
  const [dates, setDates] = useState([]);
  const [report, setReport] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const res = await fetchCustomersService();
      if (res.success) setCustomers(res.customers);
      else message.error(res.message || "Failed to fetch customers");
    } catch (err) {
      message.error("Failed to fetch customers");
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch Profit/Loss report
  const fetchReport = async () => {
    if (!dates || dates.length !== 2)
      return message.error("Select start and end dates");

    try {
      setLoading(true);
      const startDate = dayjs(dates[0]).format("YYYY-MM-DD");
      const endDate = dayjs(dates[1]).format("YYYY-MM-DD");

      let url = `${API_URL}/api/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`;
      if (selectedCustomer) url += `&customer=${selectedCustomer}`;

      const { data } = await axios.get(url, { withCredentials: true });

      if (!data.success)
        return message.error(data.message || "Failed to fetch report");

      setReport(data);
    } catch (error) {
      message.error("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF report
  const downloadPDF = () => {
    if (!report) return message.error("Generate report first");

    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text("Profit & Loss Report", 14, 20);
    doc.setFontSize(12);
    doc.text(
      `Period: ${dayjs(dates[0]).format("YYYY-MM-DD")} to ${dayjs(
        dates[1]
      ).format("YYYY-MM-DD")}`,
      14,
      28
    );

    if (selectedCustomer) {
      const customerObj = customers.find((c) => c._id === selectedCustomer);
      doc.text(`Customer: ${customerObj?.name || ""}`, 14, 36);
    }

    // Summary
    const summaryStartY = selectedCustomer ? 44 : 36;
    doc.text(`Total Sales: Rs. ${report.totalSalesAmount}`, 14, summaryStartY);
    doc.text(`Total Cost: Rs. ${report.totalCost}`, 14, summaryStartY + 8);
    doc.text(
      `Total Expenses: Rs. ${report.totalExpenses}`,
      14,
      summaryStartY + 16
    );
    doc.text(
      `Profit / Loss: Rs. ${report.profit}`,
      14,
      summaryStartY + 24
    );

    // Sales Table
    autoTable(doc, {
      startY: summaryStartY + 34,
      head: [
        [
          "Product",
          "Customer",
          "Quantity",
          "Unit Price",
          "Discount",
          "Total",
          "Date",
        ],
      ],
      body: report.sales.map((s) => [
        s.productName,
        s.customerName || "-",
        s.quantity,
        s.salePrice,
        s.discount,
        s.totalAmount,
        dayjs(s.date).format("YYYY-MM-DD"),
      ]),
      theme: "striped",
      styles: { fontSize: 9, valign: "middle" },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
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
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [230, 126, 34], textColor: 255 },
    });

    // Footer
    doc.setFontSize(10);
    doc.text(
      `Generated on: ${dayjs().format("YYYY-MM-DD HH:mm")}`,
      14,
      doc.lastAutoTable.finalY + 12
    );

    doc.save(
      `Profit_Loss_${dayjs(dates[0]).format("YYYYMMDD")}_${dayjs(
        dates[1]
      ).format("YYYYMMDD")}.pdf`
    );
  };

  // Sales Table Columns
  const salesColumns = [
    { title: "Product", dataIndex: "productName", key: "productName" },
    { title: "Customer", dataIndex: "customerName", key: "customerName" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    { title: "Unit Sale Price", dataIndex: "salePrice", key: "salePrice" },
    { title: "Discount", dataIndex: "discount", key: "discount" },
    { title: "Total Amount", dataIndex: "totalAmount", key: "totalAmount" },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
    },
  ];

  // Expenses Table Columns
  const expensesColumns = [
    { title: "Description", dataIndex: "description", key: "description" },
    { title: "Amount", dataIndex: "amount", key: "amount" },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Profit & Loss Report</h2>

      <Space style={{ marginBottom: 16 }} wrap>
        <RangePicker onChange={(dates) => setDates(dates)} />
        <Select
          placeholder="All Customers"
          style={{ width: 220 }}
          allowClear
          onChange={(value) => setSelectedCustomer(value)}
        >
          {customers.map((c) => (
            <Option key={c._id} value={c._id}>
              {c.name} ({c.email || "No email"})
            </Option>
          ))}
        </Select>
        <Button type="primary" onClick={fetchReport} loading={loading}>
          Get Report
        </Button>
        {report && (
          <Button onClick={downloadPDF} disabled={!report}>
            Download PDF
          </Button>
        )}
      </Space>

      {report && (
        <div>
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
              bordered
              size="small"
            />
          </Card>

          <Card title="Expenses" style={{ marginTop: 24 }}>
            <Table
              columns={expensesColumns}
              dataSource={report.expenses}
              rowKey={(record, index) => index}
              pagination={{ pageSize: 5 }}
              bordered
              size="small"
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default Report;
