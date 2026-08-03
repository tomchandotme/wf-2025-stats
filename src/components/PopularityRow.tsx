import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  Rectangle,
  type BarShapeProps,
} from "recharts";
import { Minus, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "../utils/cn";
import { MR_COLORS } from "../constants";
import type { DataItem, MRRange } from "../types";

interface PopularityRowProps {
  item: DataItem;
  index: number;
  activeMrRange: MRRange;
  onClick: (v: string) => void;
}

const TooltipContent = React.memo(
  (props: Partial<TooltipContentProps<number, string>>) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const data = payload[0].payload as { name: string; val: number };
      return (
        <div className="bg-surface rounded border border-white/5 px-2 py-1.5 text-sm shadow-md backdrop-blur-sm">
          <p className="font-bold tracking-wider text-white uppercase">
            MR {data.name} Average Usage
          </p>
          <p className="text-primary/90 font-mono">
            {(Number(data.val) * 100).toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  },
);

TooltipContent.displayName = "TooltipContent";

const MRDistributionShape = ({
  activeMrRange,
  name,
  ...props
}: BarShapeProps & { activeMrRange: MRRange }) => {
  return (
    <Rectangle
      {...props}
      className={cn("cursor-pointer transition-all duration-300", {
        "opacity-40": name !== activeMrRange && activeMrRange !== "ALL",
      })}
    />
  );
};

export const PopularityRow: React.FC<PopularityRowProps> = ({
  item,
  activeMrRange,
  onClick,
}) => {
  const chartData = useMemo(
    () => [
      { name: "0-10", val: item.mrRanges["0-10"], fill: MR_COLORS["0-10"] },
      { name: "11-20", val: item.mrRanges["11-20"], fill: MR_COLORS["11-20"] },
      { name: "21+", val: item.mrRanges["21+"], fill: MR_COLORS["21+"] },
    ],
    [item.mrRanges],
  );

  const trendContent = useMemo(() => {
    if (item.previousRank === undefined) {
      return (
        <span className="bg-accent/10 text-accent/80 border-accent/10 inline-flex items-center rounded-sm border px-1 py-0.5 text-xs font-bold tracking-tighter">
          NEW
        </span>
      );
    }

    const diff = item.previousRank - (item.rank || 0);

    if (diff > 0) {
      return (
        <span className="flex items-center justify-center gap-0.5 font-mono text-sm font-bold text-emerald-500/60">
          <ArrowUp className="size-4" />
          {diff}
        </span>
      );
    }

    if (diff < 0) {
      return (
        <span className="flex items-center justify-center gap-0.5 font-mono text-sm font-bold text-rose-500/60">
          <ArrowDown className="size-4" />
          {Math.abs(diff)}
        </span>
      );
    }

    return (
      <span className="flex items-center justify-center text-white/50">
        <Minus className="size-4" />
      </span>
    );
  }, [item.rank, item.previousRank]);

  const rankColorClass = useMemo(() => {
    if (item.rank === 1) return "text-primary/90 font-black";
    if (item.rank === 2) return "text-gray-400 font-bold";
    if (item.rank === 3) return "text-orange-400/60 font-bold";
    return "text-white/50 font-medium";
  }, [item.rank]);

  return (
    <tr className="group transition-colors hover:bg-white/1">
      <td className={cn("px-4 py-3 font-mono md:px-6 md:py-4", rankColorClass)}>
        #{item.rank}
      </td>
      <td className="px-4 py-3 text-center md:px-6 md:py-4">{trendContent}</td>
      <td className="px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-start gap-3 md:gap-4">
          <div className="relative shrink-0">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                width={40}
                height={40}
                className="bg-background/80 size-10 rounded-sm object-contain transition-transform duration-300 md:size-12"
                alt={item.name}
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-sm border border-white/5 bg-white/3 text-sm font-black tracking-tighter text-white/10 uppercase md:size-12">
                {item.name.substring(0, 2)}
              </div>
            )}
          </div>
          <div className="group-hover:text-primary text-xs font-bold tracking-tight text-white/80 uppercase transition-colors duration-200 md:text-sm">
            {item.name}
          </div>
        </div>
      </td>
      <td className="text-accent/60 px-4 py-3 text-right font-mono text-sm font-bold md:px-6 md:py-4 md:text-xs">
        {(item.usage * 100).toFixed(2)}%
      </td>
      <td className="px-4 py-2 text-right md:px-6">
        <div className="h-10 w-full min-w-25 **:focus:outline-0 md:h-12 md:min-w-32">
          <ResponsiveContainer width="100%" height={40}>
            <BarChart data={chartData}>
              <Bar
                dataKey="val"
                radius={[1, 1, 0, 0]}
                onClick={(v) => onClick(v.name as MRRange)}
                shape={(p: BarShapeProps) =>
                  MRDistributionShape({ ...p, activeMrRange })
                }
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                content={<TooltipContent />}
                animationDuration={100}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </td>
    </tr>
  );
};
