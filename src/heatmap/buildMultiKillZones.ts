import { convertToScreenCoordinate, normalizeCoordinate } from "../maps/coordinateAdapter";
import { applyMapTransform } from "../maps/applyMapTransform";
import { applyCalibration } from "../maps/applyCalibration";
import { getMapAsset } from "../maps/mapAssetRegistry";
import { loadMapCalibration } from "../maps/mapCalibrationStorage";
import { getMapMetadata } from "../maps/mapMetadata";
import { isValorantMap } from "../maps/mapMetadata";
import type { MatchTimelineEvent } from "../timeline/types";
import { calculateMultiKillScore } from "./calculateMultiKillScore";
import type { MultiKillZone, MultiKillZoneSummary } from "./heatmapTypes";

const multiKillWindowSeconds = 10;
const minKillsForMultiKill = 2;

const resolveMapName = (event: MatchTimelineEvent, matchMapById: Map<string, string>) =>
  event.map ?? matchMapById.get(event.matchId ?? "");

const buildKillGroupKey = (event: MatchTimelineEvent) =>
  `${event.matchId ?? "unknown"}:${event.killer ?? "unknown"}`;

const buildEventKey = (event: MatchTimelineEvent) =>
  [
    event.matchId ?? "",
    event.killer ?? "",
    event.timestamp,
    event.positionX,
    event.positionY,
    event.weapon ?? "",
  ].join("|");

const groupKillEvents = (timelineEvents: MatchTimelineEvent[]) => {
  const groups = new Map<string, MatchTimelineEvent[]>();

  timelineEvents
    .filter((event) => event.eventType === "kill" && event.killer)
    .forEach((event) => {
      const key = buildKillGroupKey(event);
      groups.set(key, [...(groups.get(key) ?? []), event]);
    });

  groups.forEach((events, key) => {
    groups.set(
      key,
      [...events].sort((left, right) => left.timestamp - right.timestamp),
    );
  });

  return groups;
};

const findMultiKillEvents = (timelineEvents: MatchTimelineEvent[]) => {
  const groups = groupKillEvents(timelineEvents);
  const qualifyingEventKeys = new Set<string>();

  groups.forEach((events) => {
    events.forEach((event, index) => {
      const windowEvents = events.filter(
        (candidate) =>
          candidate.timestamp >= event.timestamp &&
          candidate.timestamp - event.timestamp <= multiKillWindowSeconds,
      );

      if (windowEvents.length < minKillsForMultiKill) {
        return;
      }

      windowEvents.forEach((windowEvent) => qualifyingEventKeys.add(buildEventKey(windowEvent)));
      const previousEvent = events[index - 1];

      if (previousEvent && event.timestamp - previousEvent.timestamp <= multiKillWindowSeconds) {
        qualifyingEventKeys.add(buildEventKey(previousEvent));
      }
    });
  });

  return timelineEvents.filter((event) => qualifyingEventKeys.has(buildEventKey(event)));
};

export const buildMultiKillZones = ({
  canvasSize,
  gridSize,
  matchMapById,
  timelineEvents,
}: {
  canvasSize: number;
  gridSize: number;
  matchMapById: Map<string, string>;
  timelineEvents: MatchTimelineEvent[];
}): MultiKillZone[] => {
  const safeGridSize = Math.max(1, Math.floor(gridSize));
  const cellSize = canvasSize / safeGridSize;
  const cellCounts = new Map<string, { count: number; xIndex: number; yIndex: number }>();

  findMultiKillEvents(timelineEvents).forEach((event) => {
    const mapName = resolveMapName(event, matchMapById);
    const metadata = getMapMetadata(mapName);
    const asset = getMapAsset(mapName);

    if (!metadata || !asset || !isValorantMap(mapName) || !Number.isFinite(event.positionX) || !Number.isFinite(event.positionY)) {
      return;
    }

    const normalized = normalizeCoordinate({
      metadata,
      worldX: event.positionX,
      worldY: event.positionY,
    });

    if (normalized.x < 0 || normalized.x > 1 || normalized.y < 0 || normalized.y > 1) {
      return;
    }

    const transformed = applyMapTransform({
      asset,
      coordinate: convertToScreenCoordinate({ metadata, normalized }),
    });
    const screen = applyCalibration({
      calibration: loadMapCalibration(mapName),
      coordinate: transformed,
      origin: {
        x: asset.width / 2,
        y: asset.height / 2,
      },
    });
    const xIndex = Math.min(safeGridSize - 1, Math.floor(screen.x / cellSize));
    const yIndex = Math.min(safeGridSize - 1, Math.floor(screen.y / cellSize));
    const key = `${xIndex}:${yIndex}`;
    const current = cellCounts.get(key);

    cellCounts.set(key, {
      count: (current?.count ?? 0) + 1,
      xIndex,
      yIndex,
    });
  });

  const maxMultiKillCount = Math.max(0, ...Array.from(cellCounts.values()).map((cell) => cell.count));

  return Array.from(cellCounts.values())
    .map((cell) => ({
      multiKillCount: cell.count,
      score: calculateMultiKillScore({
        maxMultiKillCount,
        multiKillCount: cell.count,
      }),
      xIndex: cell.xIndex,
      yIndex: cell.yIndex,
    }))
    .sort((left, right) => right.score - left.score || right.multiKillCount - left.multiKillCount);
};

export const summarizeMultiKillZones = (multiKillZones: MultiKillZone[]): MultiKillZoneSummary => {
  const scoreTotal = multiKillZones.reduce((total, zone) => total + zone.score, 0);

  return {
    averageScore: multiKillZones.length === 0 ? 0 : scoreTotal / multiKillZones.length,
    highestScore: multiKillZones[0]?.score ?? 0,
    multiKillZoneCount: multiKillZones.length,
  };
};
