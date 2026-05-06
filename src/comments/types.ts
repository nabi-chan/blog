import type { EntryKind } from "@/src/content/types";

export type CommentEntryKind = EntryKind;

export type Comment = {
  id: string;
  entry_kind: CommentEntryKind;
  entry_slug: string;
  name: string;
  message: string;
  avatar_emoji: string;
  avatar_bg: string;
  created_at: string;
};

export type CommentDraft = {
  entry_kind: CommentEntryKind;
  entry_slug: string;
  name: string;
  message: string;
  avatar_emoji: string;
  avatar_bg: string;
};
