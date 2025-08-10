import { useState } from "react";
import { Form, Input, Button, App } from "antd";
import { Loader } from "../../animations/pageLoader/Loader";
import { registerUser } from "../../services/authServices";
import { Link } from "react-router-dom"; // <-- Add this for navigation

const Register = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await registerUser(values);
      if (res.status === 201) {
        message.success(
          res.data.message ||
            "Registration successful! Check your email to verify."
        );
        form.resetFields();
      } else {
        message.error(res?.data?.message || "Registration failed");
      }
    } catch (err) {
      message.error(
        err.response?.data?.message || "Something went wrong, please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col-reverse md:flex-row">
      <Loader isLoading={loading} />

      {/* Left: Image Section */}
      <div className="w-full md:w-2/3 max-h-screen">
        <img
          src="https://images.unsplash.com/photo-1712554652588-3cb5dada0d07?fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000"
          alt="Register Visual"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right: Form Section */}
      <div className="w-full md:w-1/3 flex items-center justify-center p-8 bg-white max-h-screen">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-6">Register</h1>
          <Form
            form={form}
            name="registerForm"
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: "Please enter your name!" }]}
            >
              <Input placeholder="Enter name" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please enter your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input placeholder="Enter email" />
            </Form.Item>

            <Form.Item
              label="Phone Number"
              name="phoneno"
              rules={[
                { required: true, message: "Please enter your phone number!" },
              ]}
            >
              <Input placeholder="Enter phone number" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please enter your password!" },
                { min: 6, message: "Password must be at least 6 characters!" },
              ]}
              hasFeedback
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>

            {/* Confirm Password */}
            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={["password"]}
              hasFeedback
              rules={[
                { required: true, message: "Please confirm your password!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match!"));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Confirm password" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                className="bg-blue-500 hover:bg-blue-600"
              >
                Register
              </Button>
            </Form.Item>

            {/* Link to Login */}
            <div className="text-center text-sm">
              Already registered?{" "}
              <Link to="/login" className="text-blue-500 hover:underline">
                Login here
              </Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Register;
