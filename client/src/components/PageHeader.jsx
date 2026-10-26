import React from "react";
import { Typography } from "antd";

const { Title, Text } = Typography;

// Consistent page title + subtitle + action area (wraps on small screens)
const PageHeader = ({ title, subtitle, icon, extra, children }) => (
  <div className="page-header">
    <div className="page-header__row">
      <div className="page-header__titles">
        {icon && <span className="page-header__icon">{icon}</span>}
        <div>
          <Title level={3} style={{ margin: 0 }}>
            {title}
          </Title>
          {subtitle && <Text type="secondary">{subtitle}</Text>}
        </div>
      </div>
      {extra && <div className="page-header__extra">{extra}</div>}
    </div>
    {children}
  </div>
);

export default PageHeader;
