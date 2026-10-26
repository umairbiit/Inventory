import React, { useEffect, useMemo, useState } from "react";
import {
  Table, Button, Drawer, Form, Input, InputNumber, DatePicker, Space, Popconfirm, message,
  Card, Row, Col, Tooltip, Empty, Segmented,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, DollarOutlined, DownloadOutlined,
  ReloadOutlined, CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getExpenses as fetchExpensesService,
  createExpense as createExpenseService,
  updateExpense as updateExpenseService,
  deleteExpense as deleteExpenseService,
} from "../../services/expenseServices";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useIsMobile } from "../../hooks/useIsMobile";
import { money, pk, pkDayKey, expenseDateOf } from "../../utils/format";
import { exportCSV } from "../../utils/exportUtils";

// The expense services return error responses instead of throwing,
// so treat any non-2xx / success:false response as a failure.
const ensureOk = (res) => {
  if (!res || res.status >= 400 || res.data?.success === false) {
    throw new Error(res?.data?.message || "Request failed");
  }
  return res;
};

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  // remount the submit button on every open so a stale loading/motion state from the
  // previous submit (drawer closed mid-animation) never sticks to it
  const [openSeq, setOpenSeq] = useState(0);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [period, setPeriod] = useState("all");
  const isMobile = useIsMobile();

  const [form] = Form.useForm();

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data } = ensureOk(await fetchExpensesService());
      setExpenses(data.expenses || []);
    } catch (error) {
      message.error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const todayKey = pk().format("YYYY-MM-DD");
    const monthKey = todayKey.slice(0, 7);
    const lastMonthKey = pk().subtract(1, "month").format("YYYY-MM");
    return expenses
      .filter((e) => !q || e.description?.toLowerCase().includes(q) || String(e.amount).includes(q))
      .filter((e) => {
        if (period === "all") return true;
        const k = pkDayKey(expenseDateOf(e));
        if (period === "today") return k === todayKey;
        if (period === "month") return k.slice(0, 7) === monthKey;
        if (period === "last") return k.slice(0, 7) === lastMonthKey;
        return true;
      });
  }, [expenses, searchTerm, period]);

  const stats = useMemo(() => {
    const todayKey = pk().format("YYYY-MM-DD");
    let today = 0, month = 0, shown = 0;
    expenses.forEach((e) => {
      const k = pkDayKey(expenseDateOf(e));
      const a = Number(e.amount) || 0;
      if (k === todayKey) today += a;
      if (k.slice(0, 7) === todayKey.slice(0, 7) && k <= todayKey) month += a;
    });
    filtered.forEach((e) => (shown += Number(e.amount) || 0));
    return { today, month, shown };
  }, [expenses, filtered]);

  const openDrawer = (expense = null) => {
    setEditingExpense(expense);
    if (expense) {
      form.setFieldsValue({
        description: expense.description,
        amount: expense.amount,
        date: expenseDateOf(expense) ? dayjs(expenseDateOf(expense)) : null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ date: dayjs() });
    }
    setDrawerVisible(true);
    setOpenSeq((n) => n + 1);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setEditingExpense(null);
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        description: values.description,
        amount: values.amount,
        date: values.date ? values.date.toISOString() : undefined,
      };

      if (editingExpense) {
        ensureOk(await updateExpenseService(editingExpense._id, payload));
        message.success("Expense updated successfully");
      } else {
        ensureOk(await createExpenseService(payload));
        message.success("Expense created successfully");
      }

      closeDrawer();
      fetchExpenses();
    } catch (error) {
      message.error(error?.message && error.message !== "Request failed" ? error.message : "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      ensureOk(await deleteExpenseService(id));
      message.success("Expense deleted successfully");
      fetchExpenses();
    } catch (error) {
      message.error("Failed to delete expense");
    }
  };

  const handleExport = () => {
    exportCSV(`Expenses_${pk().format("YYYYMMDD")}`, [
      { title: "Date", value: (e) => pkDayKey(expenseDateOf(e)) },
      { title: "Description", value: (e) => e.description },
      { title: "Amount", value: (e) => e.amount },
    ], filtered);
  };

  const columns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      sorter: (a, b) => (a.description || "").localeCompare(b.description || ""),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
      render: (v) => <strong>{money(v)}</strong>,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      defaultSortOrder: "descend",
      sorter: (a, b) => new Date(expenseDateOf(a) || 0) - new Date(expenseDateOf(b) || 0),
      render: (_, r) => pkDayKey(expenseDateOf(r)) || "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} onClick={() => openDrawer(record)} />
          </Tooltip>
          <Popconfirm
            title="Delete this expense?"
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
        title="Expenses"
        subtitle="Track shop running costs"
        icon={<DollarOutlined />}
        extra={
          <>
            <Tooltip title="Refresh">
              <Button aria-label="Refresh expenses" icon={<ReloadOutlined />} onClick={fetchExpenses} />
            </Tooltip>
            <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={!filtered.length}>
              Export CSV
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()}>
              New Expense
            </Button>
          </>
        }
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={8}>
          <StatCard title="Today" value={money(stats.today)} icon={<CalendarOutlined />} color="#dc2626" loading={loading && !expenses.length} />
        </Col>
        <Col xs={12} md={8}>
          <StatCard title="This month" value={money(stats.month)} icon={<CalendarOutlined />} color="#ea580c" loading={loading && !expenses.length} />
        </Col>
        <Col xs={24} md={8}>
          <StatCard title="Shown in list" value={money(stats.shown)} sub={`${filtered.length} expense(s)`} icon={<DollarOutlined />} loading={loading && !expenses.length} />
        </Col>
      </Row>

      <Card className="panel table-card">
        <div className="toolbar">
          <Input
            className="toolbar__search"
            placeholder="Search expenses"
            prefix={<SearchOutlined />}
            allowClear
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Segmented
            value={period}
            onChange={setPeriod}
            options={[
              { label: "All", value: "all" },
              { label: "Today", value: "today" },
              { label: "This month", value: "month" },
              { label: "Last month", value: "last" },
            ]}
          />
        </div>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="_id"
          loading={loading}
          size={isMobile ? "small" : "middle"}
          scroll={{ x: 560 }}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (t) => `${t} expenses` }}
          locale={{
            emptyText: (
              <Empty description={searchTerm || period !== "all" ? "No expenses match your filters" : "No expenses yet. Click “New Expense” to add one."} />
            ),
          }}
        />
      </Card>

      <Drawer
        title={editingExpense ? "Edit Expense" : "New Expense"}
        width={isMobile ? "100%" : 400}
        onClose={closeDrawer}
        open={drawerVisible}
        styles={{ body: { paddingBottom: 24 } }}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, whitespace: true, message: "Please enter description" }]}
          >
            <Input placeholder="e.g. Electricity bill, Rent, Transport" />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: "Please enter amount" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} addonBefore="Rs" />
          </Form.Item>

          <Form.Item name="date" label="Date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={closeDrawer}>Cancel</Button>
              <Button key={`submit-${openSeq}`} type="primary" htmlType="submit" loading={saving}>
                {editingExpense ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default Expenses;
