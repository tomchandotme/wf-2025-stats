import type {
  RootData,
  ItemUsage,
  MRRangeUsage,
  MRRange,
  DataItem,
} from "../types";
import urls from "../../data/urls.json";
import { MR_WEIGHTS } from "../constants/mrWeights";

const dataCache: Record<number, RootData> = {};
const urlLookup = urls as Record<string, string>;
const urlLookupLower = new Map(
  Object.entries(urlLookup).map(([name, file]) => [name.toLowerCase(), file]),
);

const MAX_WEIGHTED_MR = Math.max(...Object.keys(MR_WEIGHTS).map(Number));

const resolveImageUrl = (name: string): string | undefined => {
  const file = urlLookup[name] ?? urlLookupLower.get(name.toLowerCase());
  return file ? `https://cdn.warframestat.us/img/${file}` : undefined;
};

/**
 * Validates the minimal shape expected from yearly usage JSON.
 */
export const assertRootData = (data: unknown, year: number): RootData => {
  if (!data || typeof data !== "object") {
    throw new Error(`Invalid data for ${year}: expected an object`);
  }

  const root = data as { ALL?: unknown };
  if (!root.ALL || typeof root.ALL !== "object") {
    throw new Error(`Invalid data for ${year}: missing ALL segment`);
  }

  const categories = Object.values(root.ALL as Record<string, unknown>);
  if (categories.length === 0) {
    throw new Error(`Invalid data for ${year}: ALL has no categories`);
  }

  for (const category of categories) {
    if (!category || typeof category !== "object") {
      throw new Error(`Invalid data for ${year}: category is not an object`);
    }
  }

  return data as RootData;
};

/**
 * Loads Warframe usage data for a specific year.
 * Caches the data to avoid redundant fetches.
 *
 * @param year - The year to load data for.
 * @returns A promise that resolves to the RootData for the specified year.
 */
export const loadDataForYear = async (year: number): Promise<RootData> => {
  if (dataCache[year]) {
    return dataCache[year];
  }

  try {
    const response = await fetch(`/data/WarframeUsageData${year}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load data for ${year}`);
    }
    const data = assertRootData(await response.json(), year);
    dataCache[year] = data;
    return dataCache[year];
  } catch (error) {
    console.error(`Error loading data for year ${year}:`, error);
    throw error;
  }
};

/**
 * Gets all available categories from the data.
 *
 * @param data - The RootData to extract categories from.
 * @returns An array of category names.
 */
export const getCategories = (data: RootData) => Object.keys(data.ALL);

/**
 * Aggregates Mastery Rank usage data into predefined ranges.
 * Uses weighted averages to ensure mathematical correctness.
 *
 * @param usage - The usage data for an item.
 * @returns An object containing the aggregated usage for each MR range.
 */
export const aggregateMRUsage = (usage: ItemUsage): MRRangeUsage => {
  const ranges = {
    "0-10": { usage: 0, weight: 0 },
    "11-20": { usage: 0, weight: 0 },
    "21+": { usage: 0, weight: 0 },
  };

  Object.entries(usage).forEach(([mr, value]) => {
    if (mr === "ALL") return;

    const parsed = parseInt(mr, 10);
    if (isNaN(parsed) || parsed < 0) return;

    // 2024 source data includes anomalous MR "40" on a few items.
    // Clamp above the solved weight range so those rows still contribute to 21+.
    const mrNum = Math.min(parsed, MAX_WEIGHTED_MR);
    const weight = MR_WEIGHTS[mrNum];
    if (!weight) return;

    const weightedUsage = value * weight;

    if (mrNum <= 10) {
      ranges["0-10"].usage += weightedUsage;
      ranges["0-10"].weight += weight;
    } else if (mrNum <= 20) {
      ranges["11-20"].usage += weightedUsage;
      ranges["11-20"].weight += weight;
    } else {
      ranges["21+"].usage += weightedUsage;
      ranges["21+"].weight += weight;
    }
  });

  return {
    "0-10":
      ranges["0-10"].weight > 0
        ? ranges["0-10"].usage / ranges["0-10"].weight
        : 0,
    "11-20":
      ranges["11-20"].weight > 0
        ? ranges["11-20"].usage / ranges["11-20"].weight
        : 0,
    "21+":
      ranges["21+"].weight > 0 ? ranges["21+"].usage / ranges["21+"].weight : 0,
  };
};

/**
 * Ranks items within a category based on usage.
 * Special handling for the "Warframe" category to group Prime/Umbra variants.
 *
 * @param data - The RootData to rank items from.
 * @param category - The category to rank.
 * @param mrRange - The MR range to calculate usage for.
 * @returns An array of DataItem objects sorted by usage with rank information.
 */
export const getRankedItems = (
  data: RootData,
  category: string,
  mrRange: MRRange = "ALL",
): DataItem[] => {
  const items = data.ALL[category] || {};

  let result: DataItem[] = [];

  if (category === "Warframe") {
    const groups = Object.entries(items).reduce(
      (acc, [name, usage]) => {
        const targetName = name.replace(/ (Prime|Umbra)$/, "");
        const currentGroup = acc[targetName] || {
          total: 0,
          mrRanges: { "0-10": 0, "11-20": 0, "21+": 0 },
        };

        const aggregated = aggregateMRUsage(usage);

        return {
          ...acc,
          [targetName]: {
            total: currentGroup.total + usage.ALL,
            mrRanges: {
              "0-10": currentGroup.mrRanges["0-10"] + aggregated["0-10"],
              "11-20": currentGroup.mrRanges["11-20"] + aggregated["11-20"],
              "21+": currentGroup.mrRanges["21+"] + aggregated["21+"],
            },
          },
        };
      },
      {} as Record<string, { total: number; mrRanges: MRRangeUsage }>,
    );

    result = Object.entries(groups).map(([name, group]) => ({
      name,
      usage:
        mrRange === "ALL"
          ? group.total
          : group.mrRanges[mrRange as keyof MRRangeUsage],
      mrRanges: group.mrRanges,
    }));
  } else {
    result = Object.entries(items).map(([name, usage]) => {
      const aggregated = aggregateMRUsage(usage);
      return {
        name,
        usage:
          mrRange === "ALL"
            ? usage.ALL
            : aggregated[mrRange as keyof MRRangeUsage],
        mrRanges: aggregated,
      };
    });
  }

  return result
    .sort((a, b) => b.usage - a.usage)
    .map((item, index) => ({ ...item, rank: index + 1 }));
};

/**
 * Gets top items for a category with trend information compared to previous year.
 *
 * @param currentData - Usage data for the current year.
 * @param previousData - Usage data for the previous year (optional).
 * @param category - The category to fetch.
 * @param mrRange - The MR range to filter by.
 * @param limit - Max number of items to return.
 * @returns Array of DataItem objects with trend and image info.
 */
export const getTopItemsWithTrends = (
  currentData: RootData,
  previousData: RootData | null,
  category: string,
  mrRange: MRRange = "ALL",
  limit: number = 50,
): DataItem[] => {
  const currentRanked = getRankedItems(currentData, category, mrRange);

  if (!previousData) {
    return currentRanked.slice(0, limit).map((item) => ({
      ...item,
      imageUrl: resolveImageUrl(item.name),
    }));
  }

  const previousRanked = getRankedItems(previousData, category, mrRange);
  const previousRankMap = new Map(
    previousRanked.map((item) => [item.name, item.rank]),
  );

  return currentRanked.slice(0, limit).map((item) => ({
    ...item,
    previousRank: previousRankMap.get(item.name),
    imageUrl: resolveImageUrl(item.name),
  }));
};
