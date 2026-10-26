import React, { useContext, useEffect, useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  UserOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MoneyCollectOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, Typography, Avatar, Drawer, Grid, Tooltip } from "antd";
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";

import Dashboard from "../dashboard/Dashboard";
import Products from "../products/Products";
import Customer from "../customer/Customer";
import Expenses from "../expense/expense";
import Sales from "../sale/Sale";
import Report from "../report/Report";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const NAV = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/sale", icon: <MoneyCollectOutlined />, label: "Sale" },
  { key: "/products", icon: <ShoppingCartOutlined />, label: "Products" },
  { key: "/customers", icon: <TeamOutlined />, label: "Customers" },
  { key: "/expenses", icon: <DollarOutlined />, label: "Expenses" },
  { key: "/report", icon: <BarChartOutlined />, label: "Report" },
];

const TITLES = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/sale": "Sales",
  "/products": "Products",
  "/customers": "Customers",
  "/expenses": "Expenses",
  "/report": "Reports",
};

const Brand = ({ collapsed }) => (
  <div className={`brand${collapsed ? " brand--collapsed" : ""}`}>
    <span className="brand__logo">G</span>
    {!collapsed && <span className="brand__name">Glow Up Inventory</span>}
  </div>
);

const MainLayout = () => {
  const screens = Grid.useBreakpoint();
  const isDesktop = screens.lg !== false; // treat "unknown" (first render) as desktop
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logoutUser } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login", { replace: true });
  };

  // close the mobile menu after navigating
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const path = location.pathname === "/" ? "/dashboard" : location.pathname;
  const selectedKey = NAV.find((n) => path.startsWith(n.key))?.key || "/dashboard";
  const pageTitle = TITLES[location.pathname] || TITLES[selectedKey];

  useEffect(() => {
    document.title = `${pageTitle} · Glow Up Inventory`;
  }, [pageTitle]);

  const menu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={NAV.map((n) => ({
        key: n.key,
        icon: n.icon,
        label: <Link to={n.key}>{n.label}</Link>,
      }))}
    />
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar (desktop / tablet landscape) */}
      {isDesktop && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={220}
          className="app-sider"
        >
          <Brand collapsed={collapsed} />
          {menu}
        </Sider>
      )}

      {/* Sidebar drawer (mobile / tablet portrait) */}
      {!isDesktop && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={240}
          closable={false}
          className="app-nav-drawer"
          styles={{ body: { padding: 0, background: "#001529" } }}
        >
          <Brand />
          {menu}
        </Drawer>
      )}

      <Layout className="app-main">
        <Header className="app-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            {isDesktop ? (
              <Button
                type="text"
                aria-label={collapsed ? "Expand menu" : "Collapse menu"}
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="app-header__toggle"
              />
            ) : (
              <Button
                type="text"
                aria-label="Open menu"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
                className="app-header__toggle"
              />
            )}
            <Text strong className="app-header__title">
              {pageTitle}
            </Text>
          </div>

          {/* User Info + Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar icon={<UserOutlined />} style={{ background: "#fdbc0a" }} />
            {screens.sm !== false && <Text strong>{user?.name || "User"}</Text>}
            <Tooltip title={screens.sm === false ? "Logout" : undefined}>
              <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>
                {screens.sm === false ? null : "Logout"}
              </Button>
            </Tooltip>
          </div>
        </Header>

        <Content className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customer />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/sale" element={<Sales />} />
            <Route path="/report" element={<Report />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
