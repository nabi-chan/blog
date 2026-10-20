-- 날짜(KST)별 사이트 PV. 오늘 조회수는 day = 오늘 인 행이다. 전체는 site_views 카운터를 그대로 쓴다
-- (조회마다 행을 쌓고 세면 D1 읽기 행 수가 계속 늘어나서 날짜별로 모아 둔다)
CREATE TABLE site_daily_views (
  day   TEXT PRIMARY KEY,
  count INTEGER NOT NULL
) WITHOUT ROWID;
