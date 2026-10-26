import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

// The shop runs on Pakistan time (Asia/Karachi, UTC+5, no DST). All "today",
// "this month", day buckets and displayed dates use this zone, whatever the
// zone of the browser or the server.
export const APP_TZ = "Asia/Karachi";
export const APP_TZ_OFFSET = 300;
// dayjs in business time; pk() is "now"
export const pk = (d) => (d === undefined ? dayjs() : dayjs(d)).utcOffset(APP_TZ_OFFSET);
// calendar day "YYYY-MM-DD" in business time
export const pkDayKey = (d) => (d ? pk(d).format("YYYY-MM-DD") : "");
// a local-midnight dayjs for the business-time calendar day of `d`
// (for date pickers / range presets, which work in browser-local dates)
export const pkCalendarDay = (d) => dayjs(pk(d).format("YYYY-MM-DD"));
// effective dates (legacy sales were dated by `date`, old docs only by createdAt)
export const saleDateOf = (s) => (s && (s.saleDate || s.date || s.createdAt)) || null;
export const expenseDateOf = (e) => (e && (e.date || e.createdAt)) || null;

const nf = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 2 });

// "Rs 12,345"
export const money = (n) => `Rs ${nf.format(Math.round(Number(n) || 0))}`;
// compact for chart axes: 12.3k / 1.2M
export const moneyShort = (n) => {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  if (a >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${(v / 1e3).toFixed(a >= 1e4 ? 0 : 1)}k`;
  return String(Math.round(v));
};
export const num = (n) => nf2.format(Number(n) || 0);
export const fmtDate = (d) => (d ? pk(d).format("DD MMM YYYY") : "-");
export const isoDate = (d) => (d ? pk(d).format("YYYY-MM-DD") : "");
export const tzOffset = () => APP_TZ_OFFSET;

export const pctChange = (cur, prev) => {
  if (!prev) return cur ? null : 0;
  return ((cur - prev) / Math.abs(prev)) * 100;
};

export const STATUS_COLORS = { paid: "green", partial: "orange", unpaid: "red" };
