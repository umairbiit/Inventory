import React from "react";
import { Tag } from "antd";
import { STATUS_COLORS } from "../utils/format";

const StatusTag = ({ status }) =>
  status ? (
    <Tag color={STATUS_COLORS[status] || "default"} style={{ textTransform: "uppercase", marginInlineEnd: 0 }}>
      {status}
    </Tag>
  ) : (
    "-"
  );

export default StatusTag;
