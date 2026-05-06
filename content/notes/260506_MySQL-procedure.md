---
title: "MySQL Procedure (프로시저)"
description: "가끔 제가 헷갈려서요 ^^;;"
date: "2026-05-06 21:45:00"
---

## 프로시저?

> 자주 실행하는 SQL 쿼리 문장들을 함수처렁 실행 가능하게 해주는 SQL 기능

## SQL 정리

### 프로시저 삭제하기

IF EXISTS 구문을 통해 프로시저가 없어도 오류가 나지 않게 한다.

```sql
DROP PROCEDURE IF EXISTS 프로시저명;
```

### 프로시저 생성하기

```sql
-- 기존 SQL DELIMITER 와의 충돌을 방지하기 위해서...
DELIMITER $$
-- 프로시저 및 인자 정의
CREATE PROCEDURE TEST_PROCEDURE (IN 입력받을인자 VARCHAR(100)) BEGIN
-- SQL 오류 발생시 ROLLBACK 처리
DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN
  ROLLBACK;
END;

-- TRANSACTION 실행
START TRANSACTION;
  -- 여기에 비즈니스 로직 입력...
COMMIT;

-- 프로시저 종료
END $$
-- DELIMITER 복원
DELIMITER ;
```

### 프로시저 실행하기

CALL 을 통해 실행한다.

```sql
CALL TEST_PROCEDURE('나비 테스트');
```
