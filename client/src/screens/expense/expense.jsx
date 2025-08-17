import React, { useEffect, useState } from "react";
import { Table, Button, Drawer, Form, Input, InputNumber, DatePicker, Space, Popconfirm, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getExpenses as fetchExpensesService,
  createExpense as createExpenseService,
  updateExpense as updateExpenseService,
  deleteExpense as deleteExpenseService,
} from "../../services/expenseServices";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [form] = Form.useForm();

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data } = await fetchExpensesService();
      setExpenses(data.expenses);
    } catch (error) {
      message.error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const openDrawer = (expense = null) => {
    setEditingExpense(expense);
    if (expense) {
      form.setFieldsValue({
        description: expense.description,
        amount: expense.amount,
        date: expense.date ? dayjs(expense.date) : null,
      });
    } else {
      form.resetFields();
    }
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setEditingExpense(null);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        description: values.description,
        amount: values.amount,
        date: values.date ? values.date.toISOString() : undefined,
      };

      if (editingExpense) {
        await updateExpenseService(editingExpense._id, payload);
        message.success("Expense updated successfully");
      } else {
        await createExpenseService(payload);
        message.success("Expense created successfully");
      }

      closeDrawer();
      fetchExpenses();
    } catch (error) {
      message.error("Failed to save expense");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteExpenseService(id);
      message.success("Expense deleted successfully");
      fetchExpenses();
    } catch (error) {
      message.error("Failed to delete expense");
    }
  };

  const columns = [
    { title: "Description", dataIndex: "description", key: "description" },
    { title: "Amount", dataIndex: "amount", key: "amount" },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (text) => (text ? dayjs(text).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => openDrawer(record)} />
          <Popconfirm
            title="Are you sure to delete this expense?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()}>
          New Expense
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={expenses}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        title={editingExpense ? "Edit Expense" : "New Expense"}
        width={400}
        onClose={closeDrawer}
        open={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter description" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: "Please enter amount" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item name="date" label="Date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={closeDrawer}>Cancel</Button>
              <Button type="primary" htmlType="submit">
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
