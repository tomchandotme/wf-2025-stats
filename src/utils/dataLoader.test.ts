import { describe, expect, it } from "vitest";
import {
  aggregateMRUsage,
  assertRootData,
  getRankedItems,
  getTopItemsWithTrends,
} from "./dataLoader";
import type { RootData } from "../types";
import { MR_WEIGHTS } from "../constants/mrWeights";

const sampleRoot = (overrides?: Partial<RootData["ALL"]>): RootData => ({
  ALL: {
    Warframe: {
      Excalibur: {
        ALL: 0.1,
        "0": 0.2,
        "5": 0.15,
        "15": 0.1,
        "25": 0.05,
      },
      "Excalibur Prime": {
        ALL: 0.05,
        "0": 0.01,
        "5": 0.02,
        "15": 0.04,
        "25": 0.08,
      },
      "Excalibur Umbra": {
        ALL: 0.03,
        "0": 0,
        "5": 0.01,
        "15": 0.02,
        "25": 0.06,
      },
      Mag: {
        ALL: 0.08,
        "0": 0.12,
        "5": 0.1,
        "15": 0.07,
        "25": 0.04,
      },
    },
    Primary: {
      Braton: {
        ALL: 0.2,
        "0": 0.3,
        "15": 0.2,
        "25": 0.1,
      },
      Soma: {
        ALL: 0.1,
        "0": 0.05,
        "15": 0.12,
        "25": 0.15,
      },
    },
    ...overrides,
  },
});

describe("assertRootData", () => {
  it("accepts a valid ALL payload", () => {
    expect(assertRootData(sampleRoot(), 2025).ALL.Warframe).toBeTruthy();
  });

  it("rejects payloads without ALL", () => {
    expect(() => assertRootData({ PC: {} }, 2022)).toThrow(/missing ALL/);
  });
});

describe("aggregateMRUsage", () => {
  it("computes weighted averages for MR buckets", () => {
    const usage = {
      ALL: 0.1,
      "0": 1,
      "15": 1,
      "25": 1,
    };

    const result = aggregateMRUsage(usage);
    expect(result["0-10"]).toBeCloseTo(1);
    expect(result["11-20"]).toBeCloseTo(1);
    expect(result["21+"]).toBeCloseTo(1);
  });

  it("clamps anomalous MR 40 into the 21+ bucket using max weight", () => {
    const without40 = aggregateMRUsage({
      ALL: 0.1,
      "25": 0.1,
    });
    const with40 = aggregateMRUsage({
      ALL: 0.1,
      "25": 0.1,
      "40": 1,
    });

    expect(with40["21+"]).toBeGreaterThan(without40["21+"]);
    expect(MR_WEIGHTS[36]).toBeGreaterThan(0);
  });
});

describe("getRankedItems", () => {
  it("groups Warframe Prime/Umbra variants under the base name", () => {
    const ranked = getRankedItems(sampleRoot(), "Warframe", "ALL");
    const excalibur = ranked.find((item) => item.name === "Excalibur");

    expect(excalibur).toBeTruthy();
    expect(excalibur?.usage).toBeCloseTo(0.18);
    expect(ranked.some((item) => item.name.includes("Prime"))).toBe(false);
  });

  it("ranks Primary items by ALL usage without grouping", () => {
    const ranked = getRankedItems(sampleRoot(), "Primary", "ALL");
    expect(ranked.map((item) => item.name)).toEqual(["Braton", "Soma"]);
    expect(ranked[0].rank).toBe(1);
  });
});

describe("getTopItemsWithTrends", () => {
  it("computes previous-year rank deltas", () => {
    const current = sampleRoot();
    const previous: RootData = {
      ALL: {
        Warframe: {
          Mag: {
            ALL: 0.2,
            "0": 0.2,
            "15": 0.2,
            "25": 0.2,
          },
          Excalibur: {
            ALL: 0.05,
            "0": 0.05,
            "15": 0.05,
            "25": 0.05,
          },
        },
        Primary: {},
      },
    };

    const top = getTopItemsWithTrends(current, previous, "Warframe", "ALL", 10);
    const excalibur = top.find((item) => item.name === "Excalibur");
    const mag = top.find((item) => item.name === "Mag");

    // Previous: Mag #1, Excalibur #2. Current grouped Excalibur leads.
    expect(excalibur?.rank).toBe(1);
    expect(excalibur?.previousRank).toBe(2);
    expect(mag?.previousRank).toBe(1);
  });

  it("marks items without previous rank as undefined previousRank", () => {
    const top = getTopItemsWithTrends(sampleRoot(), null, "Primary", "ALL", 5);
    expect(top[0].previousRank).toBeUndefined();
  });
});
