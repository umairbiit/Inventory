import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Tooltip,
  Empty,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TeamOutlined,
  DownloadOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  PhoneOutlined,
  MailOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../../services/customerService";
import { getSales } from "../../services/saleServices";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useIsMobile } from "../../hooks/useIsMobile";
import { money, saleDateOf, pk } from "../../utils/format";
import { exportCSV } from "../../utils/exportUtils";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [salesByCustomer, setSalesByCustomer] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  // remount the submit button on every open so a stale loading/motion state from the
  // previous submit (drawer closed mid-animation) never sticks to it
  const [openSeq, setOpenSeq] = useState(0);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm();
  const isMobile = useIsMobile();

  // Purchase totals per customer (read-only, from the existing sales API)
  const fetchSalesSummary = async () => {
    try {
      const res = await getSales();
      const map = {};
      (res?.data?.sales || []).forEach((s) => {
        const id = s.customer?._id || s.customer;
        if (!id) return;
        const total = Number(s.totalAmount) || 0;
        const paid = Number(s.paymentReceived) || 0;
        const m = (map[id] = map[id] || { count: 0, total: 0, balance: 0, last: null });
        m.count += 1;
        m.total += total;
        m.balance += Math.max(total - paid, 0);
        const d = saleDateOf(s);
        if (d && (!m.last || new Date(d) > new Date(m.last))) m.last = d;
      });
      setSalesByCustomer(map);
    } catch (e) {
      // summary is optional
    }
  };

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await getCustomers();
      if (res.success) {
        setCustomers(res.customers);
      } else {
        message.error(res.message || "Failed to fetch customers");
      }
    } catch (error) {
      message.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchSalesSummary();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.email, c.phone, c.address].some((v) => v?.toLowerCase().includes(q))
    );
  }, [customers, searchTerm]);

  const totals = useMemo(() => {
    let owing = 0, balance = 0;
    Object.values(salesByCustomer).forEach((m) => {
      if (m.balance > 0) {
        owing++;
        balance += m.balance;
      }
    });
    return { owing, balance };
  }, [salesByCustomer]);

  const openDrawer = (customer = null) => {
    setEditingCustomer(customer);
    if (customer) {
      form.setFieldsValue(customer);
    } else {
      form.resetFields();
    }
    setDrawerVisible(true);
    setOpenSeq((n) => n + 1);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setEditingCustomer(null);
    form.resetFields();
  };

  const onFinish = async (values) => {
    setSaving(true);
    let res;
    try {
      if (editingCustomer) {
        res = await updateCustomer(editingCustomer._id, values);
      } else {
        res = await createCustomer(values);
      }
    } finally {
      setSaving(false);
    }

    if (res?.success) {
      message.success(
        `Customer ${editingCustomer ? "updated" : "added"} successfully`
      );
      fetchCustomers();
      closeDrawer();
    } else {
      message.error(res?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteCustomer(id);
    if (res?.success) {
      message.success("Customer deleted");
      fetchCustomers();
    } else {
      message.error(res?.message || "Failed to delete customer");
    }
  };

  const handleExport = () => {
    exportCSV(`Customers_${pk().format("YYYYMMDD")}`, [
      { title: "Name", value: (c) => c.name },
      { title: "Email", value: (c) => c.email },
      { title: "Phone", value: (c) => c.phone },
      { title: "Address", value: (c) => c.address },
      { title: "Sales", value: (c) => salesByCustomer[c._id]?.count || 0 },
      { title: "Total Purchased", value: (c) => salesByCustomer[c._id]?.total || 0 },
      { title: "Balance Due", value: (c) => salesByCustomer[c._id]?.balance || 0 },
    ], filtered);
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (v) => <strong>{v}</strong>,
    },
    { title: "Email", dataIndex: "email", key: "email", render: (v) => v || "-" },
    { title: "Phone", dataIndex: "phone", key: "phone", render: (v) => v || "-" },
    { title: "Address", dataIndex: "address", key: "address", ellipsis: true, render: (v) => v || "-" },
    {
      title: "Sales",
      key: "sales",
      align: "center",
      sorter: (a, b) => (salesByCustomer[a._id]?.count || 0) - (salesByCustomer[b._id]?.count || 0),
      render: (_, r) => salesByCustomer[r._id]?.count || 0,
    },
    {
      title: "Total Purchased",
      key: "total",
      align: "right",
      sorter: (a, b) => (salesByCustomer[a._id]?.total || 0) - (salesByCustomer[b._id]?.total || 0),
      render: (_, r) => money(salesByCustomer[r._id]?.total || 0),
    },
    {
      title: "Balance Due",
      key: "balance",
      align: "right",
      sorter: (a, b) => (salesByCustomer[a._id]?.balance || 0) - (salesByCustomer[b._id]?.balance || 0),
      render: (_, r) => {
        const b = salesByCustomer[r._id]?.balance || 0;
        return <span style={{ color: b > 0 ? "#dc2626" : undefined, fontWeight: b > 0 ? 600 : 400 }}>{money(b)}</span>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      fixed: isMobile ? undefined : "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              onClick={() => openDrawer(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this customer?"
            description="This cannot be undone."
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

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Contacts, purchase history and balances"
        icon={<TeamOutlined />}
        extra={
          <>
            <Tooltip title="Refresh">
              <Button aria-label="Refresh customers" icon={<ReloadOutlined />} onClick={() => { fetchCustomers(); fetchSalesSummary(); }} />
            </Tooltip>
            <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={!filtered.length}>
              Export CSV
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openDrawer()}
            >
              New Customer
            </Button>
          </>
        }
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={8}>
          <StatCard title="Customers" value={customers.length} icon={<TeamOutlined />} loading={loading && !customers.length} />
        </Col>
        <Col xs={12} md={8}>
          <StatCard title="Customers with balance" value={totals.owing} icon={<ExclamationCircleOutlined />} color="#ea580c" />
        </Col>
        <Col xs={24} md={8}>
          <StatCard title="Total balance due" value={money(totals.balance)} icon={<ExclamationCircleOutlined />} color="#dc2626" valueColor={totals.balance > 0 ? "#dc2626" : undefined} />
        </Col>
      </Row>

      <Card className="panel table-card">
        <div className="toolbar">
          <Input
            className="toolbar__search"
            placeholder="Search by name, phone, email or address"
            prefix={<SearchOutlined />}
            allowClear
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="_id"
          loading={loading}
          size={isMobile ? "small" : "middle"}
          scroll={{ x: 960 }}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (t) => `${t} customers` }}
          locale={{
            emptyText: (
              <Empty description={searchTerm ? "No customers match your search" : "No customers yet. Click “New Customer” to add one."} />
            ),
          }}
        />
      </Card>

      <Drawer
        title={editingCustomer ? "Edit Customer" : "New Customer"}
        width={isMobile ? "100%" : 420}
        onClose={closeDrawer}
        open={drawerVisible}
        styles={{ body: { paddingBottom: 24 } }}
      >
        <Form layout="vertical" form={form} onFinish={onFinish} scrollToFirstError>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, whitespace: true, message: "Name is required" }]}
          >
            <Input placeholder="Customer or shop name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: "email", warningOnly: true, message: "This doesn't look like a valid email" }]}
          >
            <Input prefix={<MailOutlined className="muted" />} inputMode="email" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ pattern: /^[+\d][\d\s-]{6,}$/, warningOnly: true, message: "Check the phone number" }]}
          >
            <Input prefix={<PhoneOutlined className="muted" />} inputMode="tel" placeholder="03xx xxxxxxx" />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>

          {editingCustomer && salesByCustomer[editingCustomer._id] && (
            <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
              {salesByCustomer[editingCustomer._id].count} sale(s) · {money(salesByCustomer[editingCustomer._id].total)} purchased ·{" "}
              {money(salesByCustomer[editingCustomer._id].balance)} due
            </Typography.Paragraph>
          )}

          <Space>
            <Button onClick={closeDrawer}>Cancel</Button>
            <Button key={`submit-${openSeq}`} type="primary" htmlType="submit" loading={saving}>
              {editingCustomer ? "Update" : "Add"}
            </Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  );
};

export default Customers;
