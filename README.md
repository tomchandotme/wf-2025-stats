# Warframe Usage Stats

A modern data visualization dashboard for Warframe usage statistics, built with React 19, TypeScript, and Vite 7.

## Screenshot

<img src="screenshot.png" alt="Screenshot of Warframe Usage Stats" />

## Methodology: Mastery Rank Weighted Aggregation

The usage statistics provided by Digital Extremes often break down usage by individual Mastery Rank (MR 0 to 36) alongside a global "ALL" percentage. However, simply summing the percentages for a range (e.g., MR 0-10) is mathematically incorrect as it doesn't account for the relative population size of players at each rank.

This dashboard uses a **Mastery Rank Weighted Aggregation** approach:

1.  **Weight Discovery**: We solved a linear system `global_usage = sum(weight_i * usage_at_mr_i)` across thousands of items to discover the relative population weights `W_0...W_36` of the Warframe player base.
2.  **Range Averaging**: Usage for a range (like "0-10") is calculated as a weighted average: `(sum(usage_i * weight_i)) / sum(weight_i)`.
3.  **Correctness**: This ensures that "0-10" usage reflects the actual popularity of an item _within that specific population tier_, consistent with the global average.

**Cross-year note:** Weights are derived from the 2025 dataset and reused for every displayed year so MR-tier comparisons stay methodologically consistent across the timeline. Historical years are therefore weighted against the 2025 player-rank distribution, not a year-specific demographic fit. Anomalous MR keys above 36 (seen in 2024 as `"40"`) are clamped to MR 36 so they still contribute to the `21+` bucket.

## Methodology: Smart Grouping

For the "Warframe" category, we automatically group base versions with their corresponding Prime and Umbra variants. This provides a more accurate picture of a Warframe's total impact on the meta, as players often transition through variants while maintaining the same playstyle.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (preferred), or Node.js 20+ with npm.

### Installation

```bash
bun install
# or: npm install
```

### Development

Start the development server on port 3579:

```bash
bun run dev
```

### Test / Lint / Build

```bash
bun run test
bun run lint
bun run build
```

`build` is non-mutating (`tsc -b && vite build`). Image URL generation is separate:

```bash
bun run generate:images
bun run generate:weights
bun run generate:client-data
```

## Project Structure

- `src/components/`: React components. `PopularityDashboard.tsx` is the main entry point.
- `src/utils/`: Data processing and aggregation logic (`dataLoader.ts`).
- `src/types.ts`: TypeScript interfaces for usage data.
- `scripts/`: TypeScript scripts for data generation and enrichment.
- `public/data/`: ALL-only JSON payloads served to the client.
- `data/raw/`: Full source archives (may include unused platform segments).
- `docs/CODEMAPS/`: Architectural documentation and system maps.

## Utility Scripts

The project includes scripts for data processing, located in the `scripts/` directory:

```bash
bun run generate:images      # rebuild data/urls.json from @wfcd/items
bun run generate:weights     # rebuild src/constants/mrWeights.ts
bun run generate:client-data # archive raw JSON and write ALL-only public payloads
```

## License

MIT — see [LICENSE](LICENSE).
