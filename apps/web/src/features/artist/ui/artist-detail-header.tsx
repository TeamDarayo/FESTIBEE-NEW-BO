"use client";

import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
} from "@festibee/ui";
import { Pencil, GitMerge, Trash2 } from "lucide-react";
import type { ArtistDetailRes } from "../api/artist-api";
import { useDeleteArtist } from "../hooks/use-artist-mutations";
import { ROUTES } from "@/shared/config/constants";

interface ArtistDetailHeaderProps {
  artist: ArtistDetailRes;
  onEdit: () => void;
  onMerge: () => void;
}

export function ArtistDetailHeader({
  artist,
  onEdit,
  onMerge,
}: ArtistDetailHeaderProps) {
  const router = useRouter();
  const deleteMutation = useDeleteArtist();

  const handleDelete = async () => {
    if (!artist.id) return;
    await deleteMutation.mutateAsync({ artistId: artist.id });
    router.push(ROUTES.ARTIST);
  };

  return (
    <div className="flex items-center gap-4 p-6">
      <Avatar className="h-16 w-16">
        <AvatarImage
          src={artist.imageUrl ?? undefined}
          alt={artist.name ?? ""}
        />
        <AvatarFallback className="text-lg">
          {artist.name?.slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h1 className="text-xl font-bold">{artist.name}</h1>
        <p className="text-sm text-muted-foreground">
          별칭 {artist.aliases?.length ?? 0}개
        </p>
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="mr-1 h-4 w-4" />
          수정
        </Button>
        <Button size="sm" variant="outline" onClick={onMerge}>
          <GitMerge className="mr-1 h-4 w-4" />
          병합
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={deleteMutation.isPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>아티스트 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                <strong>{artist.name}</strong>을(를) 삭제하시겠습니까? 이 작업은
                되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "삭제 중..." : "삭제"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
