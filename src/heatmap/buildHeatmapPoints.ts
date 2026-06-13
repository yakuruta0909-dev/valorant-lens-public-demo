import type { MatchTimelineEvent } from "../timeline/types";
import { applyMapTransform } from "../maps/applyMapTransform";
import { applyCalibration } from "../maps/applyCalibration";
import { convertToScreenCoordinate, normalizeCoordinate } from "../maps/coordinateAdapter";
import { getMapAsset } from "../maps/mapAssetRegistry";
import { loadMapCalibration } from "../maps/mapCalibrationStorage";
import { getMapMetadata } from "../maps/mapMetadata";
import { isValorantMap } from "../maps/mapMetadata";
import type { HeatmapPoint, HeatmapPointSummary } from "./heatmapTypes";

const resolveMapName = (event: MatchTimelineEvent, matchMapById: Map<string, string>) =>
  event.map ?? matchMapById.get(event.matchId ?? "");

export const buildHeatmapPoints = (
  timelineEvents: MatchTimelineEvent[],
  matchMapById: Map<string, string>,
): HeatmapPoint[] =>
  timelineEvents.flatMap((event) => {
    const mapName = resolveMapName(event, matchMapById);
    const metadata = getMapMetadata(mapName);
    const asset = getMapAsset(mapName);

    if (!metadata || !asset || !isValorantMap(mapName) || !Number.isFinite(event.positionX) || !Number.isFinite(event.positionY)) {
      return [];
    }

    const normalized = normalizeCoordinate({
      metadata,
      worldX: event.positionX,
      worldY: event.positionY,
    });

    if (normalized.x < 0 || normalized.x > 1 || normalized.y < 0 || normalized.y > 1) {
      return [];
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

    return [
      {
        agent: event.agent,
        eventType: event.eventType,
        isPlayerEvent: event.isPlayerEvent,
        team: event.team,
        weapon: event.weapon,
        x: screen.x,
        y: screen.y,
      },
    ];
  });

export const buildHeatmapPointSummary = (points: HeatmapPoint[]): HeatmapPointSummary => ({
  allyEvents: points.filter((point) => point.team === "ally").length,
  deathPoints: points.filter((point) => point.eventType === "death").length,
  enemyEvents: points.filter((point) => point.team === "enemy").length,
  killPoints: points.filter((point) => point.eventType === "kill").length,
  playerEvents: points.filter((point) => point.isPlayerEvent).length,
  totalPoints: points.length,
});
