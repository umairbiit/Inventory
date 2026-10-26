import React from "react";
import { Button, Result } from "antd";

const ErrorState = ({ title = "Something went wrong", subTitle = "Please check your connection and try again.", onRetry }) => (
  <Result
    status="warning"
    title={title}
    subTitle={subTitle}
    extra={onRetry && <Button onClick={onRetry}>Try again</Button>}
  />
);

export default ErrorState;
