"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@festibee/ui";
import type { StatsPreset } from "../api/dashboard-api";

/** 상세 화면 공통 껍데기. 뒤로 가기 + 기간 필터만 갖는다. */

const PRESETS: { label: string; value: StatsPreset }[] = [
  { label: "7일", value: "LAST_7D" },
  { label: "30일", value: "LAST_30D" },
  { label: "전체", value: "ALL" },
];

interface Props {
  title: string;
  showPreset?: boolean;
  children: (preset: StatsPreset) => React.ReactNode;
}

export function DetailShell({ title, showPreset = true, children }: Props) {
  const [preset, setPreset] = useState<StatsPreset>("ALL");

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={2} />
          정확도
        </Link>

        <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {showPreset ? (
            <div className="flex rounded-md border p-0.5">
              {PRESETS.map((p) => (
                <Button
                  key={p.value}
                  variant={preset === p.value ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-3 text-xs transition-transform active:scale-[0.97]"
                  onClick={() => setPreset(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          ) : null}
        </header>

        <div className="mt-8 space-y-8">{children(preset)}</div>
      </div>
    </div>
  );
}
