import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  Card,
  Row,
  Col,
  Tag,
  Segmented,
  Tooltip,
  Empty,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  StopOutlined,
  DollarOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { useIsMobile } from "../../hooks/useIsMobile";
import { money, num, pk, pkDayKey } from "../../utils/format";
import { exportCSV } from "../../utils/exportUtils";

export const LOW_STOCK = 10;
// whole calendar days (Pakistan time) from today until the expiry date
const daysToExpiry = (d) => (d ? dayjs(pkDayKey(d)).diff(dayjs(pk().format("YYYY-MM-DD")), "day") : null);
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
  // remount the submit button on every open so a stale loading/motion state from the
  // previous submit (drawer closed mid-animation) never sticks to it
  const [openSeq, setOpenSeq] = useState(0);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]); // ✅ store unique categories for filtering

  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const [stockFilter, setStockFilter] = useState(
    searchParams.get("filter") === "low" ? "low" : "all"
  );
  const [loadError, setLoadError] = useState(false);
  const isMobile = useIsMobile();

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
      setLoadError(false);
    } catch (error) {
      setLoadError(true);
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
    const lowerSearch = searchTerm.trim().toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name?.toLowerCase().includes(lowerSearch) ||
        p.category?.toLowerCase().includes(lowerSearch) ||
        p.batchNumber?.toLowerCase().includes(lowerSearch)
    ).filter((p) => {
      const stock = Number(p.stock) || 0;
      if (stockFilter === "low") return stock > 0 && stock <= LOW_STOCK;
      if (stockFilter === "out") return stock <= 0;
      if (stockFilter === "expiring") {
        const d = daysToExpiry(p.expirationDate);
        return d !== null && d <= 60;
      }
      return true;
    });
    setFilteredProducts(filtered);
  }, [searchTerm, products, stockFilter]);

  const stats = useMemo(() => {
    let low = 0, out = 0, expiring = 0, value = 0;
    products.forEach((p) => {
      const stock = Number(p.stock) || 0;
      if (stock <= 0) out++;
      else if (stock <= LOW_STOCK) low++;
      const d = daysToExpiry(p.expirationDate);
      if (d !== null && d <= 60) expiring++;
      value += stock * (Number(p.costPrice) || 0);
    });
    return { low, out, expiring, value };
  }, [products]);

  const handleExport = () => {
    exportCSV(`Products_${pk().format("YYYYMMDD")}`, [
      { title: "Name", value: (p) => p.name },
      { title: "Description", value: (p) => p.description },
      { title: "Category", value: (p) => p.category },
      { title: "Batch Number", value: (p) => p.batchNumber },
      { title: "Purchase Price", value: (p) => p.costPrice },
      { title: "Sale Price", value: (p) => p.salePrice },
      { title: "Retail Price", value: (p) => p.retailPrice },
      { title: "Stock", value: (p) => p.stock },
      { title: "Imported", value: (p) => (p.imported ? "Yes" : "No") },
      { title: "Date Purchased", value: (p) => pkDayKey(p.datePurchased) },
      { title: "Expiration Date", value: (p) => pkDayKey(p.expirationDate) },
    ], filteredProducts);
  };

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
    setOpenSeq((n) => n + 1);
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
      const res = await deleteProductService(id);
      if (res?.data && res.data.success === false) throw new Error(res.data.message);
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
      fixed: isMobile ? undefined : "left",
      width: 220,
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (name, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          {r.description && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: r.description }}>
              {r.description}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: "Purchase Price",
      dataIndex: "costPrice",
      key: "costPrice",
      align: "right",
      sorter: (a, b) => a.costPrice - b.costPrice,
      render: (v) => num(v),
    },
    {
      title: "Sale Price",
      dataIndex: "salePrice",
      key: "salePrice",
      align: "right",
      sorter: (a, b) => a.salePrice - b.salePrice,
      render: (v) => <strong>{num(v)}</strong>,
    },
    {
      title: "Retail Price",
      dataIndex: "retailPrice",
      key: "retailPrice",
      align: "right",
      sorter: (a, b) => a.retailPrice - b.retailPrice,
      render: (v) => num(v),
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      align: "center",
      sorter: (a, b) => a.stock - b.stock,
      render: (stock) => {
        const s = Number(stock) || 0;
        const color = s <= 0 ? "red" : s <= LOW_STOCK ? "orange" : "green";
        return (
          <Tooltip title={s <= 0 ? "Out of stock" : s <= LOW_STOCK ? "Low stock" : "In stock"}>
            <Tag color={color} style={{ minWidth: 44, textAlign: "center", marginInlineEnd: 0 }}>{s}</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      filters: categories.map((cat) => ({ text: cat, value: cat })), // ✅ filter options
      onFilter: (value, record) => (record.category || "General") === value,
      sorter: (a, b) => (a.category || "").localeCompare(b.category || ""),
      render: (c) => (c ? <Tag>{c}</Tag> : "-"),
    },
    {
      title: "Batch Number",
      dataIndex: "batchNumber",
      key: "batchNumber",
      sorter: (a, b) => (a.batchNumber || "").localeCompare(b.batchNumber || ""),
    },
    {
      title: "Expiration Date",
      dataIndex: "expirationDate",
      key: "expirationDate",
      render: (date) => {
        if (!date) return "-";
        const d = daysToExpiry(date);
        const txt = pkDayKey(date);
        if (d < 0) return <Tooltip title="Expired"><Tag color="red">{txt}</Tag></Tooltip>;
        if (d <= 60) return <Tooltip title={`Expires in ${d} day${d === 1 ? "" : "s"}`}><Tag color={d <= 30 ? "volcano" : "gold"}>{txt}</Tag></Tooltip>;
        return txt;
      },
      sorter: (a, b) =>
        new Date(a.expirationDate || 0) - new Date(b.expirationDate || 0),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: isMobile ? undefined : "right",
      width: 110,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} onClick={() => openDrawer(record)} />
          </Tooltip>
          <Popconfirm
            title="Delete this product?"
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
        title="Products"
        subtitle="Manage stock, prices and batches"
        icon={<ShoppingCartOutlined />}
        extra={
          <>
            <Tooltip title="Refresh">
              <Button aria-label="Refresh products" icon={<ReloadOutlined />} onClick={fetchProducts} />
            </Tooltip>
            <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={!filteredProducts.length}>
              Export CSV
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openDrawer()}
            >
              New Product
            </Button>
          </>
        }
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}>
          <StatCard title="Products" value={products.length} icon={<ShoppingCartOutlined />} loading={loading && !products.length} onClick={() => setStockFilter("all")} />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard title={`Low stock (≤ ${LOW_STOCK})`} value={stats.low} icon={<WarningOutlined />} color="#ea580c" loading={loading && !products.length} onClick={() => setStockFilter("low")} />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard title="Out of stock" value={stats.out} icon={<StopOutlined />} color="#dc2626" loading={loading && !products.length} onClick={() => setStockFilter("out")} />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard title="Stock value (cost)" value={money(stats.value)} icon={<DollarOutlined />} color="#16a34a" loading={loading && !products.length} />
        </Col>
      </Row>

      <Card className="panel table-card">
        <div className="toolbar">
          {/* ✅ Global Search Bar */}
          <Input
            className="toolbar__search"
            placeholder="Search by name, category, or batch number"
            prefix={<SearchOutlined />}
            allowClear
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Segmented
            value={stockFilter}
            onChange={setStockFilter}
            options={[
              { label: "All", value: "all" },
              { label: `Low (${stats.low})`, value: "low" },
              { label: `Out (${stats.out})`, value: "out" },
              { label: `Expiring (${stats.expiring})`, value: "expiring" },
            ]}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="_id"
          loading={loading}
          size={isMobile ? "small" : "middle"}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (t) => `${t} products`, size: isMobile ? "small" : "default" }}
          locale={{
            emptyText: (
              <Empty
                description={
                  loadError
                    ? "Couldn't load products. Click refresh to try again."
                    : searchTerm || stockFilter !== "all"
                    ? "No products match your search"
                    : "No products yet. Click “New Product” to add one."
                }
              />
            ),
          }}
        />
      </Card>

      <Drawer
        title={editingProduct ? "Edit Product" : "New Product"}
        width={isMobile ? "100%" : 460}
        onClose={closeDrawer}
        open={drawerVisible}
        destroyOnClose={false}
        styles={{ body: { paddingBottom: 24 } }}
      >

        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          scrollToFirstError
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
            rules={[{ required: true, whitespace: true, message: "Please enter product name" }]}
          >
            <Input placeholder="e.g. Panadol 500mg" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>

          {/* Imported Switch */}
          <Form.Item
            name="imported"
            label="Imported"
            valuePropName="checked"
            initialValue={false}
            extra="When on, purchase (−15%) and sale (−12%) prices are calculated from the retail price."
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="retailPrice"
                label="Retail Price"
                rules={[{ required: true, message: "Please enter retail price" }]}
              >
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item
                name="costPrice"
                label="Purchase Price"
                rules={[{ required: true, message: "Please enter purchase price" }]}
              >
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item
                name="salePrice"
                label="Sale Price"
                rules={[{ required: true, message: "Please enter sale price" }]}
              >
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={12}>
              <Form.Item name="stock" label="Stock">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name="category" label="Category">
                <Input list="product-categories" />
              </Form.Item>
              <datalist id="product-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Col>
          </Row>

          <Form.Item
            name="batchNumber"
            label="Batch Number"
            rules={[{ required: true, whitespace: true, message: "Please enter batch number" }]}
          >
            <Input />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="datePurchased"
                label="Date Purchased"
                rules={[{ required: true, message: "Please select purchase date" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="expirationDate" label="Expiration Date">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button onClick={closeDrawer} disabled={loading}>Cancel</Button>
              <Button key={`submit-${openSeq}`} type="primary" htmlType="submit" loading={loading}>
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
