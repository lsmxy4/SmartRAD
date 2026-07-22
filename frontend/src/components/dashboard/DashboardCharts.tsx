"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DEPARTMENT_COLORS = ["#6366f1", "#0891b2", "#16a34a", "#d97706", "#e11d48", "#8b5cf6", "#0ea5e9"];
const TOOLTIP_CONTENT_STYLE = { backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 12px rgba(15,23,42,0.12)", fontSize: 12, padding: "8px 12px" };
const TOOLTIP_ITEM_STYLE = { color: "#0f172a" };
const TOOLTIP_LABEL_STYLE = { color: "#475569", fontWeight: 600, marginBottom: 4 };
const ATTENDANCE_COLORS: Record<string, string> = {
  정상: "#16a34a",
  지각: "#d97706",
  결근: "#e11d48",
  기타: "#94a3b8",
  미출근: "#cbd5e1",
};

export interface DepartmentHeadcount {
  name: string;
  value: number;
}

export interface AttendanceStatusCount {
  name: string;
  value: number;
}

export interface PayrollMonthlyPoint {
  month: string;
  totalPayAmount: number;
  totalRealPayAmount: number;
}

function formatManwon(value: number) {
  return `${Math.round(value / 10_000).toLocaleString("ko-KR")}만원`;
}

export function DepartmentHeadcountChart({ data, loading }: { data: DepartmentHeadcount[]; loading: boolean }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">부서별 인원 분포</h2>
      {loading ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-gray-500">로딩 중...</div>
      ) : data.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-gray-500">표시할 데이터가 없습니다.</div>
      ) : (
        <div className="mt-4 h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
              <CartesianGrid stroke="#eef2f7" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={72} tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [`${Number(value)}명`, "인원"]} contentStyle={TOOLTIP_CONTENT_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                {data.map((_, index) => (
                  <Cell key={index} fill={DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export function TodayAttendanceChart({ data, loading }: { data: AttendanceStatusCount[]; loading: boolean }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = total ? data : [{ name: "데이터 없음", value: 1 }];
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">오늘 근태 현황</h2>
      {loading ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-gray-500">로딩 중...</div>
      ) : (
        <div className="mt-4 flex items-center gap-4">
          <div className="relative h-[180px] w-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={78} paddingAngle={total ? 2 : 0} stroke="none" isAnimationActive={false}>
                  {chartData.map((item, index) => (
                    <Cell key={index} fill={total ? ATTENDANCE_COLORS[item.name] ?? DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length] : "#e5e7eb"} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <strong className="text-xl text-gray-900">{total}</strong>
              <span className="text-xs text-gray-500">전체 인원</span>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ATTENDANCE_COLORS[item.name] ?? "#94a3b8" }} />
                  {item.name}
                </span>
                <span className="font-semibold text-gray-900">{item.value}명</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function PayrollTrendChart({ data, loading }: { data: PayrollMonthlyPoint[]; loading: boolean }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
      <h2 className="text-lg font-bold text-gray-900">월별 급여 지급 총액 추이</h2>
      {loading ? (
        <div className="flex h-[240px] items-center justify-center text-sm text-gray-500">로딩 중...</div>
      ) : data.length === 0 ? (
        <div className="flex h-[240px] items-center justify-center text-sm text-gray-500">지급된 급여 내역이 없습니다.</div>
      ) : (
        <div className="mt-4 h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatManwon} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
              <Tooltip formatter={(value) => formatManwon(Number(value))} contentStyle={TOOLTIP_CONTENT_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
              <Line name="지급 총액" type="monotone" dataKey="totalPayAmount" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              <Line name="실지급액" type="monotone" dataKey="totalRealPayAmount" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
