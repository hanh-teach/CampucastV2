import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { SyncHistoryEvent } from "../types";
import { Activity, CheckCircle, AlertOctagon, TrendingUp } from "lucide-react";
import { cn } from "../lib/utils";

interface SyncHistoryD3ChartProps {
  events: SyncHistoryEvent[];
  uiLanguage?: "vi" | "en";
  className?: string;
}

interface DailySyncData {
  dateKey: string;      // YYYY-MM-DD
  displayDate: string;  // e.g. "15/08" or "Aug 15"
  fullDateStr: string;  // e.g. "15 Th08, 2026"
  success: number;
  failed: number;
  total: number;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  data: DailySyncData | null;
}

export const SyncHistoryD3Chart: React.FC<SyncHistoryD3ChartProps> = ({
  events,
  uiLanguage = "vi",
  className
}) => {
  const isVi = uiLanguage === "vi";
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    data: null
  });

  // Calculate 30-day timeline data aggregated by date
  const { dailyData, totalSyncs, successfulSyncs, failedSyncs, successRate } = useMemo(() => {
    const daysMap = new Map<string, { success: number; failed: number }>();
    const now = new Date();

    // Initialize 30 days back up to today
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;
      daysMap.set(key, { success: 0, failed: 0 });
    }

    let tot = 0;
    let succ = 0;
    let fail = 0;

    // Aggregate events into daysMap
    events.forEach((evt) => {
      try {
        const evtDate = new Date(evt.timestamp);
        if (isNaN(evtDate.getTime())) return;

        const year = evtDate.getFullYear();
        const month = String(evtDate.getMonth() + 1).padStart(2, "0");
        const day = String(evtDate.getDate()).padStart(2, "0");
        const key = `${year}-${month}-${day}`;

        if (daysMap.has(key)) {
          const entry = daysMap.get(key)!;
          if (evt.status === "success") {
            entry.success += 1;
            succ += 1;
          } else {
            entry.failed += 1;
            fail += 1;
          }
          tot += 1;
        }
      } catch {
        // ignore invalid dates
      }
    });

    const dailyDataList: DailySyncData[] = [];
    daysMap.forEach((counts, key) => {
      const [y, m, d] = key.split("-");
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      
      const displayDate = isVi 
        ? `${d}/${m}` 
        : dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      const fullDateStr = isVi
        ? `${d} Thg ${m}, ${y}`
        : dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      const dayTotal = counts.success + counts.failed;

      dailyDataList.push({
        dateKey: key,
        displayDate,
        fullDateStr,
        success: counts.success,
        failed: counts.failed,
        total: dayTotal
      });
    });

    const rate = tot > 0 ? (succ / tot) * 100 : 100;

    return {
      dailyData: dailyDataList,
      totalSyncs: tot,
      successfulSyncs: succ,
      failedSyncs: fail,
      successRate: rate
    };
  }, [events, isVi]);

  // Render D3 Chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = 220;

    const margin = { top: 20, right: 15, bottom: 35, left: 35 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous drawings

    svg.attr("width", width).attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scale X
    const xScale = d3
      .scaleBand()
      .domain(dailyData.map((d) => d.dateKey))
      .range([0, innerWidth])
      .padding(0.3);

    // Scale Y
    const maxVal = Math.max(4, d3.max(dailyData, (d: DailySyncData) => d.total) || 1);
    const yScale = d3
      .scaleLinear()
      .domain([0, maxVal])
      .nice()
      .range([innerHeight, 0]);

    // Horizontal Grid Lines
    const yTicks = yScale.ticks(4);
    g.append("g")
      .attr("class", "grid-lines")
      .selectAll("line")
      .data(yTicks)
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.08)
      .attr("stroke-dasharray", "3,3");

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat((d) => {
        const item = dailyData.find((x) => x.dateKey === d);
        return item ? item.displayDate : d;
      })
      .tickValues(
        dailyData
          .filter((_, idx) => idx % 4 === 0 || idx === dailyData.length - 1)
          .map((d) => d.dateKey)
      );

    const xAxisG = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisG.select(".domain").attr("stroke-opacity", 0.2);
    xAxisG.selectAll(".tick line").attr("stroke-opacity", 0.2);
    xAxisG
      .selectAll(".tick text")
      .attr("class", "fill-text-muted text-[10px] font-mono")
      .attr("dy", "1em");

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat(d3.format("d"));
    const yAxisG = g.append("g").call(yAxis);

    yAxisG.select(".domain").remove();
    yAxisG.selectAll(".tick line").remove();
    yAxisG
      .selectAll(".tick text")
      .attr("class", "fill-text-muted text-[10px] font-mono")
      .attr("dx", "-0.3em");

    // Render Bars
    const barGroups = g
      .selectAll<SVGGElement, DailySyncData>(".day-group")
      .data(dailyData)
      .enter()
      .append("g")
      .attr("class", "day-group")
      .attr("transform", (d: DailySyncData) => `translate(${xScale(d.dateKey) || 0}, 0)`);

    // Background track for empty days
    barGroups
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", xScale.bandwidth())
      .attr("height", innerHeight)
      .attr("rx", 3)
      .attr("class", "fill-surface-subtle/30");

    // Stacked Bars: Success (Bottom) & Failed (Top)
    barGroups.each(function (d: DailySyncData) {
      const group = d3.select(this);
      const bw = xScale.bandwidth();

      if (d.total === 0) return;

      const successHeight = innerHeight - yScale(d.success);
      const failedHeight = innerHeight - yScale(d.failed);

      let currentY = innerHeight;

      // Render Success bar segment
      if (d.success > 0) {
        currentY -= successHeight;
        group
          .append("rect")
          .attr("x", 0)
          .attr("y", currentY)
          .attr("width", bw)
          .attr("height", successHeight)
          .attr("rx", d.failed === 0 ? 3 : 0)
          .attr("fill", "#10b981") // Emerald 500
          .attr("class", "transition-all duration-200 hover:opacity-80 cursor-pointer");
      }

      // Render Failed bar segment stacked on top
      if (d.failed > 0) {
        currentY -= failedHeight;
        group
          .append("rect")
          .attr("x", 0)
          .attr("y", currentY)
          .attr("width", bw)
          .attr("height", failedHeight)
          .attr("rx", 3)
          .attr("fill", "#f43f5e") // Rose 500
          .attr("class", "transition-all duration-200 hover:opacity-80 cursor-pointer");
      }
    });

    // Invisible Overlay Rects for Hover Tooltips
    barGroups
      .append("rect")
      .attr("x", -2)
      .attr("y", 0)
      .attr("width", xScale.bandwidth() + 4)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .attr("class", "cursor-pointer")
      .on("mouseenter", (event: MouseEvent, d: DailySyncData) => {
        const [xPos, yPos] = d3.pointer(event, container);
        setTooltip({
          visible: true,
          x: Math.min(xPos, width - 160),
          y: Math.max(10, yPos - 60),
          data: d
        });
      })
      .on("mousemove", (event: MouseEvent, d: DailySyncData) => {
        const [xPos, yPos] = d3.pointer(event, container);
        setTooltip({
          visible: true,
          x: Math.min(xPos, width - 160),
          y: Math.max(10, yPos - 60),
          data: d
        });
      })
      .on("mouseleave", () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
      });
  }, [dailyData]);

  return (
    <div className={cn("space-y-4 text-left", className)}>
      {/* Metrics Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Success Rate */}
        <div className="p-3 bg-surface-subtle/60 rounded-xl border border-border-subtle space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-text-muted">
            <span>{isVi ? "Tỷ lệ Thành công" : "Success Rate"}</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={cn(
              "text-lg font-black font-mono tracking-tight",
              successRate >= 90 ? "text-emerald-500" : successRate >= 70 ? "text-amber-500" : "text-rose-500"
            )}>
              {successRate.toFixed(1)}%
            </span>
            <span className="text-[10px] font-mono text-text-muted">
              (30 {isVi ? "ngày" : "days"})
            </span>
          </div>
        </div>

        {/* Total Syncs */}
        <div className="p-3 bg-surface-subtle/60 rounded-xl border border-border-subtle space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-text-muted">
            <span>{isVi ? "Tổng lượt Đồng bộ" : "Total Syncs"}</span>
            <Activity className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-lg font-black font-mono text-text-primary tracking-tight">
            {totalSyncs} <span className="text-xs font-normal text-text-muted">{isVi ? "lần" : "runs"}</span>
          </div>
        </div>

        {/* Successful Syncs */}
        <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <span>{isVi ? "Thành công" : "Successful"}</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
            {successfulSyncs}
          </div>
        </div>

        {/* Failed / Retried Syncs */}
        <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/20 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <span>{isVi ? "Lỗi / Thử lại" : "Failed / Retried"}</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 tracking-tight">
            {failedSyncs}
          </div>
        </div>
      </div>

      {/* D3 Bar Chart Container */}
      <div className="relative p-4 bg-surface-subtle/40 rounded-2xl border border-border-subtle space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-border-subtle/60 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-primary font-mono">
              {isVi ? "Biểu đồ Tần suất & Trạng thái 30 Ngày" : "30-Day Sync Frequency & Pattern Chart"}
            </span>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-3 text-[10px] font-mono text-text-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shrink-0" />
              <span>{isVi ? "Thành công" : "Success"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 shrink-0" />
              <span>{isVi ? "Thất bại" : "Failed"}</span>
            </div>
          </div>
        </div>

        {/* SVG Drawing Canvas */}
        <div ref={containerRef} className="w-full relative overflow-hidden">
          <svg ref={svgRef} className="w-full overflow-visible" />

          {/* Floating Tooltip */}
          {tooltip.visible && tooltip.data && (
            <div
              style={{
                top: `${tooltip.y}px`,
                left: `${tooltip.x}px`
              }}
              className="absolute z-20 pointer-events-none bg-neutral-900/95 text-white dark:bg-neutral-800/95 border border-neutral-700/80 rounded-xl p-2.5 shadow-xl text-left space-y-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 min-w-[140px]"
            >
              <div className="text-[11px] font-mono font-bold text-neutral-300 border-b border-neutral-700 pb-1">
                {tooltip.data.fullDateStr}
              </div>
              <div className="text-[10px] space-y-0.5 pt-0.5 font-mono">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-emerald-400">{isVi ? "Thành công:" : "Success:"}</span>
                  <span className="font-bold">{tooltip.data.success}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-rose-400">{isVi ? "Thất bại:" : "Failed:"}</span>
                  <span className="font-bold">{tooltip.data.failed}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-neutral-400 pt-1 border-t border-neutral-800">
                  <span>{isVi ? "Tổng số:" : "Total:"}</span>
                  <span className="font-bold text-white">{tooltip.data.total}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncHistoryD3Chart;
