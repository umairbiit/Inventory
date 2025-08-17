import React, { useEffect, useState } from "react";
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
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import {
  getSales as fetchSalesService,
  createSale as createSaleService,
  deleteSale as deleteSaleService,
} from "../../services/saleServices";
import { getProducts as fetchProductsService } from "../../services/productServices";

const { Option } = Select;

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [form] = Form.useForm();

  // Fetch sales
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

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      const { data } = await fetchProductsService();
      setProducts(data.products);
    } catch (error) {
      message.error("Failed to fetch products");
    }
  };

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  const openDrawer = () => {
    form.resetFields();
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const handleSubmit = async (values) => {
    try {
      await createSaleService(values);
      message.success("Sale created successfully");
      closeDrawer();
      fetchSales();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to create sale");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSaleService(id);
      message.success("Sale deleted and stock restored");
      fetchSales();
    } catch (error) {
      message.error("Failed to delete sale");
    }
  };

  const columns = [
    { title: "Product", dataIndex: ["product", "name"], key: "product" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    { title: "Sale Price", dataIndex: "salePrice", key: "salePrice" },
    { title: "Discount", dataIndex: "discount", key: "discount" },
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
        <Popconfirm
          title="Are you sure to delete this sale?"
          onConfirm={() => handleDelete(record._id)}
          okText="Yes"
          cancelText="No"
        >
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openDrawer}>
          New Sale
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={sales}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        title="New Sale"
        width={400}
        onClose={closeDrawer}
        open={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item
            name="product"
            label="Product"
            rules={[{ required: true, message: "Please select a product" }]}
          >
            <Select placeholder="Select product">
              {products.map((p) => (
                <Option key={p._id} value={p._id}>
                  {p.name} (Stock: {p.stock})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: "Please enter quantity" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="discount" label="Discount">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={closeDrawer}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Create Sale
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default Sales;
