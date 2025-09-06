import React, { useContext, useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MoneyCollectOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, theme, Breadcrumb, Typography, Avatar } from "antd";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { UserContext } from "../../context/userContext";

import Products from "../products/Products";
import Customer from "../customer/Customer";
import Expenses from "../expense/Expense";
import Sales from "../sale/Sale";
import Report from "../report/Report";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const { user, logoutUser } = useContext(UserContext);
  const location = useLocation();

  // Determine selected menu key based on current route
  const selectedKey = (() => {
    if (location.pathname.startsWith("/products")) return "1";
    if (location.pathname.startsWith("/expenses")) return "2";
    if (location.pathname.startsWith("/sale")) return "3";
    if (location.pathname.startsWith("/customers")) return "4";
    if (location.pathname.startsWith("/report")) return "5";
    return "1";
  })();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
      >
        {/* Logo / App Name */}
        <div
          style={{
            height: 64,
            margin: 16,
            color: "white",
            fontWeight: "bold",
            fontSize: 18,
            textAlign: "center",
            lineHeight: "64px",
          }}
        >
          Glow Up Inventory
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={[
            {
              key: "1",
              icon: <ShoppingCartOutlined />,
              label: <Link to="/products">Products</Link>,
            },
            {
              key: "2",
              icon: <DollarOutlined />,
              label: <Link to="/expenses">Expenses</Link>,
            },
            {
              key: "3",
              icon: <MoneyCollectOutlined />,
              label: <Link to="/sale">Sale</Link>,
            },
            {
              key: "4",
              icon: <TeamOutlined />,
              label: <Link to="/customers">Customers</Link>,
            },
            {
              key: "5",
              icon: <BarChartOutlined />,
              label: <Link to="/report">Report</Link>,
            },
          ]}
        />
      </Sider>

      {/* Main Content */}
      <Layout>
        <Header
          style={{
            padding: "0 16px",
            background: colorBgContainer,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Collapse Button */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />

          {/* User Info + Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar icon={<UserOutlined />} />
            <Text strong>{user?.name || "User"}</Text>
            <Button type="primary" danger icon={<LogoutOutlined />} onClick={logoutUser}>
              Logout
            </Button>
          </div>
        </Header>

        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {/* Breadcrumb */}
          <Breadcrumb style={{ marginBottom: 16 }}>
            <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item>
              {location.pathname.replace("/", "").toUpperCase() || "HOME"}
            </Breadcrumb.Item>
          </Breadcrumb>

          {/* Routes */}
          <Routes>
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customer />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/sale" element={<Sales />} />
            <Route path="/report" element={<Report />} />
            <Route path="/" element={<Products />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
