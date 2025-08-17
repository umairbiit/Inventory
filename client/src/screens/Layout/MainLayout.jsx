import React, { useContext, useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, theme } from "antd";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";

const { Header, Sider, Content } = Layout;

// Dummy Pages
const Products = () => <h2>Products Page</h2>;
const Expenses = () => <h2>Expenses Page</h2>;
const Profile = () => <h2>Profile Page</h2>;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const { user, logoutUser } = useContext(UserContext);


  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["1"]}
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
              icon: <UserOutlined />,
              label: <Link to="/profile">Profile</Link>,
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

          {/* Logout Button */}
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={logoutUser}
          >
            Logout
          </Button>
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
          {/* Routes */}
          <Routes>
            <Route path="/products" element={<Products />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<h2>Welcome! Select a menu item</h2>} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
