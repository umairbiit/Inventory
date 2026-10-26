import React from "react";
import { Card, Skeleton, Tooltip, Typography } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined, InfoCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

// KPI tile. `delta` is a % change (number) or null.
const StatCard = ({ title, value, sub, icon, color = "#fdbc0a", loading, delta, hint, valueColor, onClick, testId }) => (
  <Card
    className={`stat-card${onClick ? " stat-card--link" : ""}`}
    size="small"
    onClick={onClick}
    data-testid={testId}
  >
    <div className="stat-card__body">
      <div style={{ minWidth: 0 }}>
        <Text type="secondary" className="stat-card__title">
          {title}
          {hint && (
            <Tooltip title={hint}>
              <InfoCircleOutlined style={{ marginLeft: 6, fontSize: 12 }} />
            </Tooltip>
          )}
        </Text>
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 120, marginTop: 6 }} />
        ) : (
          <div className="stat-card__value" style={valueColor ? { color: valueColor } : undefined}>
            {value}
          </div>
        )}
        {!loading && (sub || delta !== undefined) && (
          <div className="stat-card__sub">
            {delta !== undefined && delta !== null && Number.isFinite(delta) && (
              <span style={{ color: delta >= 0 ? "#16a34a" : "#dc2626", marginRight: 6 }}>
                {delta >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(delta).toFixed(1)}%
              </span>
            )}
            {sub && <Text type="secondary">{sub}</Text>}
          </div>
        )}
      </div>
      {icon && (
        <div className="stat-card__icon" style={{ background: `${color}1f`, color }}>
          {icon}
        </div>
      )}
    </div>
  </Card>
);

export default StatCard;
