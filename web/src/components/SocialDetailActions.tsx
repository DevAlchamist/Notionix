"use client";

import { SocialLikeButton } from "@/components/SocialLikeButton";
import { SocialSaveButton } from "@/components/SocialSaveButton";

type SocialDetailActionsProps = {
  summaryId: string;
  initialLiked: boolean;
  likeCount: number;
  initialSaved: boolean;
};

export function SocialDetailActions({
  summaryId,
  initialLiked,
  likeCount,
  initialSaved,
}: SocialDetailActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SocialLikeButton
        summaryId={summaryId}
        initialLiked={initialLiked}
        initialCount={likeCount}
      />
      <SocialSaveButton summaryId={summaryId} initialSaved={initialSaved} label />
    </div>
  );
}
