import "./App.css";
import axios from "axios";
import { useContext, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { UserContext } from "./context/userContext";
import Login from "./screens/auth/Login";
import "antd/dist/reset.css";
import Register from "./screens/auth/Register";
import VerifyEmail from "./screens/auth/VerifyEmail";
import ForgotPassword from "./screens/auth/ForgotPassword";
import ResetPassword from "./screens/auth/ResetPassword";
import Layout from "./screens/Layout/MainLayout";

axios.defaults.withCredentials = true;

function App() {
  const { user, logoutUser } = useContext(UserContext);

  const handleUnauthorizedResponse = () => {
    logoutUser();
    navigate("/");
  };

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response && error.response.status === 401) {
          handleUnauthorizedResponse();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <div className="body custom-font">
      {user && user.type === "admin" ? (
        <Layout />
      ) : (
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      )}
    </div>
  );
}

export default App;
