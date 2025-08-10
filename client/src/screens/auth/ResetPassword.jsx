import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Form, Input, Button, App, Spin } from "antd";
import { verifyResetToken, resetPassword } from "../../services/authServices";
import { Loader } from "../../animations/pageLoader/Loader";

const ResetPassword = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [form] = Form.useForm();

  // Step 1: Verify token
  useEffect(() => {
    const checkToken = async () => {
      try {
        const res = await verifyResetToken(token);
        if (res.status === 200) {
          setValidToken(true);
        } else {
          message.error(res.data?.message || "Invalid or expired link.");
        }
      } catch (err) {
        message.error(
          err.response?.data?.message || "Token verification failed."
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      checkToken();
    } else {
      message.error("No token provided.");
      navigate("/forgot-password");
    }
  }, []);

  // Step 2: Handle password reset submit
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await resetPassword(token, values.password);
      if (res.status === 200) {
        message.success("Password reset successful! You can now log in.");
        navigate("/login");
      } else {
        message.error(res.data?.message || "Password reset failed.");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader isLoading={true} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Image Section */}
      <div className="w-full md:w-2/3 max-h-screen">
        <img
          src="https://images.unsplash.com/photo-1444090542259-0af8fa96557e?fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8b3JhbmdlJTIwbGFuZHNjYXBlfGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000"
          alt="Reset Password Visual"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right: Form Section */}
      <div className="w-full md:w-1/3 flex items-center justify-center p-8 bg-white max-h-screen">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-6">
            Reset Password
          </h1>

          {validToken ? (
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="New Password"
                name="password"
                rules={[
                  {
                    required: true,
                    message: "Please enter your new password!",
                  },
                  {
                    min: 6,
                    message: "Password must be at least 6 characters!",
                  },
                ]}
              >
                <Input.Password placeholder="Enter new password" />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Please confirm your password!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Passwords do not match!")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm new password" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Reset Password
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <>
              <p className="text-center text-red-500">
                The reset link is invalid or has expired.
              </p>

              <Button
                type="primary"
                onClick={() => navigate("/forgot-password")}
                block
                className="bg-blue-500 hover:bg-blue-600 mt-4"
              >
                Request a new link
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
