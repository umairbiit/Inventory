import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../../services/customerService";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form] = Form.useForm();

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
  }, []);

  const openDrawer = (customer = null) => {
    setEditingCustomer(customer);
    if (customer) {
      form.setFieldsValue(customer);
    } else {
      form.resetFields();
    }
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setEditingCustomer(null);
    form.resetFields();
  };

  const onFinish = async (values) => {
    let res;
    if (editingCustomer) {
      res = await updateCustomer(editingCustomer._id, values);
    } else {
      res = await createCustomer(values);
    }

    if (res.success) {
      message.success(
        `Customer ${editingCustomer ? "updated" : "added"} successfully`
      );
      fetchCustomers();
      closeDrawer();
    } else {
      message.error(res.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteCustomer(id);
    if (res.success) {
      message.success("Customer deleted");
      fetchCustomers();
    } else {
      message.error(res.message || "Failed to delete customer");
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Address", dataIndex: "address", key: "address" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => openDrawer(record)}
          />
          <Popconfirm
            title="Are you sure to delete this customer?"
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openDrawer()}
        >
          New Customer
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={customers}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        title={editingCustomer ? "Edit Customer" : "New Customer"}
        width={400}
        onClose={closeDrawer}
        open={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Space>
            <Button onClick={closeDrawer}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {editingCustomer ? "Update" : "Add"}
            </Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  );
};

export default Customers;
