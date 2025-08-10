import { useState } from "react";
import { Form, Input, Button, App } from "antd";
import { Loader } from "../../animations/pageLoader/Loader";
import { Link } from "react-router-dom";
import { sendResetEmail } from "../../services/authServices"; // <-- your API service

const ForgotPassword = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await sendResetEmail(values.email);
      if (res.status === 200) {
        message.success(
          res.data.message || "Reset link sent! Please check your email."
        );
        form.resetFields();
      } else {
        message.error(res?.data?.message || "Unable to send reset link.");
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
          src="https://images.unsplash.com/photo-1574243408744-edbaa41cdf84?fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8b3JhbmdlJTIwbGFuZHNjYXBlfGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000"
          alt="Forgot Password Visual"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right: Form Section */}
      <div className="w-full md:w-1/3 flex items-center justify-center p-8 bg-white max-h-screen">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-6">
            Forgot Password
          </h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            Please enter your email address to reset your password.
          </p>
          <Form
            form={form}
            name="forgotPasswordForm"
            layout="vertical"
            onFinish={onFinish}
          >
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

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                className="bg-blue-500 hover:bg-blue-600"
              >
                Send Reset Link
              </Button>
            </Form.Item>

            <div className="text-center text-sm">
              Remembered your password?{" "}
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

export default ForgotPassword;
