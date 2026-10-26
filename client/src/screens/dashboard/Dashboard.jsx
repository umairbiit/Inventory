import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button, Card, Col, Empty, List, Row, Segmented, Skeleton, Space, Table, Tag, Tooltip, Typography,
} from "antd";
import {
  DollarOutlined, FallOutlined, MoneyCollectOutlined, PlusOutlined, ReloadOutlined, RiseOutlined,
  ShoppingCartOutlined, TeamOutlined, WarningOutlined, BarChartOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, DashboardOutlined,
} from "@ant-design/icons";
import {
  Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis, Bar,
} from "recharts";
import dayjs from "dayjs";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import StatusTag from "../../components/StatusTag";
import ErrorState from "../../components/ErrorState";
import { getDashboard } from "../../services/reportServices";
import { money, moneyShort, fmtDate, pk, pkDayKey } from "../../utils/format";
import { UserContext } from "../../context/userContext";

const { Text } = Typography;

const greeting = () => {
  const h = pk().hour();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{dayjs(label).format("ddd, DD MMM")}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {money(p.value)}
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState("today");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getDashboard();
      setData(res);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const k = data?.[period] || {};
  const label = period === "today" ? "today" : "this month";

  const quickActions = (
    <Space wrap>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/sale?new=1")}>
        New sale
      </Button>
      <Button icon={<ShoppingCartOutlined />} onClick={() => navigate("/products")}>
        Products
      </Button>
      <Button icon={<BarChartOutlined />} onClick={() => navigate("/report")}>
        Reports
      </Button>
      <Tooltip title="Refresh">
        <Button aria-label="Refresh dashboard" icon={<ReloadOutlined />} onClick={load} loading={loading && !!data} />
      </Tooltip>
    </Space>
  );

  if (error && !data) {
    return (
      <>
        <PageHeader title="Dashboard" icon={<DashboardOutlined />} />
        <Card className="panel">
          <ErrorState title="Couldn't load the dashboard" onRetry={load} />
        </Card>
      </>
    );
  }

  const trend = data?.trend || [];
  const hasTrend = trend.some((d) => d.revenue || d.expenses);

  return (
    <div>
      <PageHeader
        title={`${greeting()}${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        subtitle={`Here's how the shop is doing · ${pk().format("dddd, DD MMM YYYY")}`}
        icon={<DashboardOutlined />}
        extra={quickActions}
      />

      <div style={{ marginBottom: 12 }}>
        <Segmented
          value={period}
          onChange={setPeriod}
          options={[
            { label: "Today", value: "today" },
            { label: "This month", value: "month" },
          ]}
        />
      </div>

      {/* KPIs */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={8} xxl={4}>
          <StatCard
            title={`Sales ${label}`}
            value={k.salesCount ?? 0}
            sub={k.salesCount ? `avg ${money(k.avgSale)}` : "no sales yet"}
            icon={<MoneyCollectOutlined />}
            loading={loading && !data}
            onClick={() => navigate("/sale")}
            testId="kpi-sales"
          />
        </Col>
        <Col xs={12} md={8} xxl={4}>
          <StatCard
            title="Revenue"
            value={money(k.revenue)}
            sub={`received ${money(k.received)}`}
            icon={<RiseOutlined />}
            color="#2563eb"
            loading={loading && !data}
            hint="Total invoiced amount after discounts"
          />
        </Col>
        <Col xs={12} md={8} xxl={4}>
          <StatCard
            title="Expenses"
            value={money(k.expenses)}
            icon={<FallOutlined />}
            color="#dc2626"
            loading={loading && !data}
            onClick={() => navigate("/expenses")}
          />
        </Col>
        <Col xs={12} md={8} xxl={4}>
          <StatCard
            title="Gross profit"
            value={money(k.grossProfit)}
            sub="revenue − cost of goods"
            icon={<DollarOutlined />}
            color="#16a34a"
            valueColor={k.grossProfit < 0 ? "#dc2626" : undefined}
            loading={loading && !data}
          />
        </Col>
        <Col xs={12} md={8} xxl={4}>
          <StatCard
            title="Net profit"
            value={money(k.profit)}
            sub="after expenses"
            icon={<BarChartOutlined />}
            color="#7c3aed"
            valueColor={k.profit < 0 ? "#dc2626" : "#16a34a"}
            loading={loading && !data}
            hint="Revenue − cost of goods − expenses"
          />
        </Col>
        <Col xs={12} md={8} xxl={4}>
          <StatCard
            title="Outstanding (all time)"
            value={money(data?.outstanding?.amount)}
            sub={`${data?.outstanding?.partial ?? 0} partial · ${data?.outstanding?.unpaid ?? 0} unpaid`}
            icon={<ExclamationCircleOutlined />}
            color="#ea580c"
            loading={loading && !data}
            onClick={() => navigate("/sale?status=unpaid,partial")}
            hint="Balance still to be collected on partial / unpaid sales"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Trend chart */}
        <Col xs={24} xl={16}>
          <Card className="panel" title="Sales trend · last 30 days" size="small">
            <div style={{ height: 300 }}>
              {loading && !data ? (
                <Skeleton active paragraph={{ rows: 7 }} />
              ) : !hasTrend ? (
                <div className="chart-empty">
                  <Empty description="No sales in the last 30 days" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fdbc0a" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#fdbc0a" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="date" tickFormatter={(d) => dayjs(d).format("DD MMM")} tick={{ fontSize: 11 }} minTickGap={18} />
                    <YAxis tickFormatter={moneyShort} tick={{ fontSize: 11 }} width={44} />
                    <RTooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#e0a400" fill="url(#gRev)" strokeWidth={2} />
                    <Bar dataKey="expenses" name="Expenses" fill="#fca5a5" barSize={8} />
                    <Line type="monotone" dataKey="received" name="Received" stroke="#2563eb" dot={false} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>

        {/* Stock alerts */}
        <Col xs={24} xl={8}>
          <Card
            className="panel"
            size="small"
            title={
              <span>
                <WarningOutlined style={{ color: "#ea580c", marginRight: 8 }} />
                Low stock {data?.lowStock ? <Tag color="orange">{data.lowStock.count}</Tag> : null}
              </span>
            }
            extra={<Link to="/products?filter=low">View</Link>}
            style={{ height: "100%" }}
          >
            {loading && !data ? (
              <Skeleton active />
            ) : (
              <List
                size="small"
                dataSource={data?.lowStock?.items || []}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`All products have more than ${data?.lowStock?.threshold ?? 10} in stock`} /> }}
                renderItem={(p) => (
                  <List.Item extra={<Tag color={p.stock <= 0 ? "red" : "orange"}>{p.stock <= 0 ? "Out of stock" : `${p.stock} left`}</Tag>}>
                    <List.Item.Meta
                      title={<span style={{ fontWeight: 500 }}>{p.name}</span>}
                      description={<Text type="secondary" style={{ fontSize: 12 }}>{[p.category, p.batchNumber].filter(Boolean).join(" · ")}</Text>}
                    />
                  </List.Item>
                )}
              />
            )}
            {!!data?.expiringSoon?.length && (
              <>
                <div style={{ fontWeight: 600, margin: "12px 0 4px" }}>
                  <ClockCircleOutlined style={{ color: "#dc2626", marginRight: 8 }} />
                  Expiring within 60 days
                </div>
                <List
                  size="small"
                  dataSource={data.expiringSoon}
                  renderItem={(p) => {
                    const days = dayjs(pkDayKey(p.expirationDate)).diff(dayjs(pk().format("YYYY-MM-DD")), "day");
                    return (
                      <List.Item extra={<Tag color={days < 0 ? "red" : days <= 30 ? "volcano" : "gold"}>{days < 0 ? "Expired" : `${days}d`}</Tag>}>
                        <List.Item.Meta
                          title={<span style={{ fontWeight: 500 }}>{p.name}</span>}
                          description={<Text type="secondary" style={{ fontSize: 12 }}>{fmtDate(p.expirationDate)} · {p.stock} in stock</Text>}
                        />
                      </List.Item>
                    );
                  }}
                />
              </>
            )}
          </Card>
        </Col>

        {/* Recent sales */}
        <Col xs={24} xl={12}>
          <Card className="panel" size="small" title="Recent sales" extra={<Link to="/sale">All sales</Link>}>
            <Table
              size="small"
              rowKey="_id"
              loading={loading && !data}
              dataSource={data?.recentSales || []}
              pagination={false}
              scroll={{ x: 520 }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No sales yet" /> }}
              columns={[
                {
                  title: "Invoice",
                  dataIndex: "invoiceNumber",
                  render: (v, r) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{v || "-"}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{pk(r.date).format("DD MMM, HH:mm")}</Text>
                    </div>
                  ),
                },
                { title: "Customer", dataIndex: "customerName", ellipsis: true },
                { title: "Total", dataIndex: "totalAmount", align: "right", render: money },
                { title: "Balance", dataIndex: "balance", align: "right", render: (v) => <span style={{ color: v > 0 ? "#dc2626" : undefined }}>{money(v)}</span> },
                { title: "Status", dataIndex: "paymentStatus", render: (s) => <StatusTag status={s} /> },
              ]}
            />
          </Card>
        </Col>

        {/* Top products / customers */}
        <Col xs={24} md={12} xl={6}>
          <Card className="panel" size="small" title="Top products · 30 days" style={{ height: "100%" }}>
            {loading && !data ? (
              <Skeleton active />
            ) : (
              <List
                size="small"
                dataSource={data?.topProducts || []}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No sales yet" /> }}
                renderItem={(p, i) => (
                  <List.Item extra={<Text strong>{money(p.revenue)}</Text>}>
                    <List.Item.Meta
                      avatar={<span className="rank">{i + 1}</span>}
                      title={<span style={{ fontWeight: 500 }}>{p.name}</span>}
                      description={<Text type="secondary" style={{ fontSize: 12 }}>{p.quantity} sold</Text>}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="panel" size="small" title="Top customers · 30 days" style={{ height: "100%" }} extra={<Link to="/customers"><TeamOutlined /></Link>}>
            {loading && !data ? (
              <Skeleton active />
            ) : (
              <List
                size="small"
                dataSource={data?.topCustomers || []}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No sales yet" /> }}
                renderItem={(c, i) => (
                  <List.Item extra={<Text strong>{money(c.revenue)}</Text>}>
                    <List.Item.Meta
                      avatar={<span className="rank">{i + 1}</span>}
                      title={<span style={{ fontWeight: 500 }}>{c.name}</span>}
                      description={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {c.sales} sale{c.sales === 1 ? "" : "s"}
                          {c.outstanding > 0 && <span style={{ color: "#dc2626" }}> · owes {money(c.outstanding)}</span>}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
