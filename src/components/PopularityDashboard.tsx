import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  getCategories,
  loadDataForYear,
  getTopItemsWithTrends,
} from "../utils/dataLoader";
import { PopularityRow } from "./PopularityRow";
import { MRPopulationChart } from "./MRPopulationChart";
import { MR_RANGES, AVAILABLE_YEARS } from "../constants";
import type { MRRange, RootData } from "../types";

const CUSTOM_CATEGORY_ORDER = ["Warframe", "Primary", "Secondary", "Melee"];

/**
 * The main dashboard component for displaying Warframe popularity statistics.
 * Allows users to filter by year, category, and Mastery Rank (MR) range.
 *
 * @returns A React functional component.
 */
export const PopularityDashboard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [category, setCategory] = useState("Warframe");
  const [mrRange, setMrRange] = useState<MRRange>("ALL");
  const [limit] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentYearData, setCurrentYearData] = useState<RootData | null>(null);
  const [previousYearData, setPreviousYearData] = useState<RootData | null>(
    null,
  );

  const years = AVAILABLE_YEARS;

  const categories = useMemo(() => {
    if (!currentYearData) return ["Warframe"];
    return getCategories(currentYearData).sort((a, b) => {
      return (
        CUSTOM_CATEGORY_ORDER.indexOf(a) - CUSTOM_CATEGORY_ORDER.indexOf(b)
      );
    });
  }, [currentYearData]);

  const loadData = useCallback(async (year: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const current = await loadDataForYear(year);
      setCurrentYearData(current);

      if (year > AVAILABLE_YEARS[0]) {
        const previous = await loadDataForYear(year - 1);
        setPreviousYearData(previous);
      } else {
        setPreviousYearData(null);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load data";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedYear);
  }, [selectedYear, loadData]);

  const data = useMemo(() => {
    if (!currentYearData) return [];
    return getTopItemsWithTrends(
      currentYearData,
      previousYearData,
      category,
      mrRange,
      limit,
    );
  }, [currentYearData, previousYearData, category, mrRange, limit]);

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setCategory(e.target.value);
    },
    [],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 pt-12 md:space-y-12 md:p-12">
      <header className="space-y-3 text-center md:space-y-4">
        <h1 className="text-3xl font-black tracking-tighter md:text-5xl lg:text-6xl">
          <span className="gold-gradient-text uppercase">Warframe</span>
          <span className="ml-2 font-light text-white/80 md:ml-3">
            Usage Stats
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-sm font-medium tracking-[0.15em] text-white/30 uppercase md:text-xs">
          Comprehensive analysis of equipment weighted by Mastery Rank
          population
        </p>
      </header>

      <MRPopulationChart />

      <div className="glass flex flex-col items-stretch gap-6 rounded-2xl p-4 shadow-xl sm:p-6 md:flex-row md:items-center md:justify-center md:gap-8">
        <div className="space-y-2.5 md:space-y-3">
          <label className="text-primary block text-center text-sm font-bold tracking-widest uppercase md:text-sm">
            Timeline
          </label>
          <div
            className="no-scrollbar flex overflow-x-auto rounded-lg bg-black/30 p-1"
            role="group"
          >
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                aria-pressed={selectedYear === year}
                disabled={isLoading}
                className={`min-w-14 flex-1 rounded-md px-3 py-1.5 text-sm font-bold tracking-tight transition-all disabled:opacity-50 md:min-w-16 md:px-4 md:text-xs ${
                  selectedYear === year
                    ? "bg-primary text-black"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden h-10 w-px bg-white/5 md:block" />

        <div className="space-y-2.5 md:space-y-3">
          <label
            htmlFor="category-select"
            className="text-primary block text-center text-sm font-bold tracking-widest uppercase md:text-sm"
          >
            Classification
          </label>
          <select
            id="category-select"
            value={category}
            onChange={handleCategoryChange}
            disabled={isLoading}
            className="focus:ring-primary h-9 w-full cursor-pointer rounded-lg border border-white/5 bg-black/30 px-4 text-sm font-bold tracking-tight text-white focus:ring-1 focus:outline-none md:w-44 md:text-xs"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-surface">
                {cat.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden h-10 w-px bg-white/5 md:block" />

        <div className="space-y-2.5 md:space-y-3">
          <label className="text-primary block text-center text-sm font-bold tracking-widest uppercase md:text-sm">
            Mastery Tier
          </label>
          <div
            className="no-scrollbar flex overflow-x-auto rounded-lg bg-black/30 p-1"
            role="group"
          >
            {MR_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setMrRange(range)}
                aria-pressed={mrRange === range}
                disabled={isLoading}
                className={`min-w-14 flex-1 rounded-md px-3 py-1.5 text-sm font-bold tracking-tight transition-all disabled:opacity-50 md:min-w-16 md:px-4 md:text-xs md:whitespace-nowrap ${
                  mrRange === range
                    ? "bg-primary text-black"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-2xl shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-16 md:p-24">
            <div className="border-primary h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" />
            <p className="text-primary animate-pulse text-sm font-bold tracking-[0.2em] uppercase">
              Synchronizing Codex...
            </p>
          </div>
        ) : error ? (
          <div className="p-16 text-center md:p-24">
            <p className="mb-3 text-xs font-bold tracking-tight text-red-400 uppercase">
              Archive Link Severed
            </p>
            <p className="mb-6 text-sm text-white/30">{error}</p>
            <button
              onClick={() => loadData(selectedYear)}
              className="border-primary/10 bg-primary/5 text-primary hover:bg-primary/10 rounded-lg border px-6 py-2.5 text-sm font-bold tracking-widest transition-all"
            >
              RESTORE LINK
            </button>
          </div>
        ) : data.length > 0 ? (
          <div className="no-scrollbar overflow-x-auto">
            <table className="w-full min-w-160 border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-black/20">
                  <th className="w-16 px-4 py-4 text-left text-sm font-bold tracking-widest text-white/30 uppercase md:w-20 md:px-6">
                    Rank
                  </th>
                  <th className="w-20 px-4 py-4 text-center text-sm font-bold tracking-widest text-white/30 uppercase md:w-24 md:px-6">
                    Trend
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-bold tracking-widest text-white/30 uppercase md:px-6">
                    Archive Entry
                  </th>
                  <th className="w-28 px-4 py-4 text-right text-sm font-bold tracking-widest text-white/30 uppercase md:w-32 md:px-6">
                    Usage
                  </th>
                  <th className="w-48 px-4 py-4 text-right text-sm font-bold tracking-widest text-white/30 uppercase md:w-56 md:px-6">
                    Distribution
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {data.map((item, index) => (
                  <PopularityRow
                    key={`${category}-${item.name}`}
                    item={item}
                    index={index}
                    activeMrRange={mrRange}
                    onClick={(v) => setMrRange(v as MRRange)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center md:p-24">
            <p className="text-sm font-bold tracking-[0.2em] text-white/20 uppercase">
              No Records Found
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
