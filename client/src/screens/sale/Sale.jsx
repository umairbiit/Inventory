import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  Button,
  Drawer,
  Form,
  InputNumber,
  Select,
  Space,
  Popconfirm,
  message,
  Typography,
  Divider,
  Row,
  Col,
  Modal,
  Input,
  DatePicker,
  Tabs,
  Card,
  Tag,
  Tooltip,
  Empty,
  Segmented,
  Alert,
} from "antd";
import {
  PlusOutlined, DeleteOutlined, DollarCircleOutlined, EditOutlined, SearchOutlined,
  MoneyCollectOutlined, PrinterOutlined, DownloadOutlined, ReloadOutlined, ExclamationCircleOutlined,
  CalendarOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { generateReceipt } from "../../utils/generateReceipt";
import {
  getSales as fetchSalesService,
  createSale as createSaleService,
  deleteSale as deleteSaleService,
  updateSalePayment as updateSalePaymentService,
  updateSaleService,
} from "../../services/saleServices";
import { getProducts as fetchProductsService } from "../../services/productServices";
import { getCustomers as fetchCustomersService } from "../../services/customerService";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import StatusTag from "../../components/StatusTag";
import { useIsMobile } from "../../hooks/useIsMobile";
import { money, pk, pkDayKey, saleDateOf } from "../../utils/format";
import { exportCSV } from "../../utils/exportUtils";

const { Text } = Typography;
const { RangePicker } = DatePicker;

// Suggest the next invoice number from the highest existing "<prefix><number>"
const suggestInvoiceNumber = (sales) => {
  let best = null;
  sales.forEach((s) => {
    const m = /^(.*?)(\d+)$/.exec(s.invoiceNumber || "");
    if (!m) return;
    const n = parseInt(m[2], 10);
    if (!best || n > best.n) best = { prefix: m[1], n, width: m[2].length };
  });
  if (!best) return `INV-${pk().format("YYMMDD")}-1`;
  return `${best.prefix}${String(best.n + 1).padStart(best.width, "0")}`;
};

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [newPayment, setNewPayment] = useState(0);
  const [paymentDate, setPaymentDate] = useState(dayjs());
  const [paymentNote, setPaymentNote] = useState("");
  const [paying, setPaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  // remount the submit button on every open so a stale loading/motion state from the
  // previous submit (drawer closed mid-animation) never sticks to it
  const [openSeq, setOpenSeq] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [originalQty, setOriginalQty] = useState({}); // productId -> qty in the sale being edited
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => {
    const s = searchParams.get("status");
    if (!s) return "all";
    if (s.includes(",")) return "due";
    return ["paid", "partial", "unpaid"].includes(s) ? s : "all";
  });
  const [dateRange, setDateRange] = useState(null);
  const isMobile = useIsMobile();
  const [form] = Form.useForm();
  const autoOpened = useRef(false);

  // 👇 Watch fields for live calculation
  const items = Form.useWatch("items", form);
  const initialPayment = Form.useWatch("initialPayment", form);

  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchCustomers();
  }, []);

  // Dashboard "New sale" shortcut: /sale?new=1
  useEffect(() => {
    if (!autoOpened.current && searchParams.get("new") === "1") {
      autoOpened.current = true;
      openDrawer();
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data } = await fetchSalesService();
      setSales(data.sales);
    } catch (error) {
      message.error("Failed to fetch sales");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await fetchProductsService();
      setProducts(data.products);
    } catch (error) {
      message.error("Failed to fetch products");
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetchCustomersService();
      if (res.success) {
        setCustomers(res.customers);
      } else {
        message.error(res.message || "Failed to fetch customers");
      }
    } catch (error) {
      message.error("Failed to fetch customers");
    }
  };

  const productById = useMemo(() => {
    const m = {};
    products.forEach((p) => (m[p._id] = p));
    return m;
  }, [products]);

  const openDrawer = () => {
    form.resetFields();
    setIsEditing(false);
    setEditingId(null);
    setOriginalQty({});
    form.setFieldsValue({
      invoiceNumber: suggestInvoiceNumber(sales),
      customer: undefined,
      items: [{ product: undefined, quantity: 1, salePrice: 0, discount: 0 }],
      initialPayment: 0,
      saleDate: dayjs(),
    });
    setDrawerVisible(true);
    setOpenSeq((n) => n + 1);
  };

  const handleEditSale = (record) => {
    setIsEditing(true);
    setEditingId(record._id);

    const orig = {};
    record.items.forEach((item) => {
      const id = item.product?._id || item.product;
      if (id) orig[id] = (orig[id] || 0) + (Number(item.quantity) || 0);
    });
    setOriginalQty(orig);

    const formattedItems = record.items.map((item) => {
      const pid = item.product?._id;
      const p = productById[pid] || {};
      const retailPrice = item.retailPrice ?? p.retailPrice;
      return {
        product: pid,
        quantity: item.quantity,
        salePrice: item.salePrice,
        retailPrice,
        discount: item.discount ?? calculateDiscount(item.salePrice, retailPrice),
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate ? dayjs(item.expiryDate) : null,
      };
    });

    form.setFieldsValue({
      invoiceNumber: record.invoiceNumber,
      customer: record.customer?._id,
      items: formattedItems,
      initialPayment: record.paymentReceived,
      saleDate: saleDateOf(record) ? dayjs(saleDateOf(record)) : dayjs(),
    });

    setDrawerVisible(true);
    setOpenSeq((n) => n + 1);
  };

  const handleUpdatePaymentClick = (record) => {
    setSelectedSale(record);
    // Default to remaining balance
    const remaining = record.totalAmount - record.paymentReceived;
    setNewPayment(Math.max(remaining, 0));
    setPaymentDate(dayjs());
    setPaymentNote("");
    setIsModalOpen(true);
  };

  const handleUpdatePaymentOk = async () => {
    const remaining = selectedSale.totalAmount - selectedSale.paymentReceived;
    if (newPayment > remaining) {
      message.error(`You cannot pay more than the remaining amount (${remaining} PKR)`);
      return;
    }
    if (!newPayment || Number(newPayment) <= 0) {
      message.error("Enter a payment amount greater than 0");
      return;
    }

    const payload = {
      amount: newPayment,
      date: paymentDate ? paymentDate.toDate() : new Date(),
      note: paymentNote,
    };

    setPaying(true);
    try {
      const res = await updateSalePaymentService(selectedSale._id, payload);
      if (res?.data?.success && res?.data?.sale) {
        message.success("Payment updated");
        generateReceipt(res.data.sale); // <-- generate PDF
        fetchSales();
      } else {
        message.error(res?.data?.message || "Failed to update payment");
      }
    } finally {
      setPaying(false);
    }
    setIsModalOpen(false);
  };

  const closeDrawer = () => setDrawerVisible(false);

  // 👇 Calculation functions using watched fields
  const calcTotalAmount = () => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      const q = Number(item?.quantity) || 0;
      const sp = Number(item?.salePrice) || 0;
      return sum + q * sp;
    }, 0);
  };
  const calcRemaining = () => {
    const total = calcTotalAmount();
    return Math.max(total - (Number(initialPayment) || 0), 0);
  };

  // stock available for a product in this form (adds back the qty already in the sale being edited)
  const availableStock = (productId) => {
    const p = productById[productId];
    if (!p) return null;
    return (Number(p.stock) || 0) + (isEditing ? originalQty[productId] || 0 : 0);
  };
  const qtyInForm = (productId) =>
    (form.getFieldValue("items") || []).reduce(
      (sum, it) => sum + (it?.product === productId ? Number(it?.quantity) || 0 : 0),
      0
    );

  const handleSubmit = async (values) => {
    if (saving) return;
    setSaving(true);
    try {
      if (isEditing && editingId) {

        // 🟢 UPDATE EXISTING SALE
        const res = await updateSaleService(editingId, {
          customer: values.customer,
          items: values.items,
          invoiceNumber: values.invoiceNumber,
          initialPayment: values.initialPayment || 0,
          saleDate: values.saleDate ? values.saleDate.toDate() : new Date(),
        });


        if (res?.data?.success && res?.data?.sale) {
          message.success("Sale updated successfully");
          generateReceipt(res.data.sale);
          closeDrawer();
          fetchSales();
          fetchProducts(); // ✅ Refresh products to show updated stock
        } else {
          message.error(res?.data?.message || "Failed to update sale");
        }
      } else {
        // 🟢 CREATE NEW SALE
        const res = await createSaleService({
          customer: values.customer,
          items: values.items,
          invoiceNumber: values.invoiceNumber,
          initialPayment: values.initialPayment || 0,
          saleDate: values.saleDate ? values.saleDate.toDate() : new Date(),
        });

        if (res?.data?.success && res?.data?.sale) {
          message.success("Sale created successfully");
          generateReceipt(res.data.sale);
          closeDrawer();
          fetchSales();
          fetchProducts(); // ✅ Refresh products to show updated stock
        } else {
          message.error(res?.data?.message || "Failed to create sale");
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to save sale");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteSaleService(id);
      if (!res || res.status >= 400 || res.data?.success === false) {
        throw new Error(res?.data?.message);
      }
      message.success("Sale deleted and stock restored");
      fetchSales();
      fetchProducts(); // ✅ Refresh products to show restored stock
    } catch (error) {
      message.error(error?.message || "Failed to delete sale");
    }
  };

  // Re-print a receipt from the list (fills in details the list endpoint doesn't include)
  const handlePrint = (record) => {
    const cust = customers.find((c) => c._id === record.customer?._id) || {};
    generateReceipt({
      ...record,
      customer: { ...cust, ...(record.customer || {}), address: record.customer?.address || cust.address },
      items: record.items.map((it) => {
        const p = productById[it.product?._id] || {};
        return {
          ...it,
          product: {
            ...p,
            ...(it.product || {}),
            salePrice: it.salePrice,
            retailPrice: p.retailPrice,
            batchNumber: p.batchNumber,
            expirationDate: p.expirationDate,
            description: p.description,
          },
        };
      }),
    });
  };

  const calculateDiscount = (salePrice, retailPrice) => {
    if (!retailPrice || retailPrice === 0) return 0;
    return Math.max(((retailPrice - salePrice) / retailPrice) * 100, 0).toFixed(2);
  };

  // ---------- list filtering ----------
  const filteredSales = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sales.filter((s) => {
      if (statusFilter === "due" && !(Number(s.balance ?? (Number(s.totalAmount) || 0) - (s.paymentReceived || 0)) > 0)) return false;
      if (["paid", "partial", "unpaid"].includes(statusFilter) && s.paymentStatus !== statusFilter) return false;
      if (dateRange?.[0] && dateRange?.[1]) {
        const k = pkDayKey(saleDateOf(s));
        if (k < dateRange[0].format("YYYY-MM-DD") || k > dateRange[1].format("YYYY-MM-DD")) return false;
      }
      if (!q) return true;
      return (
        s.invoiceNumber?.toLowerCase().includes(q) ||
        s.customer?.name?.toLowerCase().includes(q) ||
        s.customer?.phone?.toLowerCase().includes(q) ||
        s.items?.some((it) => it.product?.name?.toLowerCase().includes(q))
      );
    });
  }, [sales, searchTerm, statusFilter, dateRange]);

  const stats = useMemo(() => {
    const todayKey = pk().format("YYYY-MM-DD");
    const monthKey = todayKey.slice(0, 7);
    const r = { todayCount: 0, todayAmount: 0, monthAmount: 0, monthCount: 0, due: 0, dueCount: 0, shown: 0 };
    sales.forEach((s) => {
      const k = pkDayKey(saleDateOf(s));
      const t = Number(s.totalAmount) || 0;
      if (k === todayKey) { r.todayCount++; r.todayAmount += t; }
      // month to date (same definition as the dashboard)
      if (k.slice(0, 7) === monthKey && k <= todayKey) { r.monthCount++; r.monthAmount += t; }
      const bal = Number(s.balance ?? t - (s.paymentReceived || 0)) || 0;
      if (bal > 0) { r.due += bal; r.dueCount++; }
    });
    filteredSales.forEach((s) => (r.shown += Number(s.totalAmount) || 0));
    return r;
  }, [sales, filteredSales]);

  const handleExport = () => {
    exportCSV(`Sales_${pk().format("YYYYMMDD")}`, [
      { title: "Invoice", value: (s) => s.invoiceNumber },
      { title: "Date", value: (s) => pkDayKey(saleDateOf(s)) },
      { title: "Customer", value: (s) => s.customer?.name },
      { title: "Phone", value: (s) => s.customer?.phone },
      { title: "Items", value: (s) => s.items.map((i) => `${i.product?.name || "?"} x${i.quantity} @${i.salePrice}`).join("; ") },
      { title: "Total", value: (s) => s.totalAmount },
      { title: "Paid", value: (s) => s.paymentReceived },
      { title: "Balance", value: (s) => s.balance },
      { title: "Status", value: (s) => s.paymentStatus },
    ], filteredSales);
  };

  // Table columns
  const columns = [
    {
      title: "Invoice",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      width: 120,
      sorter: (a, b) => new Date(saleDateOf(a) || 0) - new Date(saleDateOf(b) || 0),
      render: (v, r) => (
        <div>
          <Text strong>{v || "-"}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {saleDateOf(r) ? pk(saleDateOf(r)).format("DD MMM YYYY") : "-"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Customer",
      dataIndex: ["customer", "name"],
      key: "customer",
      width: 170,
      sorter: (a, b) => (a.customer?.name || "").localeCompare(b.customer?.name || ""),
      render: (name, r) => (
        <div>
          <div>{name || "-"}</div>
          {r.customer?.phone && <Text type="secondary" style={{ fontSize: 12 }}>{r.customer.phone}</Text>}
        </div>
      ),
    },
    {
      title: "Items",
      key: "items",
      width: 230,
      render: (_, record) => {
        const shown = record.items.slice(0, 2);
        const more = record.items.length - shown.length;
        return (
          <Tooltip
            title={
              record.items.length > 2
                ? record.items.map((item, idx) => (
                    <div key={idx}>{item.product?.name} x{item.quantity} (Price: {item.salePrice})</div>
                  ))
                : undefined
            }
          >
            <div style={{ fontSize: 13 }}>
              {shown.map((item, idx) => (
                <div key={idx}>
                  {item.product?.name} x{item.quantity} <Text type="secondary">(Price: {item.salePrice})</Text>
                </div>
              ))}
              {more > 0 && <Text type="secondary">+{more} more</Text>}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Total",
      key: "totalAmount",
      width: 110,
      align: "right",
      sorter: (a, b) => a.totalAmount - b.totalAmount,
      render: (_, record) => <strong>{money(record.totalAmount)}</strong>,
    },
    {
      title: "Paid",
      dataIndex: "paymentReceived",
      key: "paid",
      width: 100,
      align: "right",
      render: (paid) => money(paid),
    },
    {
      title: "Balance",
      key: "balance",
      width: 110,
      align: "right",
      sorter: (a, b) => a.balance - b.balance,
      render: (_, record) => (
        <span style={{ color: record.balance > 0 ? "#dc2626" : undefined, fontWeight: record.balance > 0 ? 600 : 400 }}>
          {money(record.balance)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "paymentStatus",
      key: "status",
      width: 100,
      align: "center",
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: isMobile ? undefined : "right",
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title={record.paymentStatus === "paid" ? "Fully paid" : "Add payment"}>
            <Button
              type="link"
              icon={<DollarCircleOutlined style={{ color: record.paymentStatus === "paid" ? undefined : "#52c41a" }} />}
              onClick={() => handleUpdatePaymentClick(record)}
              disabled={record.paymentStatus === "paid"}
            />
          </Tooltip>
          <Tooltip title="Edit sale">
            <Button
              type="link"
              icon={<EditOutlined style={{ color: "#1677ff" }} />}
              onClick={() => handleEditSale(record)}
            />
          </Tooltip>
          <Tooltip title="Print receipt">
            <Button type="link" icon={<PrinterOutlined />} onClick={() => handlePrint(record)} />
          </Tooltip>
          <Popconfirm
            title="Delete this sale?"
            description="Stock for its items will be restored."
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const total = calcTotalAmount();
  const itemCount = (items || []).reduce((s, it) => s + (Number(it?.quantity) || 0), 0);

  const customerOptions = customers.map((c) => ({
    value: c._id,
    label: `${c.name}${c.phone ? ` · ${c.phone}` : c.email ? ` (${c.email})` : ""}`,
    search: `${c.name} ${c.phone || ""} ${c.email || ""}`.toLowerCase(),
  }));

  const productOptions = products.map((p) => ({
    value: p._id,
    label: p.name,
    product: p,
    search: `${p.name} ${p.batchNumber || ""} ${p.category || ""} ${p.expirationDate ? dayjs(p.expirationDate).format("YYYY-MM-DD") : ""}`.toLowerCase(),
  }));

  const remainingInModal = selectedSale ? selectedSale.totalAmount - selectedSale.paymentReceived : 0;

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle="Record sales, take payments and print receipts"
        icon={<MoneyCollectOutlined />}
        extra={
          <>
            <Tooltip title="Refresh">
              <Button aria-label="Refresh sales" icon={<ReloadOutlined />} onClick={() => { fetchSales(); fetchProducts(); fetchCustomers(); }} />
            </Tooltip>
            <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={!filteredSales.length}>
              Export CSV
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openDrawer}>
              New Sale
            </Button>
          </>
        }
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}>
          <StatCard title="Today" value={money(stats.todayAmount)} sub={`${stats.todayCount} sale(s)`} icon={<CalendarOutlined />} loading={loading && !sales.length} />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard title="This month" value={money(stats.monthAmount)} sub={`${stats.monthCount} sale(s)`} icon={<MoneyCollectOutlined />} color="#2563eb" loading={loading && !sales.length} />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            title="Balance to collect"
            value={money(stats.due)}
            sub={`${stats.dueCount} sale(s) not fully paid`}
            icon={<ExclamationCircleOutlined />}
            color="#dc2626"
            valueColor={stats.due > 0 ? "#dc2626" : undefined}
            loading={loading && !sales.length}
            onClick={() => { setStatusFilter("due"); setSearchTerm(""); setDateRange(null); }}
          />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard title="Shown in list" value={money(stats.shown)} sub={`${filteredSales.length} sale(s)`} icon={<CheckCircleOutlined />} color="#16a34a" loading={loading && !sales.length} />
        </Col>
      </Row>

      <Card className="panel table-card">
        <div className="toolbar">
          <Input
            className="toolbar__search"
            placeholder="Search by invoice, customer, phone or product"
            prefix={<SearchOutlined />}
            allowClear
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Segmented
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "All", value: "all" },
              { label: "Due", value: "due" },
              { label: "Unpaid", value: "unpaid" },
              { label: "Partial", value: "partial" },
              { label: "Paid", value: "paid" },
            ]}
          />
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            allowEmpty={[true, true]}
            style={{ maxWidth: isMobile ? "100%" : 260 }}
            placeholder={["From", "To"]}
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredSales}
          rowKey="_id"
          loading={loading}
          size={isMobile ? "small" : "middle"}
          scroll={{ x: 1090 }}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (t) => `${t} sales` }}
          locale={{
            emptyText: (
              <Empty
                description={
                  searchTerm || statusFilter !== "all" || dateRange
                    ? "No sales match your filters"
                    : "No sales yet. Click “New Sale” to record one."
                }
              />
            ),
          }}
        />
      </Card>

      <Modal
        title="Payment Details"
        open={isModalOpen}
        onOk={handleUpdatePaymentOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Add Payment"
        confirmLoading={paying}
        width={isMobile ? "100%" : 700}
        style={isMobile ? { top: 12, maxWidth: "calc(100vw - 16px)" } : undefined}
      >
        {selectedSale && (
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: "1",
                label: "Make Payment",
                children: (
                  <div style={{ marginTop: 4 }}>
                    <div className="sale-summary">
                      <div className="sale-summary__row">
                        <span>Invoice</span>
                        <strong>{selectedSale.invoiceNumber} · {selectedSale.customer?.name}</strong>
                      </div>
                      <div className="sale-summary__row">
                        <span>Total</span>
                        <strong>{selectedSale.totalAmount} PKR</strong>
                      </div>
                      <div className="sale-summary__row">
                        <span>Paid</span>
                        <strong>{selectedSale.paymentReceived} PKR</strong>
                      </div>
                      <div className="sale-summary__row">
                        <span>Remaining</span>
                        <span style={{ color: "red", fontWeight: "bold" }}>{remainingInModal} PKR</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label>Amount:</label>
                      <Space.Compact style={{ width: "100%" }}>
                        <InputNumber
                          min={0}
                          max={undefined}
                          value={newPayment}
                          style={{ width: "100%" }}
                          onChange={setNewPayment}
                          placeholder="Enter amount"
                          status={newPayment > remainingInModal ? "error" : undefined}
                          autoFocus
                        />
                        <Button onClick={() => setNewPayment(Math.max(remainingInModal, 0))}>Full balance</Button>
                      </Space.Compact>
                      {newPayment > remainingInModal && (
                        <Text type="danger" style={{ fontSize: 12 }}>
                          More than the remaining {remainingInModal} PKR
                        </Text>
                      )}
                      {newPayment > 0 && newPayment <= remainingInModal && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Balance after this payment: {remainingInModal - newPayment} PKR
                        </Text>
                      )}
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label>Date:</label>
                      <DatePicker
                        value={paymentDate}
                        onChange={setPaymentDate}
                        style={{ width: "100%" }}
                        allowClear={false}
                      />
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <label>Note:</label>
                      <Input
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        placeholder="Optional note (e.g. Bank Transfer, Cheque)"
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: "2",
                label: `Payment History (${(selectedSale.payments || []).length})`,
                children: (
                  <Table
                    dataSource={selectedSale.payments || []}
                    rowKey={(record, index) => record._id || index}
                    pagination={false}
                    size="small"
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No payments yet" /> }}
                    columns={[
                      {
                        title: "Date",
                        dataIndex: "date",
                        render: (d) => (d ? dayjs(d).format("YYYY-MM-DD") : "-"),
                      },
                      {
                        title: "Amount",
                        dataIndex: "amount",
                        render: (a) => `${a} PKR`,
                      },
                      {
                        title: "Note",
                        dataIndex: "note",
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        )}
      </Modal>


      <Drawer
        title={isEditing ? "Edit Sale" : "Record New Sale"}
        width={isMobile ? "100%" : 880}
        onClose={closeDrawer}
        open={drawerVisible}
        styles={{ body: { paddingBottom: 16 } }}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <Text type="secondary">Total </Text>
              <Text strong style={{ fontSize: 18 }}>{money(total)}</Text>
            </div>
            <Space>
              <Button onClick={closeDrawer}>Cancel</Button>
              <Button key={`submit-${openSeq}`} type="primary" onClick={() => form.submit()} loading={saving}>
                Save Sale
              </Button>
            </Space>
          </div>
        }
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit} scrollToFirstError>
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item
                name="invoiceNumber"
                label="Invoice Number"
                rules={[
                  { required: true, whitespace: true, message: "Please enter an invoice number" },
                  {
                    validator: (_, v) =>
                      v && sales.some((s) => s.invoiceNumber === v.trim() && s._id !== editingId)
                        ? Promise.reject(new Error("This invoice number is already used"))
                        : Promise.resolve(),
                  },
                ]}
              >
                <Input style={{ width: "100%" }} placeholder="Enter invoice number" />
              </Form.Item>
            </Col>
            {/* Customer */}
            <Col xs={24} md={10}>
              <Form.Item
                name="customer"
                label="Customer"
                rules={[{ required: true, message: "Please select a customer" }]}
              >
                <Select
                  showSearch
                  placeholder="Type to find a customer"
                  options={customerOptions}
                  filterOption={(input, option) => option?.search?.includes(input.toLowerCase())}
                  notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No customer found. Add one on the Customers page." />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="saleDate"
                label="Sale Date"
                rules={[{ required: true, message: "Please select sale date" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ marginTop: 0 }}>Items</Divider>
          <Form.List
            name="items"
            rules={[
              {
                validator: async (_, list) => {
                  if (!list || list.length < 1) throw new Error("Add at least one item");
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => {
                  const row = items?.[index] || {};
                  const avail = row.product ? availableStock(row.product) : null;
                  const lineTotal = (Number(row.quantity) || 0) * (Number(row.salePrice) || 0);
                  return (
                    <div className="line-item" key={key}>
                      <Row gutter={8} align="top">
                        {/* Product Selector */}
                        <Col xs={24} md={9}>
                          <Form.Item
                            {...restField}
                            name={[name, "product"]}
                            label="Product"
                            rules={[{ required: true, message: "Select product" }]}
                          >
                            <Select
                              showSearch
                              placeholder="Search product"
                              options={productOptions}
                              filterOption={(input, option) => option?.search?.includes(input.toLowerCase())}
                              optionRender={(opt) => {
                                const p = opt.data.product;
                                const s = Number(p.stock) || 0;
                                return (
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <Text strong>{p.name}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      Batch: {p.batchNumber || "N/A"} | Exp:{" "}
                                      {p.expirationDate ? dayjs(p.expirationDate).format("YYYY-MM-DD") : "N/A"}
                                    </Text>
                                    <Text type={s <= 0 ? "danger" : "secondary"} style={{ fontSize: 12 }}>
                                      Stock: {s} · Price: {p.salePrice}
                                    </Text>
                                  </div>
                                );
                              }}
                              onChange={(productId) => {
                                const selectedProduct = products.find((p) => p._id === productId);
                                if (selectedProduct) {
                                  const currentItems = form.getFieldValue("items");
                                  currentItems[index] = {
                                    ...currentItems[index],
                                    salePrice: selectedProduct.salePrice,
                                    retailPrice: selectedProduct.retailPrice,
                                    discount: calculateDiscount(
                                      selectedProduct.salePrice,
                                      selectedProduct.retailPrice
                                    ),
                                    batchNumber: selectedProduct.batchNumber || "N/A",
                                    expiryDate: selectedProduct.expirationDate || null,
                                  };
                                  form.setFieldsValue({ items: currentItems });
                                  form.validateFields([["items", index, "quantity"]]).catch(() => {});
                                }
                              }}
                            />
                          </Form.Item>
                        </Col>

                        {/* Quantity */}
                        <Col xs={8} md={3}>
                          <Form.Item
                            {...restField}
                            name={[name, "quantity"]}
                            label="Qty"
                            dependencies={[["items", name, "product"]]}
                            extra={avail !== null ? <span style={{ fontSize: 12 }}>In stock: {avail}</span> : null}
                            rules={[
                              { required: true, message: "Enter quantity" },
                              {
                                validator: (_, v) => {
                                  const pid = form.getFieldValue(["items", name, "product"]);
                                  const a = pid ? availableStock(pid) : null;
                                  if (a === null || !v) return Promise.resolve();
                                  if (qtyInForm(pid) > a) {
                                    return Promise.reject(new Error(`Only ${a} in stock`));
                                  }
                                  return Promise.resolve();
                                },
                              },
                            ]}
                          >
                            <InputNumber min={1} style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>

                        {/* Sale Price */}
                        <Col xs={8} md={4}>
                          <Form.Item
                            {...restField}
                            name={[name, "salePrice"]}
                            label="Sale Price"
                            rules={[{ required: true, message: "Enter sale price" }]}
                          >
                            <InputNumber
                              min={0}
                              style={{ width: "100%" }}
                              onChange={(value) => {
                                const currentItems = form.getFieldValue("items");
                                const retail = currentItems[index]?.retailPrice || 0;
                                currentItems[index].salePrice = value;
                                currentItems[index].discount = calculateDiscount(value, retail);
                                form.setFieldsValue({ items: currentItems });
                              }}
                            />
                          </Form.Item>
                        </Col>

                        {/* Retail Price (Read-only display) */}
                        <Col xs={8} md={3}>
                          <Form.Item
                            {...restField}
                            name={[name, "retailPrice"]}
                            label="Retail"
                          >
                            <InputNumber min={0} disabled style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>

                        {/* Discount % (Auto Calculated) */}
                        <Col xs={8} md={2}>
                          <Form.Item
                            {...restField}
                            name={[name, "discount"]}
                            label="Disc %"
                          >
                            <InputNumber
                              min={0}
                              max={100}
                              precision={2}
                              disabled
                              style={{ width: "100%" }}
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={12} md={2}>
                          <Form.Item label="Total">
                            <div style={{ paddingTop: 5, fontWeight: 600, whiteSpace: "nowrap" }}>{lineTotal.toLocaleString()}</div>
                          </Form.Item>
                        </Col>

                        {/* Remove Button */}
                        <Col xs={4} md={1}>
                          <Form.Item label=" " colon={false}>
                            <Tooltip title="Remove item">
                              <Button
                                danger
                                type="text"
                                aria-label="Remove item"
                                disabled={fields.length === 1}
                                onClick={() => remove(name)}
                              >
                                ✕
                              </Button>
                            </Tooltip>
                          </Form.Item>
                        </Col>
                      </Row>
                    </div>
                  );
                })}

                <Form.ErrorList errors={errors} />
                <Button
                  type="dashed"
                  onClick={() =>
                    add({ product: undefined, quantity: 1, salePrice: 0, discount: 0 })
                  }
                  block
                  icon={<PlusOutlined />}
                >
                  Add Another Item
                </Button>
              </>
            )}
          </Form.List>

          <Divider />

          <Row gutter={16}>
            <Col xs={24} md={12}>
              {/* Initial Payment */}
              <Form.Item
                name="initialPayment"
                label={isEditing ? "Payment received" : "Initial Payment"}
                extra={isEditing ? "To record more money, use “Add Payment” (the $ button) in the sales list." : undefined}
                rules={
                  isEditing
                    ? []
                    : [
                        {
                          validator: (_, v) =>
                            (Number(v) || 0) > calcTotalAmount()
                              ? Promise.reject(new Error("Payment can't be more than the total"))
                              : Promise.resolve(),
                        },
                      ]
                }
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="Enter amount paid now"
                  disabled={isEditing}
                />
              </Form.Item>
              {!isEditing && (
                <Space wrap style={{ marginTop: -8, marginBottom: 12 }}>
                  <Button size="small" onClick={() => form.setFieldsValue({ initialPayment: calcTotalAmount() })}>
                    Paid in full
                  </Button>
                  <Button size="small" onClick={() => form.setFieldsValue({ initialPayment: 0 })}>
                    On credit (unpaid)
                  </Button>
                </Space>
              )}
            </Col>
            <Col xs={24} md={12}>
              <div className="sale-summary">
                <div className="sale-summary__row">
                  <span>Items</span>
                  <span>{itemCount}</span>
                </div>
                <div className="sale-summary__row">
                  <Text strong style={{ fontSize: 16 }}>Total Amount:</Text>
                  <Text strong style={{ fontSize: 16 }}>{total} PKR</Text>
                </div>
                <div className="sale-summary__row">
                  <span>Paid now</span>
                  <span>{Number(initialPayment) || 0} PKR</span>
                </div>
                <div className="sale-summary__row">
                  <span>Remaining Balance after Payment:</span>
                  <Text strong type={calcRemaining() > 0 ? "danger" : "success"}>{calcRemaining()} PKR</Text>
                </div>
              </div>
            </Col>
          </Row>
          {isEditing && (
            <Alert
              type="info"
              showIcon
              message="Saving will update stock for any changed items and download a new receipt."
            />
          )}
        </Form>
      </Drawer>
    </div>
  );
};

export default Sales;
