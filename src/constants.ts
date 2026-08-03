import { type MRRange } from "./types";

export const AVAILABLE_YEARS = [2022, 2023, 2024, 2025] as const;
export type AvailableYear = (typeof AVAILABLE_YEARS)[number];

export const MR_RANGES: MRRange[] = ["ALL", "0-10", "11-20", "21+"];

// Colors for MR ranges to make them distinct
export const MR_COLORS = {
  "0-10": "#3b82f6", // Blue
  "11-20": "#10b981", // Green
  "21+": "#f59e0b", // Amber
  LR: "#a855f7", // Legendary (31-36) - Purple
};
