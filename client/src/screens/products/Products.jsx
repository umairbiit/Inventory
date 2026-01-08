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
  Switch,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getProducts as fetchProductsService,
  createProduct as createProductService,
  updateProduct as updateProductService,
  deleteProduct as deleteProductService,
} from "../../services/productServices";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]); // ✅ store unique categories for filtering

  const [form] = Form.useForm();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await fetchProductsService();
      setProducts(data.products);
      setFilteredProducts(data.products);
      const uniqueCategories = [
        ...new Set(data.products.map((p) => p.category || "General")),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      message.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ✅ Global search filtering
  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name?.toLowerCase().includes(lowerSearch) ||
        p.category?.toLowerCase().includes(lowerSearch) ||
        p.batchNumber?.toLowerCase().includes(lowerSearch)
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const openDrawer = (product = null) => {
    setEditingProduct(product);
    if (product) {
      form.setFieldsValue({
        ...product,
        expirationDate: product.expirationDate
          ? dayjs(product.expirationDate)
          : null,
        datePurchased: product.datePurchased
          ? dayjs(product.datePurchased)
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
    setLoading(true);
    try {
      const payload = {
        ...values,
        expirationDate: values.expirationDate
          ? values.expirationDate.toDate()
          : null,
        datePurchased: values.datePurchased
          ? values.datePurchased.toDate()
          : null,
      };

      let response;
      if (editingProduct) {
        response = await updateProductService(editingProduct._id, payload);
      } else {
        response = await createProductService(payload);
      }

      // ✅ Validate response before showing success
      if (response?.data?.success) {
        message.success(
          editingProduct
            ? "Product updated successfully"
            : "Product created successfully"
        );
        closeDrawer();
        fetchProducts();
      } else {
        // Handle unexpected response format
        throw new Error(response?.data?.message || "Unexpected response from server");
      }
    } catch (error) {
      console.error("Product submission error:", error);

      if (error.response?.data?.message?.includes("duplicate key")) {
        message.error("Batch number already exists");
      } else if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error(error.message || "Failed to save product");
      }
    } finally {
      setLoading(false);
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

  // ✅ Column definitions with sorting & filtering
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Purchase Price",
      dataIndex: "costPrice",
      key: "costPrice",
      sorter: (a, b) => a.costPrice - b.costPrice,
    },
    {
      title: "Sale Price",
      dataIndex: "salePrice",
      key: "salePrice",
      sorter: (a, b) => a.salePrice - b.salePrice,
    },
    {
      title: "Retail Price",
      dataIndex: "retailPrice",
      key: "retailPrice",
      sorter: (a, b) => a.retailPrice - b.retailPrice,
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      sorter: (a, b) => a.stock - b.stock,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      filters: categories.map((cat) => ({ text: cat, value: cat })), // ✅ filter options
      onFilter: (value, record) => record.category === value,
      sorter: (a, b) => a.category.localeCompare(b.category),
    },
    {
      title: "Batch Number",
      dataIndex: "batchNumber",
      key: "batchNumber",
      sorter: (a, b) => a.batchNumber.localeCompare(b.batchNumber),
    },
    {
      title: "Expiration Date",
      dataIndex: "expirationDate",
      key: "expirationDate",
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD") : "-"),
      sorter: (a, b) =>
        new Date(a.expirationDate || 0) - new Date(b.expirationDate || 0),
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

        {/* ✅ Global Search Bar */}
        <Input
          placeholder="Search by name, category, or batch number"
          prefix={<SearchOutlined />}
          allowClear
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 300 }}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={filteredProducts}
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

        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          onValuesChange={(changedValues, allValues) => {
            const { imported, retailPrice } = allValues;

            // When imported is true and retailPrice changes
            if (imported && changedValues.retailPrice !== undefined) {
              const retail = changedValues.retailPrice || 0;

              const cost = Math.round(retail - retail * 0.15); // -15%
              const sale = Math.round(retail - retail * 0.12); // -12%

              form.setFieldsValue({
                costPrice: cost,
                salePrice: sale,
              });
            }
          }}
        >
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

          {/* Imported Switch */}
          <Form.Item
            name="imported"
            label="Imported"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <Form.Item
            name="costPrice"
            label="Purchase Price"
            rules={[{ required: true, message: "Please enter purchase price" }]}
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

          <Form.Item
            name="retailPrice"
            label="Retail Price"
            rules={[{ required: true, message: "Please enter retail price" }]}
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

          <Form.Item
            name="datePurchased"
            label="Date Purchased"
            rules={[{ required: true, message: "Please select purchase date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="expirationDate" label="Expiration Date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={closeDrawer} disabled={loading}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
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
