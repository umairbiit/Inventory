import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Space,
  Popconfirm,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getProducts as fetchProductsService,
  createProduct as createProductService,
  updateProduct as updateProductService,
  deleteProduct as deleteProductService,
} from "../../services/productServices";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [form] = Form.useForm();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await fetchProductsService();
      setProducts(data.products);
    } catch (error) {
      message.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openDrawer = (product = null) => {
    setEditingProduct(product);
    if (product) {
      form.setFieldsValue({
        ...product,
        expirationDate: product.expirationDate
          ? dayjs(product.expirationDate)
          : null,
      });
    } else {
      form.resetFields();
    }
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (values) => {
    try {
      // Convert expirationDate to plain Date object
      const payload = {
        ...values,
        expirationDate: values.expirationDate
          ? values.expirationDate.toDate()
          : null,
      };

      if (editingProduct) {
        await updateProductService(editingProduct._id, payload);
        message.success("Product updated successfully");
      } else {
        await createProductService(payload);
        message.success("Product created successfully");
      }
      closeDrawer();
      fetchProducts();
    } catch (error) {
      if (error.response?.data?.message?.includes("duplicate key")) {
        message.error("Batch number already exists");
      } else {
        message.error(error.response?.data?.message || "Failed to save product");
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProductService(id);
      message.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      message.error("Failed to delete product");
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Description", dataIndex: "description", key: "description" },
    { title: "Cost Price", dataIndex: "costPrice", key: "costPrice" },
    { title: "Sale Price", dataIndex: "salePrice", key: "salePrice" },
    { title: "Stock", dataIndex: "stock", key: "stock" },
    { title: "Category", dataIndex: "category", key: "category" },
    {
      title: "Batch Number",
      dataIndex: "batchNumber",
      key: "batchNumber",
    },
    {
      title: "Expiration Date",
      dataIndex: "expirationDate",
      key: "expirationDate",
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => openDrawer(record)} />
          <Popconfirm
            title="Are you sure to delete this product?"
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
          New Product
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        title={editingProduct ? "Edit Product" : "New Product"}
        width={400}
        onClose={closeDrawer}
        open={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter product name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="costPrice"
            label="Cost Price"
            rules={[{ required: true, message: "Please enter cost price" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            name="salePrice"
            label="Sale Price"
            rules={[{ required: true, message: "Please enter sale price" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item name="stock" label="Stock">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item name="category" label="Category">
            <Input />
          </Form.Item>

          <Form.Item
            name="batchNumber"
            label="Batch Number"
            rules={[{ required: true, message: "Please enter batch number" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="expirationDate" label="Expiration Date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={closeDrawer}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingProduct ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default Products;
