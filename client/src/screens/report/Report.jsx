import React, { useState } from "react";
import { DatePicker, Button, Card, message } from "antd";
import dayjs from "dayjs";
import axios from "axios";

const { RangePicker } = DatePicker;

const Report = () => {
  const [dates, setDates] = useState([]);
  const [report, setReport] = useState(null);
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchReport = async () => {
    if (!dates || dates.length !== 2) return message.error("Select start and end dates");
    try {
      const startDate = dayjs(dates[0]).format("YYYY-MM-DD");
      const endDate = dayjs(dates[1]).format("YYYY-MM-DD");

      const { data } = await axios.get(
        `${API_URL}/api/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`,
        { withCredentials: true }
      );
      setReport(data);
    } catch (error) {
      message.error("Failed to fetch report");
    }
  };

  return (
    <div>
      <RangePicker onChange={(dates) => setDates(dates)} style={{ marginBottom: 16 }} />
      <Button type="primary" onClick={fetchReport} style={{ marginLeft: 8 }}>
        Get Report
      </Button>

      {report && (
        <Card style={{ marginTop: 16 }}>
          <p>Total Sales Amount: Rs. {report.totalSalesAmount}</p>
          <p>Total Cost: Rs. {report.totalCost}</p>
          <p>Total Expenses: Rs. {report.totalExpenses}</p>
          <p>
            Profit / Loss:{" "}
            <b style={{ color: report.profit >= 0 ? "green" : "red" }}>
              Rs. {report.profit}
            </b>
          </p>
        </Card>
      )}
    </div>
  );
};

export default Report;
