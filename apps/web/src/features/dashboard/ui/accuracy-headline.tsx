"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@festibee/ui";
import type { CrawlAccuracyStatsRes } from "../api/dashboard-api";
import { BigMetric, formatCount, formatPct } from "./metric-format";

interface Props {
  data: CrawlAccuracyStatsRes;
}

/**
 * 정확도 헤드라인.
 *
 * 여기 있는 세 숫자는 서로를 견제하도록 **같이** 놓여 있다.
 * - normalized recall: 표기 흔들림(대소문자·공백·행정구역 축약)을 접고 잰 값
 * - strict recall: 원문 그대로 잰 값
 * - 둘의 격차 = 정규화가 지표를 띄운 폭. 감추면 규칙을 느슨하게 잡아 숫자만 올리는 게 안 보인다
 * - 무수정 통과율(strict): 사람이 한 글자도 안 고친 레코드 비율 = 진짜 자동화율
 */
export function AccuracyHeadline({ data }: Props) {
  const normalized = data.normalized.macro;
  const strict = data.strict.macro;

  const gap =
    normalized.recall != null && strict.recall != null
      ? normalized.recall - strict.recall
      : null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            정확도 (macro · 축제 하나가 한 표)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <BigMetric
              label="정규화 기준 recall"
              value={normalized.recall}
              hint="표기 흔들림(공백·대소문자·행정구역 축약)을 접고 잰 값"
              emphasis
            />
            <BigMetric
              label="원문 기준 recall (strict)"
              value={strict.recall}
              hint="크롤 값을 한 글자도 안 바꾸고 정답과 대조한 값"
              emphasis
            />
          </div>

          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            {gap != null ? (
              <>
                <span className="font-medium text-foreground">
                  정규화가 띄운 폭 {formatPct(gap)}
                </span>{" "}
                — 이 격차가 크면 크롤러가 좋아진 게 아니라 비교 규칙이 느슨한
                것이다. 두 값은 항상 같이 본다.
              </>
            ) : (
              <>정규화/원문 recall 을 만들 표본이 아직 없다.</>
            )}
          </div>

          <div className="grid gap-4 border-t pt-3 sm:grid-cols-3">
            <SmallMetric
              label="precision"
              value={normalized.precision}
              hint="크롤러가 낸 값 중 맞은 비율"
            />
            <SmallMetric
              label="오검출률"
              value={normalized.falseDiscoveryRate}
              hint="1 − precision. 없는 값을 만들어낸 비율"
            />
            <SmallMetric
              label="F1"
              value={normalized.f1}
              hint="recall·precision 종합"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            micro(전체 판정 합산) 병기: recall {formatPct(data.normalized.micro.recall)} ·
            precision {formatPct(data.normalized.micro.precision)} (판정{" "}
            {formatCount(data.normalized.micro.units)}건). micro 는 아티스트가 많은
            축제 하나가 지표를 지배하는지 확인하는 용도이지 헤드라인이 아니다.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">자동화율</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BigMetric
            label="무수정 통과율 (strict)"
            value={data.noEdit.recordRateStrict}
            hint="모든 필드를 사람이 한 글자도 안 고친 레코드 비율 = 진짜 자동화율"
            emphasis
          />
          <div className="grid gap-3 border-t pt-3">
            <SmallMetric
              label="무수정 통과율 (정규화)"
              value={data.noEdit.recordRateNormalized}
              hint="표기 흔들림을 접고 센 값"
            />
            <SmallMetric
              label="무수정 통과율 (값 있는 필드만)"
              value={data.noEdit.recordRateStrictValued}
              hint="양쪽 다 빈칸인 NA 를 뺀 버전"
            />
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                평균 수정 강도
              </div>
              <div className="text-sm font-semibold">
                {data.noEdit.avgEditDistance == null
                  ? "표본 없음"
                  : data.noEdit.avgEditDistance.toFixed(3)}
              </div>
              <p className="text-xs text-muted-foreground">
                0 = 무수정, 1 = 완전 교체
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SmallMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | null;
  hint: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div
        className={
          value == null ? "text-sm font-semibold text-muted-foreground" : "text-lg font-semibold"
        }
      >
        {value == null ? "표본 없음" : formatPct(value)}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
