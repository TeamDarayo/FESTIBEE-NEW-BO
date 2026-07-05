"use client";

import { useEffect, useState } from "react";
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
} from "@festibee/ui";
import { AlertTriangle, Sparkles } from "lucide-react";
import type {
  ApplyPreviewRes,
  MergeFieldKey,
  PreviewFieldAction,
} from "@festibee/api";

const FIELD_LABELS: Record<string, string> = {
  title: "제목",
  poster_url: "포스터",
  venue_name: "장소",
  venue_address: "주소",
  start_date: "시작일",
  end_date: "종료일",
};

/** preview field → merge.overwrite 키. title 은 원본 존중이라 덮어쓰기 불가. venue_* 는 place 로 묶인다. */
const FIELD_TO_MERGE_KEY: Record<string, MergeFieldKey | undefined> = {
  poster_url: "poster_url",
  start_date: "start_date",
  end_date: "end_date",
  venue_name: "place",
  venue_address: "place",
};

const ACTION_META: Record<
  PreviewFieldAction,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  FILL: { label: "채워짐", variant: "default" },
  KEEP: { label: "유지", variant: "outline" },
  CONFLICT: { label: "충돌", variant: "destructive" },
  IGNORED: { label: "유지 (덮어쓰기 불가)", variant: "secondary" },
  EXPAND: { label: "기간 확장", variant: "default" },
  CREATE: { label: "신규", variant: "default" },
};

interface ApplyPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: ApplyPreviewRes | null;
  /** 병합 패널에서 선택해 둔 덮어쓰기 필드(다이얼로그 초기값). */
  initialOverwrite?: Set<MergeFieldKey>;
  /** 라벨러가 선택한 덮어쓰기 필드와 함께 반영 확정. */
  onConfirm: (overwrite: MergeFieldKey[]) => void;
  isPending: boolean;
}

export function ApplyPreviewDialog({
  open,
  onOpenChange,
  preview,
  initialOverwrite,
  onConfirm,
  isPending,
}: ApplyPreviewDialogProps) {
  const [overwrite, setOverwrite] = useState<Set<MergeFieldKey>>(
    () => new Set(initialOverwrite)
  );

  // 다이얼로그가 열릴 때 병합 패널의 선택으로 동기화한다.
  useEffect(() => {
    if (open) setOverwrite(new Set(initialOverwrite));
  }, [open, initialOverwrite]);

  if (!preview) return null;

  const conflicts = preview.fields.filter((f) => f.action === "CONFLICT");
  const visibleFields = preview.fields.filter((f) => f.action !== "KEEP");

  const toggleOverwrite = (field: MergeFieldKey) => {
    setOverwrite((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>반영 미리보기</DialogTitle>
          <DialogDescription>
            {preview.creatingNew ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5" />새 공연이 생성됩니다.
              </span>
            ) : (
              <>
                기존 공연{" "}
                <span className="font-medium text-foreground">
                  {preview.targetPerformance?.name} (#
                  {preview.targetPerformance?.id})
                </span>
                에 병합됩니다. 기본은 빈 값만 채우며, 충돌 필드는 아래에서
                덮어쓰기를 선택할 수 있습니다.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Field diffs */}
        {visibleFields.length > 0 && (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">필드</th>
                  <th className="px-3 py-2 text-left font-medium">현재 값</th>
                  <th className="px-3 py-2 text-left font-medium">크롤 값</th>
                  <th className="px-3 py-2 text-left font-medium">결과</th>
                  <th className="px-3 py-2 text-center font-medium">덮어쓰기</th>
                </tr>
              </thead>
              <tbody>
                {visibleFields.map((f) => {
                  const meta = ACTION_META[f.action];
                  const mergeKey = FIELD_TO_MERGE_KEY[f.field];
                  const overwritable = f.action === "CONFLICT" && mergeKey != null;
                  return (
                    <tr key={f.field} className="border-b last:border-b-0">
                      <td className="px-3 py-2 font-medium">
                        {FIELD_LABELS[f.field] ?? f.field}
                      </td>
                      <td className="max-w-40 truncate px-3 py-2 text-muted-foreground">
                        {f.current ?? "-"}
                      </td>
                      <td className="max-w-40 truncate px-3 py-2">
                        {f.incoming ?? "-"}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {overwritable && (
                          <Checkbox
                            checked={overwrite.has(mergeKey)}
                            onCheckedChange={() => toggleOverwrite(mergeKey)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Collection summary */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <SummaryCard
            title="예매"
            lines={[
              `추가 ${preview.reservations.toAdd}건`,
              preview.reservations.existing > 0
                ? `중복 제외 ${preview.reservations.existing}건`
                : null,
            ]}
          />
          <SummaryCard
            title="타임테이블"
            lines={[
              `추가 ${preview.timetables.toAdd}건`,
              preview.timetables.existing > 0
                ? `기존 유지 ${preview.timetables.existing}건`
                : null,
            ]}
          />
          <SummaryCard
            title="아티스트"
            lines={[
              `기존 연결 ${preview.artists.toLink.length}명`,
              `신규 생성 ${preview.artists.toCreate.length}명`,
            ]}
          />
        </div>

        {/* New entity warnings */}
        {(preview.artists.toCreate.length > 0 ||
          preview.stagesToCreate.length > 0) && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
            <p className="mb-1.5 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              새로 생성되는 항목 — 기존 항목과 중복이 아닌지 확인하세요
            </p>
            {preview.artists.toCreate.length > 0 && (
              <p className="text-muted-foreground">
                아티스트: {preview.artists.toCreate.join(", ")}
              </p>
            )}
            {preview.stagesToCreate.length > 0 && (
              <p className="text-muted-foreground">
                스테이지: {preview.stagesToCreate.join(", ")}
              </p>
            )}
          </div>
        )}

        {conflicts.length > 0 && overwrite.size === 0 && (
          <>
            <Separator />
            <p className="text-xs text-muted-foreground">
              충돌 필드는 덮어쓰기를 선택하지 않으면 기존 값이 유지됩니다.
            </p>
          </>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            취소
          </Button>
          <Button
            size="sm"
            onClick={() => onConfirm([...overwrite])}
            disabled={isPending}
          >
            {isPending ? "반영 중..." : "확정 반영"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({
  title,
  lines,
}: {
  title: string;
  lines: (string | null)[];
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      {lines.filter(Boolean).map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}
