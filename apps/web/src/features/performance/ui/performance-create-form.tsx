"use client";

import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Separator,
  Badge,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@festibee/ui";
import { useCreatePerformance } from "../hooks/use-performance-mutations";
import { useCreateFormReducer } from "../hooks/use-create-form-reducer";
import type { CreateFormState } from "../hooks/use-create-form-reducer";
import type {
  TimeTableDTO,
  ReservationInfoContentDTO,
  PerformanceURLContentDTO,
} from "../api/performance-api";
import { groupRowsToTimeTables } from "../lib/casting-row-utils";
import { PlaceCombobox } from "./place-combobox";
import { AutoResizeTextarea } from "./auto-resize-textarea";
import { CastingSpreadsheet } from "./casting-spreadsheet";
import { CreateReservationSection } from "./create-reservation-section";
import { CreateUrlSection } from "./create-url-section";

// ============================================================================
// Transform state → API payload
// ============================================================================

function buildTimeTables(state: CreateFormState): TimeTableDTO[] {
  return groupRowsToTimeTables(state.castingRows);
}

function buildReservations(
  state: CreateFormState
): ReservationInfoContentDTO[] {
  return state.reservations
    .filter((r) => r.ticketURL.trim() || r.openDateTime)
    .map((r) => ({
      type: r.type as ReservationInfoContentDTO["type"],
      openDateTime: r.openDateTime || undefined,
      ticketURL: r.ticketURL.trim() || undefined,
      remark: r.remark.trim() || undefined,
    }));
}

function buildUrls(state: CreateFormState): PerformanceURLContentDTO[] {
  return state.urls
    .filter((u) => u.url.trim())
    .map((u) => ({
      type: u.type as PerformanceURLContentDTO["type"],
      url: u.url.trim(),
    }));
}

// ============================================================================
// Component
// ============================================================================

export function PerformanceCreateForm() {
  const router = useRouter();
  const createMutation = useCreatePerformance();
  const [state, dispatch] = useCreateFormReducer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.name.trim() || !state.placeId) return;

    const result = await createMutation.mutateAsync({
      data: {
        performance: {
          name: state.name.trim(),
          placeId: state.placeId,
          startDate: state.startDate || "",
          endDate: state.endDate || "",
          posterUrl: state.posterUrl.trim(),
          banGoods: state.banGoods.trim(),
          transportationInfo: state.transportationInfo.trim(),
          remark: state.remark.trim(),
        },
        timeTables: buildTimeTables(state),
        reservationInfos: buildReservations(state),
        urlInfos: buildUrls(state),
      },
    });

    const newId = (result as { data?: number })?.data;
    if (typeof newId === "number") {
      router.push(`/performance/${newId}`);
    } else {
      router.push("/performance");
    }
  };

  const castingCount = state.castingRows.filter((r) => r.artistId !== null).length;

  return (
    <div className="flex h-full flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold">새 공연 추가</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          기본 정보와 캐스팅, 예매, 링크를 함께 입력하여 공연을 생성합니다.
        </p>
      </div>
      <Separator />
      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5">
          {/* ============================================================ */}
          {/* Basic Info (always visible) */}
          {/* ============================================================ */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">기본 정보</h2>

            <div className="space-y-2">
              <Label htmlFor="create-name">
                공연명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-name"
                value={state.name}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "name",
                    value: e.target.value,
                  })
                }
                placeholder="공연명을 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                장소 <span className="text-destructive">*</span>
              </Label>
              <PlaceCombobox
                value={state.placeId}
                onChange={(id) =>
                  dispatch({ type: "SET_FIELD", field: "placeId", value: id })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-start">시작일</Label>
                <Input
                  id="create-start"
                  type="date"
                  value={state.startDate}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "startDate",
                      value: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-end">종료일</Label>
                <Input
                  id="create-end"
                  type="date"
                  value={state.endDate}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "endDate",
                      value: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-poster">포스터 URL</Label>
              <Input
                id="create-poster"
                value={state.posterUrl}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "posterUrl",
                    value: e.target.value,
                  })
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-ban">반입금지 물품</Label>
              <AutoResizeTextarea
                id="create-ban"
                value={state.banGoods}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "banGoods",
                    value: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-transport">교통 정보</Label>
              <AutoResizeTextarea
                id="create-transport"
                value={state.transportationInfo}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "transportationInfo",
                    value: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-remark">비고</Label>
              <AutoResizeTextarea
                id="create-remark"
                value={state.remark}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "remark",
                    value: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* Reservation Section (inline, no accordion) */}
          {/* ============================================================ */}
          <Separator />
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">예매 정보</h2>
            <CreateReservationSection
              reservations={state.reservations}
              dispatch={dispatch}
            />
          </div>

          {/* ============================================================ */}
          {/* URL Section (inline, no accordion) */}
          {/* ============================================================ */}
          <Separator />
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">관련 링크</h2>
            <CreateUrlSection urls={state.urls} dispatch={dispatch} />
          </div>

          {/* ============================================================ */}
          {/* Casting Spreadsheet */}
          {/* ============================================================ */}
          <Separator />
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="casting">
              <AccordionTrigger className="text-sm font-semibold">
                <span className="flex items-center gap-2">
                  캐스팅 정보
                  {castingCount > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {castingCount}
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <CastingSpreadsheet
                  rows={state.castingRows}
                  dispatch={dispatch}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* ============================================================ */}
          {/* Submit */}
          {/* ============================================================ */}
          <Separator />

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={
                createMutation.isPending || !state.name.trim() || !state.placeId
              }
            >
              {createMutation.isPending ? "생성 중..." : "공연 생성"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/performance")}
            >
              취소
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
