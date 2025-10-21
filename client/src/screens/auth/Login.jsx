import { useContext, useState } from "react";
import { Form, Input, Button, App } from "antd";
import { Loader } from "../../animations/pageLoader/Loader";
import { signInUser } from "../../services/authServices";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";

const Login = () => {
  const { loginUser } = useContext(UserContext);
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await signInUser(values);
      if (res.status === 200) {
        message.success("Login successful!");
        navigate("/");
        loginUser(res.data?.user);
      } else {
        message.error(res?.data.message || "Login failed");
      }
    } catch (err) {
      message.error("Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Loader isLoading={loading} />

      {/* Left: Form Section */}
      <div className="w-full md:w-1/3 flex items-center justify-center p-8 bg-white max-h-screen">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
          <Form
            form={form}
            name="loginForm"
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please enter your email!" },
                {
                  type: "email",
                  message: "The input is not valid E-mail!",
                },
              ]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please enter your password!" },
              ]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                className="bg-blue-500 hover:bg-blue-600"
              >
                Login
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>

      {/* Right: Image Section */}
      <div className="w-full md:w-2/3 max-h-screen">
        <img
          src="https://images.unsplash.com/photo-1710379739424-b3b6994ed159?fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDEzfHx8ZW58MHx8fHx8&ixlib=rb-4.0.3&q=60&w=3000"
          alt="Login Visual"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default Login;
