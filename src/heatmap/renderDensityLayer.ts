import type { DensityGrid } from "./heatmapTypes";

export const renderDensityLayer = ({
  color = "255, 70, 85",
  context,
  densityGrid,
  opacity,
}: {
  color?: string;
  context: CanvasRenderingContext2D;
  densityGrid: DensityGrid;
  opacity: number;
}) => {
  const safeOpacity = Math.max(0, Math.min(1, opacity));

  densityGrid.cells.forEach((cell) => {
    const alpha = Math.max(0.08, cell.intensity * safeOpacity);

    context.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
    context.fillRect(
      cell.xIndex * densityGrid.cellSize,
      cell.yIndex * densityGrid.cellSize,
      densityGrid.cellSize,
      densityGrid.cellSize,
    );
  });
};
