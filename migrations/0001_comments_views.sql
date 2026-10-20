-- 댓글 (스펙 4.7). 은솔 댓글은 비밀번호가 없고, 남의 댓글은 해시와 솔트가 반드시 있다
CREATE TABLE comments (
  id            TEXT PRIMARY KEY,
  post_slug     TEXT NOT NULL,
  author        TEXT NOT NULL,
  body          TEXT NOT NULL,
  is_owner      INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT,
  password_salt TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT,
  CHECK (is_owner = 1 OR (password_hash IS NOT NULL AND password_salt IS NOT NULL))
);

CREATE INDEX comments_post_created ON comments(post_slug, created_at);

-- 조회수 (스펙 4.8)
CREATE TABLE post_views (
  slug  TEXT PRIMARY KEY,
  count INTEGER NOT NULL
);

CREATE TABLE site_views (
  id    INTEGER PRIMARY KEY CHECK (id = 1),
  count INTEGER NOT NULL
);

-- 같은 방문자의 하루 중복 판정. Cron 이 지난 날짜를 지운다. 쓰기 행 수를 줄이려고 WITHOUT ROWID
CREATE TABLE view_dedupe (
  day     TEXT NOT NULL,
  slug    TEXT NOT NULL,
  visitor TEXT NOT NULL,
  PRIMARY KEY (day, slug, visitor)
) WITHOUT ROWID;

-- 비밀번호 실패 시도 제한. key 는 'visitor:<해시>' 또는 'comment:<id>', window_start 는 10분 창 번호
CREATE TABLE attempts (
  key          TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL
) WITHOUT ROWID;
