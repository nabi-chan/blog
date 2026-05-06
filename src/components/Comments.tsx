"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import {
  commentAvatarName,
  randomCommentAvatar,
  type CommentAvatar,
} from "@/src/comments/avatar";
import { createCommentsClient } from "@/src/comments/supabase";
import type { Comment, CommentEntryKind } from "@/src/comments/types";

const maxNameLength = 24;
const maxMessageLength = 500;

export function Comments({
  entryKind,
  entrySlug,
}: {
  entryKind: CommentEntryKind;
  entrySlug: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [isNameEdited, setIsNameEdited] = useState(false);
  const [message, setMessage] = useState("");
  const [avatar, setAvatar] = useState<CommentAvatar | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const supabase = createCommentsClient();
  const isConfigured = supabase !== null;

  useEffect(() => {
    const nextAvatar = randomCommentAvatar();
    setAvatar(nextAvatar);
    setName(commentAvatarName(nextAvatar));
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const client = supabase;
    let ignore = false;

    async function loadComments() {
      setError("");
      setIsLoading(true);

      const { data, error: loadError } = await client
        .from("comments")
        .select(
          "id, entry_kind, entry_slug, name, message, avatar_emoji, avatar_bg, created_at",
        )
        .eq("entry_kind", entryKind)
        .eq("entry_slug", entrySlug)
        .order("created_at", { ascending: true });

      if (ignore) return;

      if (loadError) {
        setError("댓글을 불러오지 못했습니다.");
        setComments([]);
      } else {
        setComments((data || []) as Comment[]);
      }

      setIsLoading(false);
    }

    loadComments();

    return () => {
      ignore = true;
    };
  }, [entryKind, entrySlug, supabase]);

  function changeAvatar() {
    const nextAvatar = randomCommentAvatar();
    setAvatar(nextAvatar);
    if (!isNameEdited) {
      setName(commentAvatarName(nextAvatar));
    }
  }

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !avatar || isPending) return;

    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedMessage) {
      setError("이름과 메시지를 모두 입력해주세요.");
      return;
    }

    startTransition(async () => {
      setError("");

      const { data, error: insertError } = await supabase
        .from("comments")
        .insert({
          entry_kind: entryKind,
          entry_slug: entrySlug,
          name: trimmedName,
          message: trimmedMessage,
          avatar_emoji: avatar.emoji,
          avatar_bg: avatar.bg,
        })
        .select(
          "id, entry_kind, entry_slug, name, message, avatar_emoji, avatar_bg, created_at",
        )
        .single();

      if (insertError || !data) {
        setError("댓글을 남기지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      setComments((items) => [...items, data as Comment]);
      setMessage("");
      const nextAvatar = randomCommentAvatar();
      setAvatar(nextAvatar);
      setName(commentAvatarName(nextAvatar));
      setIsNameEdited(false);
    });
  }

  return (
    <section className="comments-section" aria-labelledby="comments-title">
      <div className="comments-header">
        <h2 id="comments-title" className="comments-title">
          댓글 {comments.length}
        </h2>
        <p className="comments-help">댓글 관련 문의: hello@nabi.kim</p>
      </div>

      {!isConfigured ? (
        <div className="comments-empty">
          Supabase 환경변수를 설정하면 댓글 기능을 사용할 수 있어요.
        </div>
      ) : (
        <>
          <form className="comments-form" onSubmit={submitComment}>
            <div className="comments-profile-row">
              <button
                className="comments-avatar comments-avatar-large comments-avatar-button focus-ring cursor-pointer select-none"
                type="button"
                onClick={changeAvatar}
                style={{ backgroundColor: avatar?.bg || "transparent" }}
                aria-label="댓글 아이콘 랜덤 변경"
              >
                {avatar?.emoji || "?"}
              </button>
              <label className="sr-only" htmlFor="comment-name">
                이름
              </label>
              <input
                id="comment-name"
                className="comments-name-input focus-ring"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setIsNameEdited(true);
                }}
                maxLength={maxNameLength}
                placeholder="이름"
              />
            </div>

            <label className="sr-only" htmlFor="comment-message">
              메시지
            </label>
            <textarea
              id="comment-message"
              className="comments-message-input focus-ring"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={maxMessageLength}
              placeholder="입력한 댓글은 수정하거나 삭제할 수 없어요. 또한 허위사실, 욕설, 사칭 등 댓글은 통보없이 삭제될 수 있어요."
            />

            {error ? <p className="comments-error">{error}</p> : null}

            <div className="comments-submit-row">
              <span className="comments-count">
                {message.length} / {maxMessageLength}
              </span>
              <button
                className="comments-submit-button focus-ring"
                type="submit"
                disabled={isPending || !avatar}
              >
                {isPending ? "남기는 중" : "댓글 남기기"}
              </button>
            </div>
          </form>

          <div className="comments-list" aria-live="polite">
            {isLoading ? (
              <div className="comments-empty">댓글을 불러오는 중입니다.</div>
            ) : comments.length === 0 ? (
              <div className="comments-empty">아직 남겨진 댓글이 없습니다.</div>
            ) : (
              comments.map((comment) => (
                <article className="comment-card" key={comment.id}>
                  <div className="comment-meta">
                    <span
                      className="comments-avatar"
                      style={{ backgroundColor: comment.avatar_bg }}
                      aria-hidden="true"
                    >
                      {comment.avatar_emoji}
                    </span>
                    <span className="comment-name">{comment.name}</span>
                  </div>
                  <p className="comment-message">{comment.message}</p>
                </article>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
