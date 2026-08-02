"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, cn } from "@festibee/ui";
import {
  ImageOff,
  Plus,
  Search,
  X,
} from "lucide-react";
import { getAdminPassword } from "@festibee/api/lib";
import type { ManualArtistMapping } from "@festibee/api";
import {
  useAddArtistAlias,
  useArtistList,
  useCreateArtist,
  useUpdateArtist,
  useAppleMusicArtistSearch,
  resolveAppleMusicArtworkUrl,
  type AppleMusicArtist,
} from "@/features/artist";

interface ArtistDetailPanelProps {
  crawledName: string;
  value: ManualArtistMapping;
  onChangeMapping: (next: ManualArtistMapping) => void;
}

function extractCreatedArtistId(response: { data?: unknown }): number | null {
  const body = response?.data;
  if (typeof body === "number") return body;
  if (body && typeof body === "object") {
    const result = (body as Record<string, unknown>).result;
    if (typeof result === "number") return result;
  }
  return null;
}

/**
 * 어노테이션 아티스트 행 펼침 패널.
 * 별명 등록 + Apple Music 프로필 이미지 선택.
 * - linked: alias/update API 즉시 반영
 * - new: 세부정보 확정 시 createArtist 후 existingArtistId 로 전환
 */
export function ArtistDetailPanel({
  crawledName,
  value,
  onChangeMapping,
}: ArtistDetailPanelProps) {
  const { data: artists } = useArtistList();
  const linked = artists?.find((a) => a.id === value.existingArtistId);

  const [aliasInput, setAliasInput] = useState("");
  const [aliasError, setAliasError] = useState<string | null>(null);
  /** 신규 아티스트용 로컬 별명 (생성 전). */
  const [pendingAliases, setPendingAliases] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState(crawledName);
  const [searchSubmitted, setSearchSubmitted] = useState(crawledName.trim());
  const [imageError, setImageError] = useState<string | null>(null);

  const addAlias = useAddArtistAlias();
  const createArtist = useCreateArtist();
  const updateArtist = useUpdateArtist();

  useEffect(() => {
    setSearchTerm(crawledName);
    setSearchSubmitted(crawledName.trim());
  }, [crawledName]);

  const {
    data: appleResults = [],
    isFetching: appleLoading,
    isError: appleFailed,
    error: appleError,
  } = useAppleMusicArtistSearch(searchSubmitted, {
    enabled: searchSubmitted.length > 0,
  });

  const busy =
    addAlias.isPending || createArtist.isPending || updateArtist.isPending;

  const currentImageUrl = linked?.imageUrl ?? null;

  const handleSearch = () => {
    setSearchSubmitted(searchTerm.trim());
    setImageError(null);
  };

  const ensureCreated = async (opts: {
    imageUrl?: string | null;
    extraAliases?: string[];
  }): Promise<number | null> => {
    if (linked?.id) return linked.id;

    const name =
      crawledName.trim() ||
      value.newArtist?.displayName?.trim() ||
      "";
    if (!name) {
      setImageError("아티스트 이름이 필요합니다.");
      return null;
    }

    const aliasList = Array.from(
      new Set(
        [...pendingAliases, ...(opts.extraAliases ?? [])]
          .map((a) => a.trim())
          .filter(Boolean)
          .filter((a) => a.toLowerCase() !== name.toLowerCase())
      )
    );

    try {
      const result = await createArtist.mutateAsync({
        data: {
          password: getAdminPassword(),
          name,
          imageUrl: opts.imageUrl?.trim() || undefined,
          aliasList: aliasList.length > 0 ? aliasList : undefined,
        },
      });
      const newId = extractCreatedArtistId(result);
      if (newId == null) {
        setImageError("아티스트 생성 응답에서 ID를 확인하지 못했습니다.");
        return null;
      }
      onChangeMapping({ existingArtistId: newId, newArtist: null });
      setPendingAliases([]);
      return newId;
    } catch (e) {
      setImageError(e instanceof Error ? e.message : "아티스트 생성 실패");
      return null;
    }
  };

  const handleAddAlias = async () => {
    const name = aliasInput.trim();
    if (!name) return;
    const lower = name.toLowerCase();

    if (linked?.id) {
      const duplicate =
        linked.name?.trim().toLowerCase() === lower ||
        linked.aliases?.some((a) => a.name?.trim().toLowerCase() === lower);
      if (duplicate) {
        setAliasError("이미 이름/별명에 있습니다.");
        return;
      }
      try {
        await addAlias.mutateAsync({
          artistId: linked.id,
          data: { alias: name },
        });
        setAliasInput("");
        setAliasError(null);
      } catch (e) {
        setAliasError(e instanceof Error ? e.message : "별명 등록 실패");
      }
      return;
    }

    if (pendingAliases.some((a) => a.toLowerCase() === lower)) {
      setAliasError("이미 추가된 별명입니다.");
      return;
    }
    if (crawledName.trim().toLowerCase() === lower) {
      setAliasError("표시명과 동일한 별명은 필요 없습니다.");
      return;
    }
    setPendingAliases((prev) => [...prev, name]);
    setAliasInput("");
    setAliasError(null);
  };

  const handleCreateWithAliases = async () => {
    const typed = aliasInput.trim();
    const extras: string[] = [];
    if (typed) {
      const lower = typed.toLowerCase();
      if (
        !pendingAliases.some((a) => a.toLowerCase() === lower) &&
        crawledName.trim().toLowerCase() !== lower
      ) {
        extras.push(typed);
      }
      setAliasInput("");
    }
    if (pendingAliases.length === 0 && extras.length === 0) return;
    await ensureCreated({ extraAliases: extras });
  };

  const handleSelectArtwork = async (artist: AppleMusicArtist) => {
    setImageError(null);
    const url = resolveAppleMusicArtworkUrl(artist.artworkUrl);
    if (!url) {
      setImageError("이 결과에 이미지가 없습니다.");
      return;
    }

    if (linked?.id) {
      try {
        await updateArtist.mutateAsync({
          artistId: linked.id,
          data: {
            name: linked.name,
            description: linked.description ?? undefined,
            imageUrl: url,
          },
        });
      } catch (e) {
        setImageError(e instanceof Error ? e.message : "이미지 업데이트 실패");
      }
      return;
    }

    await ensureCreated({ imageUrl: url });
  };

  const handleClearImage = async () => {
    if (!linked?.id) return;
    setImageError(null);
    try {
      await updateArtist.mutateAsync({
        artistId: linked.id,
        data: {
          name: linked.name,
          description: linked.description ?? undefined,
          imageUrl: "",
        },
      });
    } catch (e) {
      setImageError(e instanceof Error ? e.message : "이미지 제거 실패");
    }
  };

  const displayAliases = useMemo(() => {
    if (linked?.aliases?.length) {
      return linked.aliases.map((a) => ({
        key: String(a.id ?? a.name),
        name: a.name ?? "",
      }));
    }
    return pendingAliases.map((name) => ({ key: name, name }));
  }, [linked, pendingAliases]);

  return (
    <div className="space-y-3 rounded-md border border-border/60 bg-muted/20 p-2.5">
      {/* 별명 */}
      <section className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            별명
          </label>
          {!linked && pendingAliases.length > 0 && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400">
              생성 시 함께 등록
            </span>
          )}
        </div>

        {displayAliases.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {displayAliases.map((al) => (
              <span
                key={al.key}
                className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px]"
              >
                {al.name}
                {!linked && (
                  <button
                    type="button"
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    onClick={() =>
                      setPendingAliases((prev) =>
                        prev.filter((p) => p !== al.name)
                      )
                    }
                    aria-label={`${al.name} 제거`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground/70">
            등록된 별명 없음
          </p>
        )}

        <div className="flex items-center gap-1">
          <Input
            value={aliasInput}
            onChange={(e) => {
              setAliasInput(e.target.value);
              setAliasError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleAddAlias();
              }
            }}
            className="h-7 flex-1 text-xs"
            placeholder={
              linked
                ? "새 별명 즉시 등록"
                : "별명 추가 (생성 시 반영)"
            }
            disabled={busy}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs active:scale-[0.98]"
            disabled={!aliasInput.trim() || busy}
            onClick={() => void handleAddAlias()}
          >
            <Plus className="h-3 w-3" />
            {addAlias.isPending ? "등록 중" : "등록"}
          </Button>
        </div>
        {!linked && pendingAliases.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            className="h-7 w-full text-xs active:scale-[0.98]"
            disabled={busy}
            onClick={() => void handleCreateWithAliases()}
          >
            {createArtist.isPending
              ? "생성 중..."
              : "별명 포함해 아티스트 생성"}
          </Button>
        )}
        {aliasError && (
          <p className="text-[10px] text-destructive">{aliasError}</p>
        )}
      </section>

      <div className="border-t border-border/50" />

      {/* Apple Music 프로필 */}
      <section className="space-y-1.5">
        <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Apple Music 프로필
        </label>

        {currentImageUrl ? (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImageUrl}
              alt=""
              className="h-10 w-10 rounded object-cover ring-1 ring-border"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[10px] text-muted-foreground">
                {currentImageUrl}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-1.5 text-[10px] text-muted-foreground hover:text-destructive"
                disabled={busy}
                onClick={() => void handleClearImage()}
              >
                <ImageOff className="h-3 w-3" />
                이미지 제거
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground/70">
            {linked
              ? "등록된 프로필 이미지 없음"
              : "이미지 선택 시 아티스트가 생성됩니다"}
          </p>
        )}

        <div className="flex items-center gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              className="h-7 pl-7 text-xs"
              placeholder="Apple Music 검색어"
              disabled={busy}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs active:scale-[0.98]"
            disabled={!searchTerm.trim() || busy || appleLoading}
            onClick={handleSearch}
          >
            {appleLoading ? "검색 중" : "찾기"}
          </Button>
        </div>

        {appleLoading && (
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded bg-muted"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        )}

        {!appleLoading && appleFailed && (
          <p className="text-[10px] text-destructive">
            {appleError instanceof Error
              ? appleError.message
              : "Apple Music 검색 실패"}
          </p>
        )}

        {!appleLoading &&
          !appleFailed &&
          searchSubmitted.length > 0 &&
          appleResults.length === 0 && (
            <p className="text-[10px] text-muted-foreground/70">
              검색 결과가 없습니다
            </p>
          )}

        {!appleLoading && appleResults.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
            {appleResults.map((item, idx) => {
              const thumb = resolveAppleMusicArtworkUrl(item.artworkUrl, 200);
              const full = resolveAppleMusicArtworkUrl(item.artworkUrl, 500);
              const selected =
                !!currentImageUrl &&
                !!full &&
                (currentImageUrl === full ||
                  (!!thumb && currentImageUrl === thumb));
              return (
                <button
                  key={`${item.name}-${idx}`}
                  type="button"
                  disabled={busy || !thumb}
                  onClick={() => void handleSelectArtwork(item)}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded ring-1 ring-border/60 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    "hover:ring-emerald-500/50 hover:shadow-[0_8px_20px_-12px_rgba(16,185,129,0.45)]",
                    "active:scale-[0.96]",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    selected && "ring-2 ring-emerald-500"
                  )}
                  style={{
                    transitionDelay: `${Math.min(idx, 8) * 40}ms`,
                  }}
                  title={item.name}
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <ImageOff className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="absolute inset-x-0 bottom-0 truncate bg-zinc-950/70 px-1 py-0.5 text-[9px] text-zinc-100">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {imageError && (
          <p className="text-[10px] text-destructive">{imageError}</p>
        )}
      </section>
    </div>
  );
}
