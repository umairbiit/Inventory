import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App as AntdApp, ConfigProvider } from "antd";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App";
import { UserProvider } from "./context/userContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#fdbc0a", // your orange color
        },
      }}
    >
      <AntdApp>
        <UserProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </UserProvider>
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>
);
