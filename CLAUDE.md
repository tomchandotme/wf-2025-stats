# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Build**: `npm run build` or `bun run build`
- **Lint**: `npm run lint` or `bun run lint`
- **Test**: `npm run test` or `bun run test`
- **Development**: `npm run dev` or `bun run dev` (Runs on port 3579)
- **Preview Build**: `npm run preview` or `bun run preview`
- **Utility Scripts**: Use `tsx scripts/<script-name>.ts` or npm/bun script aliases:
  - `generate:images` → `scripts/gen_img_url.ts`
  - `generate:weights` → `scripts/solve_weights.ts`
  - `generate:client-data` → `scripts/prepare_client_data.ts`

## Architecture

- **Framework**: React 19 (SPAs) + Vite 7 + Tailwind CSS 4.
- **Data Visualization**: Recharts is used for rendering usage distribution.
- **Data Source**: Warframe usage statistics are stored as JSON files under `public/data/` (e.g., `WarframeUsageData2025.json`). Full multi-platform archives (when present) live in `data/raw/`.

### Folder Structure

- `src/components/`: Core UI components. `PopularityDashboard.tsx` is the primary dashboard entry point.
- `src/utils/`: Data processing and aggregation logic. `dataLoader.ts` handles the import and filtering of usage data.
- `scripts/`: TypeScript scripts for data generation and enrichment (run with `tsx`).
- `docs/CODEMAPS/`: Detailed architectural documentation for specific sub-systems (frontend, data, etc.).

### Data Flow

1. **Source**: Raw JSON data files in `public/data/` (ALL-only client payloads).
2. **loader**: `src/utils/dataLoader.ts` fetches and validates JSON into typed interfaces.
3. **Consumer**: `PopularityDashboard.tsx` manages state (filtering, sorting, paging) and uses `dataLoader.ts` to retrieve subsets of data.
4. **View**: `PopularityRow.tsx` displays individual item stats using `Recharts`.
