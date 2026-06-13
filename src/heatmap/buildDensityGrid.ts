import type { DensityCell, DensityGrid, HeatmapPoint } from "./heatmapTypes";

export const buildDensityGrid = ({
  canvasSize,
  gridSize,
  points,
}: {
  canvasSize: number;
  gridSize: number;
  points: HeatmapPoint[];
}): DensityGrid => {
  const safeGridSize = Math.max(1, Math.floor(gridSize));
  const cellSize = canvasSize / safeGridSize;
  const counts = new Map<string, { count: number; xIndex: number; yIndex: number }>();

  points.forEach((point) => {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      return;
    }

    if (point.x < 0 || point.x > canvasSize || point.y < 0 || point.y > canvasSize) {
      return;
    }

    const xIndex = Math.min(safeGridSize - 1, Math.floor(point.x / cellSize));
    const yIndex = Math.min(safeGridSize - 1, Math.floor(point.y / cellSize));
    const key = `${xIndex}:${yIndex}`;
    const current = counts.get(key);

    counts.set(key, {
      count: (current?.count ?? 0) + 1,
      xIndex,
      yIndex,
    });
  });

  const maxDensity = Math.max(0, ...Array.from(counts.values()).map((cell) => cell.count));
  const cells: DensityCell[] = Array.from(counts.values()).map((cell) => ({
    count: cell.count,
    intensity: maxDensity === 0 ? 0 : cell.count / maxDensity,
    xIndex: cell.xIndex,
    yIndex: cell.yIndex,
  }));

  return {
    activeCells: cells.length,
    cellSize,
    cells,
    gridSize: safeGridSize,
    maxDensity,
  };
};
