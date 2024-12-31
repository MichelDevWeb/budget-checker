/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { GetFormatterForCurrency } from "@/lib/helpers";
import { isMobile } from "@/lib/utils";
import React, { useCallback, useState } from "react";
import { PieChart, Pie, Sector, Cell } from "recharts";

const colors = [
  "#FF5733", // Red
  "#E67E22", // Orange
  "#F1C40F", // Yellow
  "#3498DB", // Blue
  "#95A5A6", // Grey
  "#2ECC71", // Green
  "#9B59B6", // Purple
  "#E91E63", // Pink
  "#1ABC9C", // Turquoise
  "#8E44AD", // Dark Purple
];

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    value,
    income,
    expense,
    type,
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  // const sx = cx + (outerRadius + 5) * cos;
  // const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 10) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  // const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle">
        <tspan
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fill={type === "expense" ? "#EF4444" : "#10B981"}
        >
          {GetFormatterForCurrency("VND").format(
            type === "expense" ? expense : income
          )}
        </tspan>
        <tspan
          x={cx}
          y={cy + 10}
          dy={8}
          textAnchor="middle"
          fill={type === "expense" ? "#10B981" : "#EF4444"}
        >
          {GetFormatterForCurrency("VND").format(
            type === "expense" ? income : expense
          )}
        </tspan>
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 2}
        outerRadius={outerRadius + 6}
        fill={fill}
      />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor="middle"
        fill={fill}
        style={{ fontSize: "10px" }}
      >
        {payload.name}
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={16}
        textAnchor="middle"
        fill={fill}
        style={{ fontSize: "12px" }}
      >
        {GetFormatterForCurrency("VND").format(value)}
      </text>
    </g>
  );
};

interface PieChartOverviewProps {
  data: any;
  income: number;
  expense: number;
  type: string;
}

export default function PieChartOverview({
  data,
  income,
  expense,
  type,
}: PieChartOverviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const onPieEnter = useCallback(
    (_: React.MouseEvent<SVGElement, MouseEvent>, index: number) => {
      setActiveIndex(index);
    },
    [setActiveIndex]
  );
  const isDeviceMobile = window ? isMobile(window.navigator.userAgent) : true;

  if (data?.length > 0) {
    data = data.map((el: { category: string; _sum: { amount: number } }) => ({
      name: el.category,
      value: el._sum.amount,
    }));

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: isDeviceMobile ? 225 : 270,
          marginLeft: "15px",
          marginTop: "30px",
        }}
      >
        <PieChart width={450} height={450}>
          <Pie
            activeIndex={activeIndex}
            activeShape={(props: any) =>
              renderActiveShape({ ...props, income, expense, type })
            }
            data={data}
            cx={200}
            cy={200}
            innerRadius={80}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            style={{ margin: "auto" }}
            onMouseEnter={onPieEnter}
          >
            {data.map(
              (entry: { name: string; value: number }, index: number) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              )
            )}
          </Pie>
        </PieChart>
      </div>
    );
  }
}
