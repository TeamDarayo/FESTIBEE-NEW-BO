import type {
  CrawlMapping,
  EditedData,
  ManualArtistMapping,
  NormalizedCrawlData,
} from "@festibee/api";

export type PerformanceTargetInput =
  | { mode: "existing"; id: number; name: string }
  | {
      mode: "new";
      name: string;
      startDate: string;
      endDate: string;
      posterUrl: string;
    };

export interface ReservationRowInput {
  enabled: boolean;
  openDateTime: string;
  closeDateTime: string;
  ticketURL: string;
  type: string;
}

export interface TimetableArtistInput {
  crawledName: string;
  mapping: ManualArtistMapping;
}

export interface TimetableRowInput {
  enabled: boolean;
  performanceDate: string;
  startTime: string;
  endTime: string;
  stageHint: string | null;
  stageId: string; // 숫자 텍스트. "" = 신규 스테이지
  artists: TimetableArtistInput[];
}

export interface BuildEditedDataArgs {
  crawlData: NormalizedCrawlData;
  performanceTarget: PerformanceTargetInput | null;
  placeMode: "existing" | "new";
  existingPlaceId: number | null;
  newPlaceName: string;
  newPlaceAddress: string;
  reservations: ReservationRowInput[];
  timetables: TimetableRowInput[];
  /** 공연 부가정보(어노테이션에서 직접 입력). 빈 값이면 반영 시 기존 공연 값 유지. */
  transportationInfo?: string;
  banGoods?: string;
  remark?: string;
}

/**
 * 라벨링 폼 상태를 백엔드 계약(`{ extraction, mapping }`)으로 변환한다.
 * extraction 은 원본 crawlData 를 복제한 뒤 교정 값만 덮어써 스키마/메타데이터를 보존한다.
 * mapping 은 엔티티 연결(ID) 결정만 담는다.
 */
export function buildEditedData({
  crawlData,
  performanceTarget,
  placeMode,
  existingPlaceId,
  newPlaceName,
  newPlaceAddress,
  reservations,
  timetables,
  transportationInfo,
  banGoods,
  remark,
}: BuildEditedDataArgs): EditedData {
  const isNewPerf = performanceTarget?.mode === "new";

  const venderIdByArtist = new Map<string, string | null>();
  for (const a of crawlData.artists ?? []) {
    if (!venderIdByArtist.has(a.name)) {
      venderIdByArtist.set(a.name, a.vender_id ?? null);
    }
  }

  const enabledReservations = reservations.filter((r) => r.enabled);
  const enabledTimetables = timetables.filter((t) => t.enabled);

  const dates = isNewPerf
    ? [performanceTarget.startDate, performanceTarget.endDate].filter(
        (d): d is string => Boolean(d)
      )
    : (crawlData.dates ?? []);

  const extraction: NormalizedCrawlData = {
    ...crawlData,
    title: isNewPerf ? performanceTarget.name : crawlData.title,
    poster_url: isNewPerf
      ? performanceTarget.posterUrl || crawlData.poster_url
      : crawlData.poster_url,
    venue: {
      name: newPlaceName.trim() || crawlData.venue?.name || "",
      address: newPlaceAddress.trim() || crawlData.venue?.address || null,
      vender_id: crawlData.venue?.vender_id ?? null,
    },
    dates,
    reservations: enabledReservations.map((r) => ({
      start_at: r.openDateTime,
      end_at: r.closeDateTime || null,
      url: r.ticketURL.trim(),
    })),
    artists: enabledTimetables.flatMap((t) =>
      t.artists.map((a) => ({
        name: a.crawledName,
        vender_id: venderIdByArtist.get(a.crawledName) ?? null,
        date: t.performanceDate || null,
        start_time: t.startTime || null,
        end_time: t.endTime || null,
        stage: t.stageHint,
      }))
    ),
    transportation_info: transportationInfo?.trim() || null,
    ban_goods: banGoods?.trim() || null,
    remark: remark?.trim() || null,
  };

  const artistIdByName: Record<string, number | null> = {};
  for (const t of enabledTimetables) {
    for (const a of t.artists) {
      artistIdByName[a.crawledName] = a.mapping.existingArtistId ?? null;
    }
  }

  const stageIdByName: Record<string, number | null> = {};
  for (const t of enabledTimetables) {
    const name = t.stageHint?.trim();
    if (!name) continue;
    stageIdByName[name] = t.stageId.trim() ? Number(t.stageId.trim()) : null;
  }

  const mapping: CrawlMapping = {
    targetPerformanceId:
      performanceTarget?.mode === "existing" ? performanceTarget.id : null,
    placeId: placeMode === "existing" ? existingPlaceId : null,
    artistIdByName,
    stageIdByName,
    reservationTypes: enabledReservations.map((r) => r.type),
  };

  return { extraction, mapping };
}
