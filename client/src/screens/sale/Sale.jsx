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
  Typography,
  Divider,
  Row,
  Col,
  Modal,
} from "antd";
import { PlusOutlined, DeleteOutlined, DollarCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { generateReceipt } from "../../utils/generateReceipt";
import {
  getSales as fetchSalesService,
  createSale as createSaleService,
  deleteSale as deleteSaleService,
  updateSalePayment as updateSalePaymentService,
} from "../../services/saleServices";
import { getProducts as fetchProductsService } from "../../services/productServices";
import { getCustomers as fetchCustomersService } from "../../services/customerService";

const { Option } = Select;
const { Text } = Typography;

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [newPayment, setNewPayment] = useState(0);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [form] = Form.useForm();

  // 👇 Watch fields for live calculation
  const items = Form.useWatch("items", form);
  const initialPayment = Form.useWatch("initialPayment", form);

  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchCustomers();
  }, []);

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

  const openDrawer = () => {
    form.resetFields();
    form.setFieldsValue({
      customer: undefined,
      items: [{ product: undefined, quantity: 1, salePrice: 0, discount: 0 }],
      initialPayment: 0,
    });
    setDrawerVisible(true);
  };

  const handleUpdatePaymentClick = (record) => {
    setSelectedSale(record);
    setNewPayment(record.balance);
    setIsModalOpen(true);
  };

  const handleUpdatePaymentOk = async () => {
    const remaining = selectedSale.totalAmount - selectedSale.paymentReceived;
    if (newPayment > remaining) {
      message.error(`You cannot pay more than the remaining amount (${remaining} PKR)`);
      return;
    }

    const res = await updateSalePaymentService(selectedSale._id, newPayment);
    if (res?.data?.success && res?.data?.sale) {
      message.success("Payment updated");
      console.log(res.data)
      generateReceipt(res.data.sale); // <-- generate PDF
      fetchSales();
    } else {
      message.error(res?.data?.message || "Failed to update payment");
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
      const disc = Number(item?.discount) || 0;
      return sum + q * sp - disc;
    }, 0);
  };

  const calcRemaining = () => {
    const total = calcTotalAmount();
    return Math.max(total - (Number(initialPayment) || 0), 0);
  };

  const handleSubmit = async (values) => {
    try {
      const res = await createSaleService({
        customer: values.customer,
        items: values.items,
        initialPayment: values.initialPayment || 0,
      });

      // 👇 Assuming your backend returns created sale
      if (res?.data?.success && res?.data?.sale) {
        message.success("Sale created successfully");
        generateReceipt(res.data.sale); // <-- generate PDF
        closeDrawer();
        fetchSales();
      } else {
        message.error(res?.data?.message || "Failed to create sale");
      }
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

  // Table columns
  const columns = [
    {
      title: "Customer",
      dataIndex: ["customer", "name"],
      key: "customer",
    },
    {
      title: "Items",
      key: "items",
      render: (_, record) => (
        <div>
          {record.items.map((item, idx) => (
            <div key={idx}>
              {item.product?.name} x{item.quantity} (Price: {item.salePrice} – Disc:{" "}
              {item.discount})
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Total",
      key: "totalAmount",
      render: (_, record) => <span>{record.totalAmount} PKR</span>,
    },
    {
      title: "Paid",
      dataIndex: "paymentReceived",
      key: "paid",
      render: (paid) => `${paid} PKR`,
    },
    {
      title: "Balance",
      key: "balance",
      render: (_, record) => `${record.balance} PKR`,
    },
    {
      title: "Status",
      dataIndex: "paymentStatus",
      key: "status",
      render: (status) => (
        <span
          style={{
            color:
              status === "paid" ? "green" : status === "partial" ? "orange" : "red",
          }}
        >
          {status.toUpperCase()}
        </span>
      ),
    },
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
        <Space>
          <Button
            type="link"
            icon={<DollarCircleOutlined style={{ color: "#52c41a" }} />}
            onClick={() => handleUpdatePaymentClick(record)}
          >
          </Button>

          <Popconfirm
            title="Delete this sale?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
            >
            </Button>
          </Popconfirm>
        </Space>
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

      <Modal
        title="Update Payment"
        open={isModalOpen}
        onOk={handleUpdatePaymentOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Update"
      >
        {selectedSale && (
          <div>
            <p>
              Current Paid: {selectedSale.paymentReceived} /{" "}
              {selectedSale.totalAmount} PKR
            </p>
            <p>
              Remaining: {selectedSale.totalAmount - selectedSale.paymentReceived} PKR
            </p>

            <InputNumber
              min={0}
              // ✅ default to remaining balance or 0 if fully paid
              value={newPayment ?? Math.max(selectedSale.totalAmount - selectedSale.paymentReceived, 0)}
              style={{ width: "100%" }}
              onChange={setNewPayment} // ✅ This holds only the *installment amount*
              placeholder="Enter additional payment"
            />
          </div>
        )}
      </Modal>


      <Drawer
        title="Record New Sale"
        width={700}
        onClose={closeDrawer}
        open={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          {/* Customer */}
          <Form.Item
            name="customer"
            label="Customer"
            rules={[{ required: true, message: "Please select a customer" }]}
          >
            <Select placeholder="Select customer">
              {customers.map((c) => (
                <Option key={c._id} value={c._id}>
                  {c.name} ({c.email || "No email"})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider>Items</Divider>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Row gutter={8} key={key} style={{ marginBottom: 8 }}>
                    <Col span={9}>
                      <Form.Item
                        {...restField}
                        name={[name, "product"]}
                        label="Product"
                        rules={[{ required: true, message: "Select product" }]}
                      >
                        <Select
                          showSearch
                          placeholder="Search product"
                          optionFilterProp="data-search"
                          filterOption={(input, option) =>
                            option?.props["data-search"]
                              ?.toString()
                              ?.toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          onChange={(productId) => {
                            const selectedProduct = products.find((p) => p._id === productId);
                            if (selectedProduct) {
                              const currentItems = form.getFieldValue("items");
                              currentItems[index].salePrice = selectedProduct.salePrice;
                              form.setFieldsValue({ items: currentItems });
                            }
                          }}
                        >
                          {products.map((p) => {
                            const searchText = `${p.name} ${p.batchNumber || ""} ${p.expirationDate ? dayjs(p.expirationDate).format("YYYY-MM-DD") : ""
                              } ${p.stock || ""}`;

                            return (
                              <Option key={p._id} value={p._id} data-search={searchText}>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                  <Text strong>{p.name}</Text>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    Batch: {p.batchNumber || "N/A"} | Exp:{" "}
                                    {p.expirationDate
                                      ? dayjs(p.expirationDate).format("YYYY-MM-DD")
                                      : "N/A"}
                                  </Text>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    Stock: {p.stock}
                                  </Text>
                                </div>
                              </Option>
                            );
                          })}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, "quantity"]}
                        label="Qty"
                        rules={[{ required: true, message: "Enter quantity" }]}
                      >
                        <InputNumber min={1} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>

                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, "salePrice"]}
                        label="Price"
                        rules={[{ required: true, message: "Enter price" }]}
                      >
                        <InputNumber min={0} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>

                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, "discount"]}
                        label="Discount"
                      >
                        <InputNumber min={0} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>

                    <Col span={3} style={{ display: "flex", alignItems: "center" }}>
                      <Button danger onClick={() => remove(name)}>
                        X
                      </Button>
                    </Col>
                  </Row>
                ))}

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

          {/* Initial Payment */}
          <Form.Item name="initialPayment" label="Initial Payment">
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Enter amount paid now"
            />
          </Form.Item>

          <Text strong style={{ fontSize: 16, display: "block" }}>
            Total Amount: {calcTotalAmount()} PKR
          </Text>
          <Text style={{ fontSize: 16, display: "block", marginTop: 4 }}>
            Remaining Balance after Payment: {calcRemaining()} PKR
          </Text>

          <Form.Item style={{ marginTop: 16 }}>
            <Space>
              <Button onClick={closeDrawer}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Save Sale
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default Sales;
