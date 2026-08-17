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
} from "@festibee/ui";
import { AlertTriangle, RotateCw, Sparkles, Trash2 } from "lucide-react";
import type {
  ApplyPreviewRes,
  PreviewCollectionDiff,
  PreviewDeletingItem,
  PreviewFieldAction,
} from "@festibee/api";

const FIELD_LABELS: Record<string, string> = {
  name: "공연 이름",
  title: "공연 이름",
  poster_url: "포스터",
  start_date: "시작일",
  end_date: "종료일",
  venue_name: "장소",
  venue_address: "주소",
  transportation_info: "교통 정보",
  ban_goods: "주의/반입금지",
  remark: "특이/비고",
};

const ACTION_META: Record<
  PreviewFieldAction,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  // plan 모드
  UNCHANGED: { label: "변경 없음", variant: "outline" },
  FILLED: { label: "채움", variant: "default" },
  UPDATED: { label: "변경", variant: "default" },
  CLEARED: { label: "비움", variant: "destructive" },
  CREATED: { label: "신규", variant: "default" },
  // legacy 경로 (plan 없는 옛 초안)
  FILL: { label: "채움", variant: "default" },
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
  /** 폼 상태 그대로 반영 확정. */
  onConfirm: () => void;
  isPending: boolean;
  /** CR012(409) — baseline 이후 대상 공연이 수정됨. */
  staleConflict?: boolean;
  onReload?: () => void;
}

/** 백엔드 롤아웃 시차를 감안해 확장 필드가 없어도 안전하게 읽는다. */
function readDiff(diff: PreviewCollectionDiff | undefined) {
  return {
    toAdd: diff?.toAdd ?? 0,
    toUpdate: diff?.toUpdate ?? 0,
    toDelete: diff?.toDelete ?? 0,
    unchanged: diff?.unchanged ?? 0,
    existing: diff?.existing ?? 0,
    deleting: (diff?.deleting ?? []) as PreviewDeletingItem[],
  };
}

export function ApplyPreviewDialog({
  open,
  onOpenChange,
  preview,
  onConfirm,
  isPending,
  staleConflict = false,
  onReload,
}: ApplyPreviewDialogProps) {
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  // 다이얼로그를 다시 열면 삭제 확인은 초기화한다(실수로 확정되는 것 방지).
  useEffect(() => {
    if (open) setDeleteConfirmed(false);
  }, [open, preview]);

  if (staleConflict) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>다른 사람이 이 공연을 수정했습니다</DialogTitle>
            <DialogDescription>
              폼을 불러온 뒤 대상 공연이 변경되었습니다. 지금 반영하면 다른 사람의
              수정이 지워질 수 있어 중단했습니다. 다시 불러온 뒤 편집해 주세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              닫기
            </Button>
            <Button size="sm" className="gap-1" onClick={onReload}>
              <RotateCw className="h-3.5 w-3.5" />
              다시 불러오기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!preview) return null;

  const reservations = readDiff(preview.reservations);
  const timetables = readDiff(preview.timetables);
  const deletingItems = [
    ...reservations.deleting.map((d) => ({ ...d, kind: "예매" })),
    ...timetables.deleting.map((d) => ({ ...d, kind: "타임테이블" })),
  ];
  const deleteCount = reservations.toDelete + timetables.toDelete;
  const confirmDisabled =
    isPending || (deleteCount > 0 && !deleteConfirmed);

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
                이(가) 폼 내용 그대로 갱신됩니다. 폼에 없는 항목은 삭제됩니다.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* 스칼라 diff */}
        {preview.fields.length > 0 && (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">필드</th>
                  <th className="px-3 py-2 text-left font-medium">기존 값</th>
                  <th className="px-3 py-2 text-left font-medium">반영 후</th>
                  <th className="px-3 py-2 text-left font-medium">결과</th>
                </tr>
              </thead>
              <tbody>
                {preview.fields.map((f) => {
                  const meta = ACTION_META[f.action];
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
                        <Badge variant={meta?.variant ?? "outline"}>
                          {meta?.label ?? f.action}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 컬렉션 요약 */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <SummaryCard
            title="예매"
            lines={[
              `추가 ${reservations.toAdd} · 수정 ${reservations.toUpdate}`,
              `삭제 ${reservations.toDelete} · 그대로 ${reservations.unchanged}`,
            ]}
          />
          <SummaryCard
            title="타임테이블"
            lines={[
              `추가 ${timetables.toAdd} · 수정 ${timetables.toUpdate}`,
              `삭제 ${timetables.toDelete} · 그대로 ${timetables.unchanged}`,
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

        {/* 삭제 목록 — 전부 나열한다 */}
        {deletingItems.length > 0 && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/[0.06] p-3 text-xs">
            <p className="mb-1.5 flex items-center gap-1.5 font-medium text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
              삭제되는 항목 {deletingItems.length}건
            </p>
            <ul className="space-y-0.5">
              {deletingItems.map((d) => (
                <li key={`${d.kind}-${d.id}`} className="flex gap-1.5">
                  <span className="shrink-0 text-muted-foreground">{d.kind}</span>
                  <span className="min-w-0 flex-1 break-words">{d.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 신규 생성 경고 */}
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

        {/* 삭제 게이트 */}
        {deleteCount > 0 && (
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-destructive/40 p-2.5 text-xs">
            <Checkbox
              checked={deleteConfirmed}
              onCheckedChange={(v) => setDeleteConfirmed(Boolean(v))}
            />
            <span className="font-medium">삭제 {deleteCount}건을 확인했습니다</span>
          </label>
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
          <Button size="sm" onClick={onConfirm} disabled={confirmDisabled}>
            {isPending ? "반영 중..." : "반영 확정"}
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
        <p key={line} className="text-xs">
          {line}
        </p>
      ))}
    </div>
  );
}
