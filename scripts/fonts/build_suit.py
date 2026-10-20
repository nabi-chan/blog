"""SUIT Variable 을 글자 범위(unicode-range)별 woff2 조각으로 나눈다.

사용법: uvx --from 'fonttools[woff]' python scripts/fonts/build_suit.py <SUIT-Variable.woff2> <SUIT LICENSE 파일>

- 범위는 scripts/fonts/ranges.txt (구글 폰트 Noto Sans KR 분할 경계) 를 그대로 쓴다.
- SUIT 는 OFL Reserved Font Name 이 선언돼 있어 수정본(서브셋)에는 그 이름을 쓸 수 없다.
  그래서 폰트 내부 이름을 'Eunsol Sans' 로 바꾸고, OFL 전문과 원저작자 표기를 함께 둔다.
- 결과: public/fonts/suit/eunsol-sans.<N>.woff2, public/fonts/suit/OFL.txt, src/app/styles/fonts.css
"""

import io
import pathlib
import sys

from fontTools.subset import Options, Subsetter, parse_unicodes
from fontTools.ttLib import TTFont

FAMILY = "Eunsol Sans"
PS_FAMILY = "EunsolSans"
OUT_DIR = pathlib.Path("public/fonts/suit")
CSS_PATH = pathlib.Path("src/app/styles/fonts.css")
RANGES_PATH = pathlib.Path("scripts/fonts/ranges.txt")
# 저작권·상표·라이선스 문구는 원문 그대로 남긴다
KEEP_NAME_IDS = {0, 7, 13, 14}


def rename(font: TTFont) -> None:
    for record in font["name"].names:
        if record.nameID in KEEP_NAME_IDS:
            continue
        text = record.toUnicode()
        if "SUIT" not in text:
            continue
        ps = record.nameID in (6, 25) or "-" in text and " " not in text
        record.string = text.replace("SUIT", PS_FAMILY if ps else FAMILY)


def subset(source: bytes, unicodes: list[int]) -> bytes | None:
    font = TTFont(io.BytesIO(source))
    options = Options()
    options.layout_features = ["*"]
    options.flavor = "woff2"
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.notdef_outline = True
    subsetter = Subsetter(options=options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)
    # .notdef 만 남았으면 이 범위에 글리프가 없는 것이다
    if len(font.getGlyphOrder()) <= 1:
        return None
    rename(font)
    out = io.BytesIO()
    font.flavor = "woff2"
    font.save(out)
    return out.getvalue()


def main() -> None:
    source_path, license_path = map(pathlib.Path, sys.argv[1:3])
    source = source_path.read_bytes()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("eunsol-sans.*.woff2"):
        old.unlink()

    faces = []
    for index, line in enumerate(RANGES_PATH.read_text().splitlines()):
        unicode_range = line.strip()
        if not unicode_range:
            continue
        data = subset(source, parse_unicodes(unicode_range.replace("U+", "")))
        if data is None:
            continue
        name = f"eunsol-sans.{index}.woff2"
        (OUT_DIR / name).write_bytes(data)
        faces.append(
            "@font-face {\n"
            f"  font-family: '{FAMILY}';\n"
            f"  src: url(/fonts/suit/{name}) format('woff2');\n"
            "  font-weight: 100 900;\n"
            "  font-style: normal;\n"
            "  font-display: swap;\n"
            f"  unicode-range: {unicode_range};\n"
            "}\n"
        )

    header = "/* scripts/fonts/build_suit.py 가 만든 파일이다. 직접 고치지 않는다 */\n"
    CSS_PATH.write_text(header + "\n".join(faces))
    license_text = license_path.read_text()
    (OUT_DIR / "OFL.txt").write_text(
        "Modified (subset, renamed to 'Eunsol Sans') from SUIT by SUNN (https://github.com/sun-typeface/SUIT)\n\n"
        + license_text
    )
    print(f"{len(faces)} 조각을 만들었습니다")


if __name__ == "__main__":
    main()
