"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
  cn,
} from "@festibee/ui";
import type { MergeFieldKey } from "@festibee/api";
import type { PerformanceDetailRes } from "@/features/performance";
import type {
  ReservationRowInput,
  TimetableRowInput,
} from "../lib/build-edited-data";

export interface MergePlaceInput {
  mode: "existing" | "new";
  existingPlaceId: number | null;
  newPlaceName: string;
  newPlaceAddress: string;
}

export interface MergeResult {
  place: MergePlaceInput;
  transportationInfo: string;
  banGoods: string;
  remark: string;
  reservations: ReservationRowInput[];
  timetables: TimetableRowInput[];
  overwrite: MergeFieldKey[];
}

interface PlaceOption {
  id?: number;
  placeName?: string;
  address?: string;
}

interface MergeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: PerformanceDetailRes;
  crawl: {
    posterUrl: string | null;
    startDate: string | null;
    endDate: string | null;
    place: MergePlaceInput;
    placeName: string | null;
    placeAddress: string | null;
    transportationInfo: string;
    banGoods: string;
    remark: string;
    reservations: ReservationRowInput[];
    timetables: TimetableRowInput[];
  };
  places: PlaceOption[];
  onApply: (result: MergeResult) => void;
}

type Side = "existing" | "crawl";

function norm(v: string | null | undefined): string {
  return (v ?? "").trim();
}
function dt(v: string | null | undefined): string {
  return v ? v.replace("T", " ").slice(0, 16) : "";
}
function timeOnly(v: string | null | undefined): string {
  if (!v) return "";
  const m = v.match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
  return m ? `${m[1]}:${m[2]}:${m[3] ?? "00"}` : v;
}
function dtInput(v: string | null | undefined): string {
  return v ? v.replace(/(\.\d+)?([+-]\d{2}:?\d{2}|Z)?$/, "").slice(0, 19) : "";
}

/** 기존 공연 예매를 폼 예매행으로. */
function existingReservationRows(detail: PerformanceDetailRes): ReservationRowInput[] {
  return (detail.reservationInfos ?? []).map((r) => ({
    enabled: true,
    openDateTime: dtInput(r.openDateTime),
    closeDateTime: dtInput(r.closeDateTime ?? r.openDateTime),
    ticketURL: r.ticketURL ?? "",
    type: r.type === "EARLY_BIRD" ? "EARLY_BIRD" : "GENERAL",
  }));
}

/** 기존 공연 타임테이블을 폼 타임테이블행(1인=1행)으로. 스테이지는 이름 힌트로 넣고 auto-match 가 id 를 채운다. */
function existingTimetableRows(detail: PerformanceDetailRes): TimetableRowInput[] {
  const rows: TimetableRowInput[] = [];
  for (const t of detail.timeTables ?? []) {
    const artists = t.artists && t.artists.length ? t.artists : [null];
    for (const a of artists) {
      rows.push({
        enabled: true,
        performanceDate: t.performanceDate ?? "",
        startTime: timeOnly(t.startTime),
        endTime: timeOnly(t.endTime ?? t.startTime),
        stageHint: t.performanceHall ?? null,
        stageId: "",
        artists: [
          a && a.artistId != null
            ? {
                crawledName: a.artistName ?? "",
                mapping: { existingArtistId: a.artistId, newArtist: null },
              }
            : {
                crawledName: a?.artistName ?? "",
                mapping: {
                  existingArtistId: null,
                  newArtist: { displayName: a?.artistName ?? "" },
                },
              },
        ],
      });
    }
  }
  return rows;
}

const reservationKey = (r: ReservationRowInput) =>
  `${r.openDateTime}|${r.closeDateTime}`;
const timetableKey = (t: TimetableRowInput) =>
  `${t.performanceDate}|${t.startTime}|${t.endTime}|${t.stageHint ?? ""}|${
    t.artists[0]?.crawledName ?? ""
  }`;

/**
 * 기존 공연 데이터와 크롤 데이터를 한 모달에서 병합한다.
 * - 스칼라(포스터/일정/장소): 기존 vs 크롤 선택 → 크롤 선택 시 덮어쓰기 플래그.
 * - 부가정보: 기존 vs 크롤 선택 → 값 자체를 폼에 채운다.
 * - 예매/타임테이블: 기존+크롤 합집합을 체크박스로 선택 → 폼 입력행으로 채운다.
 * 확정하면 결과가 폼의 실제 입력 칸으로 들어가고, 이후 일반 편집 후 반영한다.
 */
export function MergeModal({
  open,
  onOpenChange,
  detail,
  crawl,
  places,
  onApply,
}: MergeModalProps) {
  const p = detail.performance;

  const existingResRows = useMemo(() => existingReservationRows(detail), [detail]);
  const existingTtRows = useMemo(() => existingTimetableRows(detail), [detail]);

  // 합집합(중복 제거). 기존 항목 우선.
  const reservationUnion = useMemo(() => {
    const map = new Map<string, { row: ReservationRowInput; source: Side }>();
    existingResRows.forEach((r) => map.set(reservationKey(r), { row: r, source: "existing" }));
    crawl.reservations.forEach((r) => {
      const k = reservationKey(r);
      if (!map.has(k)) map.set(k, { row: r, source: "crawl" });
    });
    return [...map.values()];
  }, [existingResRows, crawl.reservations]);

  const timetableUnion = useMemo(() => {
    const map = new Map<string, { row: TimetableRowInput; source: Side }>();
    existingTtRows.forEach((t) => map.set(timetableKey(t), { row: t, source: "existing" }));
    crawl.timetables.forEach((t) => {
      const k = timetableKey(t);
      if (!map.has(k)) map.set(k, { row: t, source: "crawl" });
    });
    return [...map.values()];
  }, [existingTtRows, crawl.timetables]);

  // 선택 상태
  const hasPoster = Boolean(norm(p?.posterUrl));
  const hasDates = Boolean(norm(p?.startDate));
  const hasPlace = Boolean(norm(p?.placeName));

  const [posterSide, setPosterSide] = useState<Side>("existing");
  const [dateSide, setDateSide] = useState<Side>("existing");
  const [placeSide, setPlaceSide] = useState<Side>("existing");
  const [transSide, setTransSide] = useState<Side>(
    norm(p?.transportationInfo) ? "existing" : "crawl"
  );
  const [banSide, setBanSide] = useState<Side>(
    norm(p?.banGoods) ? "existing" : "crawl"
  );
  const [remarkSide, setRemarkSide] = useState<Side>(
    norm(p?.remark) ? "existing" : "crawl"
  );
  const [resIncluded, setResIncluded] = useState<Set<string>>(
    () => new Set(reservationUnion.map((x) => reservationKey(x.row)))
  );
  const [ttIncluded, setTtIncluded] = useState<Set<string>>(
    () => new Set(timetableUnion.map((x) => timetableKey(x.row)))
  );

  const pickInfo = (side: Side, existing: string | undefined, crawlVal: string) =>
    side === "existing" ? norm(existing) : crawlVal;

  const handleConfirm = () => {
    const overwrite: MergeFieldKey[] = [];
    if (hasPoster && posterSide === "crawl") overwrite.push("poster_url");
    if (hasDates && dateSide === "crawl") {
      overwrite.push("start_date", "end_date");
    }

    // 장소
    let place: MergePlaceInput;
    if (placeSide === "existing" && hasPlace) {
      const matched = places.find(
        (pl) =>
          norm(pl.placeName).toLowerCase() === norm(p?.placeName).toLowerCase()
      );
      place = matched?.id != null
        ? {
            mode: "existing",
            existingPlaceId: matched.id,
            newPlaceName: matched.placeName ?? "",
            newPlaceAddress: matched.address ?? "",
          }
        : {
            mode: "new",
            existingPlaceId: null,
            newPlaceName: p?.placeName ?? "",
            newPlaceAddress: p?.placeAddress ?? "",
          };
    } else {
      place = crawl.place;
      if (hasPlace) overwrite.push("place");
    }

    onApply({
      place,
      transportationInfo: pickInfo(transSide, p?.transportationInfo, crawl.transportationInfo),
      banGoods: pickInfo(banSide, p?.banGoods, crawl.banGoods),
      remark: pickInfo(remarkSide, p?.remark, crawl.remark),
      reservations: reservationUnion
        .filter((x) => resIncluded.has(reservationKey(x.row)))
        .map((x) => x.row),
      timetables: timetableUnion
        .filter((x) => ttIncluded.has(timetableKey(x.row)))
        .map((x) => x.row),
      overwrite,
    });
    onOpenChange(false);
  };

  const toggle = (set: Set<string>, key: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>기존 공연 데이터 병합</DialogTitle>
          <DialogDescription>
            기존 공연{" "}
            <span className="font-medium text-foreground">
              {p?.name} (#{p?.id})
            </span>
            의 데이터와 크롤 데이터를 병합합니다. 확정하면 아래 선택이 입력 칸에
            채워집니다. 공연 이름은 기존 값을 유지합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* 스칼라 충돌 */}
          <section className="space-y-2">
            <SectionTitle>기본 정보</SectionTitle>
            {hasPoster && (
              <ScalarChoice
                label="포스터"
                side={posterSide}
                onSide={setPosterSide}
                existing={norm(p?.posterUrl)}
                crawl={norm(crawl.posterUrl)}
              />
            )}
            {hasDates && (
              <ScalarChoice
                label="일정"
                side={dateSide}
                onSide={setDateSide}
                existing={`${p?.startDate ?? ""} ~ ${p?.endDate ?? p?.startDate ?? ""}`}
                crawl={`${crawl.startDate ?? ""} ~ ${crawl.endDate ?? crawl.startDate ?? ""}`}
              />
            )}
            {!hasPoster && !hasDates && (
              <EmptyLine>기존 공연에 포스터·일정이 없어 크롤 값으로 채워집니다.</EmptyLine>
            )}
          </section>

          <Separator />

          {/* 장소 */}
          <section className="space-y-2">
            <SectionTitle>장소</SectionTitle>
            {hasPlace ? (
              <ScalarChoice
                label="장소"
                side={placeSide}
                onSide={setPlaceSide}
                existing={`${p?.placeName ?? ""}${p?.placeAddress ? ` · ${p.placeAddress}` : ""}`}
                crawl={`${crawl.placeName ?? "(없음)"}${crawl.placeAddress ? ` · ${crawl.placeAddress}` : ""}`}
              />
            ) : (
              <EmptyLine>
                기존 공연에 장소가 없어 크롤 장소({crawl.placeName ?? "없음"})로 채워집니다.
              </EmptyLine>
            )}
          </section>

          <Separator />

          {/* 부가정보 */}
          <section className="space-y-2">
            <SectionTitle>공연 부가정보</SectionTitle>
            <InfoChoice label="교통" side={transSide} onSide={setTransSide} existing={norm(p?.transportationInfo)} crawl={crawl.transportationInfo} />
            <InfoChoice label="반입금지" side={banSide} onSide={setBanSide} existing={norm(p?.banGoods)} crawl={crawl.banGoods} />
            <InfoChoice label="비고" side={remarkSide} onSide={setRemarkSide} existing={norm(p?.remark)} crawl={crawl.remark} />
          </section>

          <Separator />

          {/* 예매 */}
          <section className="space-y-2">
            <SectionTitle>
              예매{" "}
              <span className="font-normal text-muted-foreground">
                (기존+크롤 합집합, 포함할 항목 선택)
              </span>
            </SectionTitle>
            {reservationUnion.length === 0 ? (
              <EmptyLine>예매 정보가 없습니다.</EmptyLine>
            ) : (
              <ul className="space-y-1">
                {reservationUnion.map(({ row, source }) => {
                  const k = reservationKey(row);
                  return (
                    <RowToggle
                      key={k}
                      checked={resIncluded.has(k)}
                      onToggle={() => toggle(resIncluded, k, setResIncluded)}
                      source={source}
                    >
                      {row.type === "EARLY_BIRD" ? "얼리버드" : "일반"} ·{" "}
                      {dt(row.openDateTime)} ~ {dt(row.closeDateTime)}
                      {row.ticketURL ? ` · ${row.ticketURL}` : ""}
                    </RowToggle>
                  );
                })}
              </ul>
            )}
          </section>

          <Separator />

          {/* 타임테이블 */}
          <section className="space-y-2">
            <SectionTitle>
              타임테이블{" "}
              <span className="font-normal text-muted-foreground">
                (기존+크롤 합집합, 포함할 항목 선택)
              </span>
            </SectionTitle>
            {timetableUnion.length === 0 ? (
              <EmptyLine>타임테이블 정보가 없습니다.</EmptyLine>
            ) : (
              <ul className="space-y-1">
                {timetableUnion.map(({ row, source }) => {
                  const k = timetableKey(row);
                  return (
                    <RowToggle
                      key={k}
                      checked={ttIncluded.has(k)}
                      onToggle={() => toggle(ttIncluded, k, setTtIncluded)}
                      source={source}
                    >
                      {row.performanceDate || "날짜 미정"}{" "}
                      {row.startTime ? `${row.startTime.slice(0, 5)}~${row.endTime.slice(0, 5)}` : ""}
                      {row.stageHint ? ` [${row.stageHint}]` : ""}
                      {row.artists[0]?.crawledName ? ` — ${row.artists[0].crawledName}` : ""}
                    </RowToggle>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            병합해서 입력 칸 채우기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold">{children}</p>;
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded border border-dashed px-2 py-1.5 text-xs text-muted-foreground">
      {children}
    </p>
  );
}

function ScalarChoice({
  label,
  side,
  onSide,
  existing,
  crawl,
}: {
  label: string;
  side: Side;
  onSide: (s: Side) => void;
  existing: string;
  crawl: string;
}) {
  const same = norm(existing) === norm(crawl);
  return (
    <div className="rounded-md border p-2">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-xs font-medium">{label}</span>
        {same ? (
          <Badge variant="outline" className="text-[10px]">동일</Badge>
        ) : (
          <Badge variant="destructive" className="text-[10px]">충돌</Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <SideButton active={side === "existing"} heading="기존 유지" value={existing} onClick={() => onSide("existing")} />
        <SideButton active={side === "crawl"} heading="크롤 값으로" value={crawl} accent onClick={() => onSide("crawl")} />
      </div>
    </div>
  );
}

function InfoChoice({
  label,
  side,
  onSide,
  existing,
  crawl,
}: {
  label: string;
  side: Side;
  onSide: (s: Side) => void;
  existing: string;
  crawl: string;
}) {
  if (!existing && !crawl) return null;
  return (
    <div className="grid grid-cols-[3rem_1fr] items-start gap-2">
      <span className="pt-1 text-xs text-muted-foreground">{label}</span>
      <div className="grid grid-cols-2 gap-1.5">
        <SideButton active={side === "existing"} heading="기존" value={existing} onClick={() => onSide("existing")} />
        <SideButton active={side === "crawl"} heading="크롤" value={crawl} accent onClick={() => onSide("crawl")} />
      </div>
    </div>
  );
}

function SideButton({
  active,
  heading,
  value,
  accent,
  onClick,
}: {
  active: boolean;
  heading: string;
  value: string;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded border p-1.5 text-left text-xs transition-colors",
        active
          ? accent
            ? "border-emerald-500 bg-emerald-500/10"
            : "border-primary bg-accent"
          : "border-transparent bg-muted/50 opacity-70 hover:opacity-100"
      )}
    >
      <span className="block text-[10px] font-medium text-muted-foreground">{heading}</span>
      <span className="block truncate" title={value}>{value || "(없음)"}</span>
    </button>
  );
}

function RowToggle({
  checked,
  onToggle,
  source,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  source: Side;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2 rounded border p-1.5 text-xs">
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      <Badge variant={source === "existing" ? "secondary" : "outline"} className="shrink-0 text-[10px]">
        {source === "existing" ? "기존" : "크롤"}
      </Badge>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </li>
  );
}
