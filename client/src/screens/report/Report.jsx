import React, { useState, useEffect, useMemo } from "react";
import {
  DatePicker, Select, Button, Card, Table, message, Space, Row, Col, Segmented, Tabs, Input, Empty,
  Dropdown, Typography, Tag, Alert, Skeleton,
} from "antd";
import {
  BarChartOutlined, DownloadOutlined, FilePdfOutlined, FileExcelOutlined, FileTextOutlined,
  SearchOutlined, RiseOutlined, ShoppingCartOutlined, WalletOutlined, ExclamationCircleOutlined,
  DollarOutlined, FundOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ResponsiveContainer, ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, PieChart, Pie, Cell, BarChart,
} from "recharts";
import { getCustomers as fetchCustomersService } from "../../services/customerService";
import { getProfitLoss, getReportSummary } from "../../services/reportServices";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import StatusTag from "../../components/StatusTag";
import ErrorState from "../../components/ErrorState";
import { useIsMobile } from "../../hooks/useIsMobile";
import { money, moneyShort, pctChange, pk, pkDayKey, pkCalendarDay } from "../../utils/format";
import { exportCSV, exportExcel } from "../../utils/exportUtils";

const { RangePicker } = DatePicker;
const { Text } = Typography;

// presets are calendar days in Pakistan time (as local-midnight dayjs for the picker)
const pkToday = () => pkCalendarDay();
const PRESETS = {
  today: { label: "Today", range: () => [pkToday(), pkToday()] },
  week: { label: "This Week", range: () => [pkToday().startOf("week"), pkToday()] },
  month: { label: "This Month", range: () => [pkToday().startOf("month"), pkToday()] },
  lastMonth: {
    label: "Last Month",
    range: () => [pkToday().subtract(1, "month").startOf("month"), pkToday().subtract(1, "month").endOf("month").startOf("day")],
  },
  last30: { label: "Last 30 days", range: () => [pkToday().subtract(29, "day"), pkToday()] },
  year: { label: "This Year", range: () => [pkToday().startOf("year"), pkToday()] },
};
const PIE_COLORS = ["#fdbc0a", "#2563eb", "#16a34a", "#dc2626", "#9333ea", "#0891b2", "#ea580c", "#64748b"];
const STATUS_FILL = { paid: "#16a34a", partial: "#f59e0b", unpaid: "#dc2626" };
const fmt = (d) => pkDayKey(d);

const searchRows = (rows, q, fields) => {
  const s = q.trim().toLowerCase();
  if (!s) return rows;
  return rows.filter((r) => fields.some((f) => String(f(r) ?? "").toLowerCase().includes(s)));
};

const Report = () => {
  const [dates, setDates] = useState(PRESETS.month.range());
  const [preset, setPreset] = useState("month");
  const [report, setReport] = useState(null);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState(null); // the dates/customer of the loaded report
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("sales");
  const [q, setQ] = useState("");
  const isMobile = useIsMobile();

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
    fetchReport(PRESETS.month.range(), null, true);
  }, []);

  // Fetch Profit/Loss report (+ summary for charts)
  const fetchReport = async (range = dates, customer = selectedCustomer, quiet = false) => {
    if (!range || range.length !== 2 || !range[0] || !range[1])
      return message.error("Select start and end dates");

    try {
      setLoading(true);
      setError(null);
      const startDate = dayjs(range[0]).format("YYYY-MM-DD");
      const endDate = dayjs(range[1]).format("YYYY-MM-DD");

      const [data, sum] = await Promise.all([
        getProfitLoss({ startDate, endDate, customer }),
        getReportSummary({ startDate, endDate, customer }).catch(() => null),
      ]);

      if (!data.success) {
        if (!quiet) message.error(data.message || "Failed to fetch report");
        setError(data.message || "Failed to fetch report");
        return;
      }

      setReport(data);
      setSummary(sum?.success ? sum : null);
      setPeriod({ start: range[0], end: range[1], customer });
    } catch (err) {
      if (!quiet) message.error("Failed to fetch report");
      setError(err?.response?.data?.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (key) => {
    setPreset(key);
    const r = PRESETS[key].range();
    setDates(r);
    fetchReport(r);
  };

  // ---------- derived data ----------
  const saleLines = useMemo(
    () =>
      (report?.sales || []).flatMap((s) =>
        (s.items || []).map((i, idx) => ({
          key: `${s._id}-${idx}`,
          invoiceNumber: s.invoiceNumber,
          productName: i.productName,
          customerName: s.customerName || "-",
          quantity: i.quantity,
          salePrice: i.salePrice,
          costPrice: i.costPrice || 0,
          total: (i.quantity || 0) * (i.salePrice || 0),
          profit: (i.quantity || 0) * ((i.salePrice || 0) - (i.costPrice || 0)),
          date: s.date,
        }))
      ),
    [report]
  );

  const totals = summary?.totals;
  const prev = summary?.previous;
  const delta = (k) => (prev ? pctChange(totals?.[k] || 0, prev[k] || 0) : null);

  const customerName = period?.customer ? customers.find((c) => c._id === period.customer)?.name : null;
  const periodLabel = period ? `${fmt(period.start)} to ${fmt(period.end)}` : "";
  const fileStamp = period ? `${dayjs(period.start).format("YYYYMMDD")}_${dayjs(period.end).format("YYYYMMDD")}` : "";

  // ---------- exports ----------
  const sheetDefs = () => {
    const s = [
      {
        name: "Summary",
        columns: [
          { title: "Metric", value: (r) => r[0], width: 28 },
          { title: "Value", value: (r) => r[1], width: 18 },
        ],
        rows: [
          ["Period", periodLabel],
          ["Customer", customerName || "All customers"],
          ["Number of sales", report.salesCount ?? report.sales.length],
          ["Sales value", report.totalRevenue ?? totals?.revenue ?? 0],
          ["Payments received", report.totalSalesAmount],
          ["Outstanding (unpaid)", report.pendingAmount],
          ["Cost of goods", report.totalCost],
          ["Expenses", report.totalExpenses],
          ["Gross profit (sales - cost)", (report.totalRevenue || 0) - (report.totalCost || 0)],
          ["Net profit (sales - cost - expenses)", (report.totalRevenue || 0) - (report.totalCost || 0) - (report.totalExpenses || 0)],
          ["Cash profit (received - cost - expenses)", report.profit],
        ],
      },
      {
        name: "Sales",
        columns: [
          { title: "Invoice", value: (r) => r.invoiceNumber },
          { title: "Date", value: (r) => fmt(r.date), width: 12 },
          { title: "Customer", value: (r) => r.customerName, width: 22 },
          { title: "Total", value: (r) => r.totalAmount },
          { title: "Received", value: (r) => r.paymentReceived },
          { title: "Balance", value: (r) => r.balance },
          { title: "Status", value: (r) => r.paymentStatus },
        ],
        rows: report.sales,
      },
      {
        name: "Sale lines",
        columns: [
          { title: "Invoice", value: (r) => r.invoiceNumber },
          { title: "Date", value: (r) => fmt(r.date), width: 12 },
          { title: "Product", value: (r) => r.productName, width: 26 },
          { title: "Customer", value: (r) => r.customerName, width: 22 },
          { title: "Qty", value: (r) => r.quantity, width: 8 },
          { title: "Unit price", value: (r) => r.salePrice },
          { title: "Unit cost", value: (r) => r.costPrice },
          { title: "Line total", value: (r) => r.total },
          { title: "Line profit", value: (r) => r.profit },
        ],
        rows: saleLines,
      },
      {
        name: "Expenses",
        columns: [
          { title: "Date", value: (r) => fmt(r.date), width: 12 },
          { title: "Description", value: (r) => r.description, width: 32 },
          { title: "Amount", value: (r) => r.amount },
        ],
        rows: report.expenses,
      },
    ];
    if (summary) {
      s.push(
        {
          name: "Products",
          columns: [
            { title: "Product", value: (r) => r.name, width: 26 },
            { title: "Category", value: (r) => r.category },
            { title: "Qty sold", value: (r) => r.quantity },
            { title: "Revenue", value: (r) => r.revenue },
            { title: "Profit", value: (r) => r.profit },
          ],
          rows: summary.topProducts || [],
        },
        {
          name: "Customers",
          columns: [
            { title: "Customer", value: (r) => r.name, width: 24 },
            { title: "Phone", value: (r) => r.phone },
            { title: "Sales", value: (r) => r.sales },
            { title: "Revenue", value: (r) => r.revenue },
            { title: "Received", value: (r) => r.received },
            { title: "Outstanding", value: (r) => r.outstanding },
          ],
          rows: summary.topCustomers || [],
        },
        {
          name: "Daily",
          columns: [
            { title: "Date", value: (r) => r.date, width: 12 },
            { title: "Sales", value: (r) => r.count },
            { title: "Revenue", value: (r) => r.revenue },
            { title: "Received", value: (r) => r.received },
            { title: "Cost", value: (r) => r.cost },
            { title: "Expenses", value: (r) => r.expenses },
            { title: "Profit", value: (r) => r.profit },
          ],
          rows: summary.series || [],
        }
      );
    }
    return s;
  };

  const downloadExcel = async () => {
    if (!report) return message.error("Generate report first");
    try {
      await exportExcel(`Report_${fileStamp}`, sheetDefs());
    } catch (e) {
      message.error("Could not create the Excel file");
    }
  };

  const downloadCSV = () => {
    if (!report) return message.error("Generate report first");
    const sheet = sheetDefs().find((s) =>
      tab === "expenses" ? s.name === "Expenses" : tab === "products" ? s.name === "Products" : tab === "customers" ? s.name === "Customers" : s.name === "Sale lines"
    ) || sheetDefs()[2];
    exportCSV(`${sheet.name.replace(/\s+/g, "_")}_${fileStamp}`, sheet.columns, sheet.rows);
  };

  // Generate PDF report
  const downloadPDF = () => {
    if (!report) return message.error("Generate report first");

    const doc = new jsPDF();
    const revenue = report.totalRevenue || 0;

    // Header
    doc.setFontSize(16);
    doc.text("Profit & Loss Report", 14, 20);
    doc.setFontSize(12);
    doc.text(`Period: ${periodLabel}`, 14, 28);

    if (period?.customer) {
      doc.text(`Customer: ${customerName || ""}`, 14, 36);
    }

    // Summary
    const summaryStartY = period?.customer ? 44 : 36;
    autoTable(doc, {
      startY: summaryStartY,
      head: [["Summary", "Amount (Rs.)"]],
      body: [
        ["Number of sales", String(report.salesCount ?? report.sales.length)],
        ["Sales value", revenue.toLocaleString()],
        ["Payments received", (report.totalSalesAmount || 0).toLocaleString()],
        ["Outstanding (unpaid)", (report.pendingAmount || 0).toLocaleString()],
        ["Cost of goods", (report.totalCost || 0).toLocaleString()],
        ["Expenses", (report.totalExpenses || 0).toLocaleString()],
        ["Net profit (sales - cost - expenses)", (revenue - (report.totalCost || 0) - (report.totalExpenses || 0)).toLocaleString()],
        ["Cash profit / loss (received - cost - expenses)", (report.profit || 0).toLocaleString()],
      ],
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [253, 188, 10], textColor: 20 },
      columnStyles: { 1: { halign: "right" } },
      tableWidth: 130,
    });

    // Sales Table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Invoice", "Product", "Customer", "Qty", "Unit Price", "Total", "Date"]],
      body: saleLines.map((s) => [
        s.invoiceNumber || "-",
        s.productName,
        s.customerName || "-",
        s.quantity,
        s.salePrice,
        s.total,
        fmt(s.date),
      ]),
      theme: "striped",
      styles: { fontSize: 9, valign: "middle" },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    // Expenses Table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Description", "Amount", "Date"]],
      body: report.expenses.map((e) => [e.description, e.amount, fmt(e.date)]),
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [230, 126, 34], textColor: 255 },
    });

    // Footer
    doc.setFontSize(10);
    doc.text(`Generated on: ${pk().format("YYYY-MM-DD HH:mm")}`, 14, doc.lastAutoTable.finalY + 12);

    doc.save(`Profit_Loss_${fileStamp}.pdf`);
  };

  // ---------- tables ----------
  const numSorter = (k) => (a, b) => (Number(a[k]) || 0) - (Number(b[k]) || 0);
  const strSorter = (k) => (a, b) => String(a[k] || "").localeCompare(String(b[k] || ""));

  const salesColumns = [
    { title: "Invoice", dataIndex: "invoiceNumber", key: "invoiceNumber", sorter: strSorter("invoiceNumber") },
    { title: "Product", dataIndex: "productName", key: "productName", sorter: strSorter("productName") },
    { title: "Customer", dataIndex: "customerName", key: "customerName", sorter: strSorter("customerName") },
    { title: "Quantity", dataIndex: "quantity", key: "quantity", align: "right", sorter: numSorter("quantity") },
    { title: "Unit Sale Price", dataIndex: "salePrice", key: "salePrice", align: "right", sorter: numSorter("salePrice"), render: money },
    { title: "Total Amount", dataIndex: "total", key: "total", align: "right", sorter: numSorter("total"), render: money },
    {
      title: "Profit", dataIndex: "profit", key: "profit", align: "right", sorter: numSorter("profit"),
      render: (v) => <span style={{ color: v < 0 ? "#dc2626" : undefined }}>{money(v)}</span>,
    },
    {
      title: "Date", dataIndex: "date", key: "date", defaultSortOrder: "descend",
      sorter: (a, b) => new Date(a.date) - new Date(b.date), render: fmt,
    },
  ];

  const invoiceColumns = [
    { title: "Invoice", dataIndex: "invoiceNumber", key: "invoiceNumber", sorter: strSorter("invoiceNumber") },
    { title: "Customer", dataIndex: "customerName", key: "customerName", sorter: strSorter("customerName") },
    { title: "Items", key: "items", render: (_, r) => (r.items || []).length },
    { title: "Total", dataIndex: "totalAmount", key: "totalAmount", align: "right", sorter: numSorter("totalAmount"), render: money },
    { title: "Received", dataIndex: "paymentReceived", key: "paymentReceived", align: "right", sorter: numSorter("paymentReceived"), render: money },
    {
      title: "Balance", dataIndex: "balance", key: "balance", align: "right", sorter: numSorter("balance"),
      render: (v) => <span style={{ color: v > 0 ? "#dc2626" : undefined }}>{money(v)}</span>,
    },
    { title: "Status", dataIndex: "paymentStatus", key: "status", render: (s) => <StatusTag status={s} />,
      filters: ["paid", "partial", "unpaid"].map((v) => ({ text: v, value: v })), onFilter: (v, r) => r.paymentStatus === v },
    { title: "Date", dataIndex: "date", key: "date", sorter: (a, b) => new Date(a.date) - new Date(b.date), render: fmt },
  ];

  const expensesColumns = [
    { title: "Description", dataIndex: "description", key: "description", sorter: strSorter("description") },
    { title: "Amount", dataIndex: "amount", key: "amount", align: "right", sorter: numSorter("amount"), render: money },
    { title: "Date", dataIndex: "date", key: "date", defaultSortOrder: "descend", sorter: (a, b) => new Date(a.date) - new Date(b.date), render: fmt },
  ];

  const productColumns = [
    { title: "Product", dataIndex: "name", key: "name", sorter: strSorter("name") },
    { title: "Category", dataIndex: "category", key: "category", render: (c) => (c ? <Tag>{c}</Tag> : "-") },
    { title: "Qty sold", dataIndex: "quantity", key: "quantity", align: "right", sorter: numSorter("quantity") },
    { title: "Revenue", dataIndex: "revenue", key: "revenue", align: "right", sorter: numSorter("revenue"), defaultSortOrder: "descend", render: money },
    { title: "Profit", dataIndex: "profit", key: "profit", align: "right", sorter: numSorter("profit"), render: money },
    { title: "In stock", dataIndex: "stock", key: "stock", align: "right", sorter: numSorter("stock") },
  ];

  const customerColumns = [
    { title: "Customer", dataIndex: "name", key: "name", sorter: strSorter("name") },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Sales", dataIndex: "sales", key: "sales", align: "right", sorter: numSorter("sales") },
    { title: "Revenue", dataIndex: "revenue", key: "revenue", align: "right", sorter: numSorter("revenue"), defaultSortOrder: "descend", render: money },
    { title: "Received", dataIndex: "received", key: "received", align: "right", sorter: numSorter("received"), render: money },
    {
      title: "Outstanding", dataIndex: "outstanding", key: "outstanding", align: "right", sorter: numSorter("outstanding"),
      render: (v) => <span style={{ color: v > 0 ? "#dc2626" : undefined }}>{money(v)}</span>,
    },
  ];

  const tableProps = (rows, cols, rowKey) => ({
    columns: cols,
    dataSource: rows,
    rowKey,
    size: "small",
    scroll: { x: 760 },
    pagination: { pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 25, 50, 100], showTotal: (t) => `${t} rows` },
    locale: { emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={q ? "No rows match your search" : "Nothing in this period"} /> },
  });

  const tabItems = report
    ? [
        {
          key: "sales",
          label: `Sale lines (${saleLines.length})`,
          children: <Table {...tableProps(searchRows(saleLines, q, [(r) => r.productName, (r) => r.customerName, (r) => r.invoiceNumber]), salesColumns, "key")} />,
        },
        {
          key: "invoices",
          label: `Invoices (${report.sales.length})`,
          children: <Table {...tableProps(searchRows(report.sales, q, [(r) => r.invoiceNumber, (r) => r.customerName]), invoiceColumns, "_id")} />,
        },
        {
          key: "expenses",
          label: `Expenses (${report.expenses.length})`,
          children: <Table {...tableProps(searchRows(report.expenses, q, [(r) => r.description]), expensesColumns, (r) => r._id || `${r.description}-${r.date}`)} />,
        },
        ...(summary
          ? [
              {
                key: "products",
                label: "Top products",
                children: <Table {...tableProps(searchRows(summary.topProducts || [], q, [(r) => r.name, (r) => r.category]), productColumns, (r) => r._id || r.name)} />,
              },
              {
                key: "customers",
                label: "Top customers",
                children: <Table {...tableProps(searchRows(summary.topCustomers || [], q, [(r) => r.name, (r) => r.phone]), customerColumns, (r) => r._id || r.name)} />,
              },
            ]
          : []),
      ]
    : [];

  const revenue = report ? report.totalRevenue ?? totals?.revenue ?? 0 : 0;
  const netProfit = report ? revenue - (report.totalCost || 0) - (report.totalExpenses || 0) : 0;
  const series = summary?.series || [];
  const showSeries = series.length > 1;

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Profit & loss, sales and expenses for any period"
        icon={<BarChartOutlined />}
        extra={
          report && (
            <>
              <Dropdown
                menu={{
                  items: [
                    { key: "xlsx", icon: <FileExcelOutlined />, label: "Excel (all sheets)", onClick: downloadExcel },
                    { key: "csv", icon: <FileTextOutlined />, label: "CSV (current table)", onClick: downloadCSV },
                  ],
                }}
              >
                <Button icon={<DownloadOutlined />}>Export</Button>
              </Dropdown>
              <Button onClick={downloadPDF} disabled={!report} icon={<FilePdfOutlined />}>
                Download PDF
              </Button>
            </>
          )
        }
      />

      <Card className="panel" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 12, overflowX: "auto" }}>
          <Segmented
            value={preset}
            onChange={applyPreset}
            options={[
              ...Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label })),
              { value: "custom", label: "Custom", disabled: true },
            ]}
          />
        </div>
        <Space wrap style={{ width: "100%" }}>
          <RangePicker
            value={dates}
            format="YYYY-MM-DD"
            allowClear={false}
            onChange={(d) => {
              setDates(d);
              setPreset("custom");
            }}
            style={{ width: isMobile ? "100%" : 270 }}
          />
          <Select
            placeholder="All Customers"
            style={{ width: isMobile ? "100%" : 240 }}
            allowClear
            showSearch
            value={selectedCustomer}
            onChange={(value) => setSelectedCustomer(value ?? null)}
            options={customers.map((c) => ({ value: c._id, label: `${c.name} (${c.phone || c.email || "No contact"})` }))}
            filterOption={(input, opt) => opt?.label?.toLowerCase().includes(input.toLowerCase())}
          />
          <Button type="primary" onClick={() => fetchReport()} loading={loading}>
            Get Report
          </Button>
        </Space>
        {period && (
          <div style={{ marginTop: 10 }}>
            <Text type="secondary">
              Showing {periodLabel}
              {customerName ? ` · ${customerName}` : " · all customers"}
            </Text>
          </div>
        )}
      </Card>

      {error && !report && <ErrorState title="Couldn't load the report" subTitle={error} onRetry={() => fetchReport()} />}

      {!report && loading && <Card className="panel"><Skeleton active paragraph={{ rows: 6 }} /></Card>}

      {report && (
        <>
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={8} xxl={4}>
              <StatCard title="Sales value" value={money(revenue)} sub={`${report.salesCount ?? report.sales.length} sale(s)`} icon={<ShoppingCartOutlined />} delta={delta("revenue")} loading={loading} hint="Total of all invoices in the period (paid or not). Change vs previous period of the same length." />
            </Col>
            <Col xs={12} md={8} xxl={4}>
              <StatCard title="Received" value={money(report.totalSalesAmount)} sub="payments on these sales" icon={<WalletOutlined />} color="#16a34a" delta={delta("received")} loading={loading} />
            </Col>
            <Col xs={12} md={8} xxl={4}>
              <StatCard title="Outstanding" value={money(report.pendingAmount)} sub="still to collect" icon={<ExclamationCircleOutlined />} color="#dc2626" valueColor={report.pendingAmount > 0 ? "#dc2626" : undefined} loading={loading} />
            </Col>
            <Col xs={12} md={8} xxl={4}>
              <StatCard title="Cost + Expenses" value={money((report.totalCost || 0) + (report.totalExpenses || 0))} sub={`Cost ${money(report.totalCost)} · Exp ${money(report.totalExpenses)}`} icon={<DollarOutlined />} color="#ea580c" loading={loading} />
            </Col>
            <Col xs={12} md={8} xxl={4}>
              <StatCard title="Net profit" value={money(netProfit)} sub="sales − cost − expenses" icon={<RiseOutlined />} color="#2563eb" valueColor={netProfit < 0 ? "#dc2626" : "#16a34a"} delta={delta("profit")} loading={loading} />
            </Col>
            <Col xs={12} md={8} xxl={4}>
              <StatCard title="Profit / Loss (cash)" value={money(report.profit)} sub="received − cost − expenses" icon={<FundOutlined />} color="#9333ea" valueColor={report.profit < 0 ? "#dc2626" : "#16a34a"} loading={loading} hint="Same figure as the original Profit & Loss report: only money actually received counts." />
            </Col>
          </Row>

          {!summary && (
            <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="Charts are unavailable right now; the totals and tables below are still accurate." />
          )}

          {summary && (
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} xl={14}>
                <Card className="panel" title="Daily sales, expenses and profit" size="small">
                  {showSeries ? (
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tickFormatter={(d) => dayjs(d).format("DD MMM")} fontSize={11} minTickGap={16} />
                          <YAxis tickFormatter={moneyShort} fontSize={11} width={48} />
                          <RTooltip formatter={(v) => money(v)} labelFormatter={(d) => dayjs(d).format("ddd, DD MMM YYYY")} />
                          <Legend />
                          <Area type="monotone" dataKey="revenue" name="Sales" stroke="#fdbc0a" fill="#fdbc0a" fillOpacity={0.25} />
                          <Bar dataKey="expenses" name="Expenses" fill="#ea580c" barSize={8} />
                          <Line type="monotone" dataKey="profit" name="Profit" stroke="#2563eb" dot={false} strokeWidth={2} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="chart-empty">Pick a range longer than one day to see the daily trend.</div>
                  )}
                </Card>
              </Col>
              <Col xs={24} md={12} xl={5}>
                <Card className="panel" title="Sales by category" size="small">
                  {(summary.categories || []).length ? (
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={summary.categories} dataKey="revenue" nameKey="category" innerRadius={50} outerRadius={85} paddingAngle={2}>
                            {summary.categories.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <RTooltip formatter={(v) => money(v)} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="chart-empty">No sales in this period</div>
                  )}
                </Card>
              </Col>
              <Col xs={24} md={12} xl={5}>
                <Card className="panel" title="Payment status" size="small">
                  {(summary.paymentStatus || []).length ? (
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <BarChart data={summary.paymentStatus} layout="vertical" margin={{ left: 8, right: 16 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tickFormatter={moneyShort} fontSize={11} />
                          <YAxis type="category" dataKey="status" fontSize={12} width={56} />
                          <RTooltip formatter={(v, n) => (n === "Invoices" ? v : money(v))} />
                          <Bar dataKey="amount" name="Sales value">
                            {summary.paymentStatus.map((s, i) => <Cell key={i} fill={STATUS_FILL[s.status] || "#64748b"} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="chart-empty">No sales in this period</div>
                  )}
                </Card>
              </Col>
            </Row>
          )}

          <Card className="panel table-card">
            <div className="toolbar">
              <Input
                className="toolbar__search"
                placeholder="Search this table"
                prefix={<SearchOutlined />}
                allowClear
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button icon={<FileTextOutlined />} onClick={downloadCSV}>CSV</Button>
              <Button icon={<FileExcelOutlined />} onClick={downloadExcel}>Excel</Button>
            </div>
            <Tabs activeKey={tab} onChange={setTab} items={tabItems} />
          </Card>
        </>
      )}
    </div>
  );
};

export default Report;
