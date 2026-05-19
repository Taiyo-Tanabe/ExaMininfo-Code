"""
偏差値スクレイパー — momotaro.website（大学偏差値 ランキング・一覧 2026）

対象: 47都道府県 × 各ページに国公私立大学の学部別偏差値
出力: scripts/data_raw.csv

使い方:
  cd C:\\Users\\taiyo\\Downloads\\ExaMIninfo
  pip install httpx beautifulsoup4 lxml
  python scripts/scrape.py
"""

import asyncio
import csv
import re
from pathlib import Path

import httpx
from bs4 import BeautifulSoup, NavigableString, Tag

BASE_URL    = "https://momotaro.website"
SOURCE_NAME = "momotaro.website"
OUTPUT_CSV  = Path(__file__).parent / "data_raw.csv"
CONCURRENCY = 6
DELAY       = 0.4   # 1リクエストあたりの待機秒数

PREF_PAGES: list[tuple[str, str]] = [
    ("hokkaido.html", "北海道"),
    ("aomori.html",   "青森県"),
    ("iwate.html",    "岩手県"),
    ("miyagi.html",   "宮城県"),
    ("akita.html",    "秋田県"),
    ("yamagata.html", "山形県"),
    ("fukusima.html", "福島県"),
    ("ibaraki.html",  "茨城県"),
    ("tochigi.html",  "栃木県"),
    ("gunma.html",    "群馬県"),
    ("saitama.html",  "埼玉県"),
    ("chiba.html",    "千葉県"),
    ("tokyo.html",    "東京都"),
    ("kanagawa.html", "神奈川県"),
    ("niigata.html",  "新潟県"),
    ("toyama.html",   "富山県"),
    ("isikawa.html",  "石川県"),
    ("fukui.html",    "福井県"),
    ("yamanasi.html", "山梨県"),
    ("nagano.html",   "長野県"),
    ("gifu.html",     "岐阜県"),
    ("sizuoka.html",  "静岡県"),
    ("aichi.html",    "愛知県"),
    ("mie.html",      "三重県"),
    ("siga.html",     "滋賀県"),
    ("kyoto.html",    "京都府"),
    ("osaka.html",    "大阪府"),
    ("hyogo.html",    "兵庫県"),
    ("nara.html",     "奈良県"),
    ("wakayama.html", "和歌山県"),
    ("tottori.html",  "鳥取県"),
    ("simane.html",   "島根県"),
    ("okayama.html",  "岡山県"),
    ("hirosima.html", "広島県"),
    ("yamaguchi.html","山口県"),
    ("tokusima.html", "徳島県"),
    ("kagawa.html",   "香川県"),
    ("ehime.html",    "愛媛県"),
    ("kochi.html",    "高知県"),
    ("fukuoka.html",  "福岡県"),
    ("saga.html",     "佐賀県"),
    ("nagasaki.html", "長崎県"),
    ("kumamoto.html", "熊本県"),
    ("oita.html",     "大分県"),
    ("miyazaki.html", "宮崎県"),
    ("kagosima.html", "鹿児島県"),
    ("okinawa.html",  "沖縄県"),
]

# 偏差値（整数または小数）
_DEV_RE = re.compile(r'^\d+(?:\.\d+)?$')


def parse_page(html: str, prefecture: str) -> list[dict]:
    """
    HTML構造:
      <b><font color="...">大学名</font></b>[国立]<br>コース名<b>偏差値</b><br>
    大学名は <b><font>...</font></b> の形式。
    偏差値は <b>数字</b> の形式（font なし）。
    """
    soup = BeautifulSoup(html, "lxml")
    results: list[dict] = []
    current_school: str | None = None

    for b in soup.find_all("b"):
        text = b.get_text(strip=True)
        if not text:
            continue

        # ── 大学名: <b><font>大学名</font></b> ──
        font = b.find("font")
        if isinstance(font, Tag):
            current_school = font.get_text(strip=True)
            continue

        # ── 偏差値: <b>数字</b> ──
        if _DEV_RE.match(text) and current_school:
            deviation = float(text)

            # 直前の NavigableString がコース名
            prev = b.previous_sibling
            course_name = ""
            if prev and isinstance(prev, NavigableString):
                course_name = str(prev).strip()

            if course_name:
                results.append({
                    "school_name": current_school,
                    "prefecture":  prefecture,
                    "course_name": course_name,
                    "deviation":   deviation,
                })

    return results


async def fetch(
    client: httpx.AsyncClient,
    sem: asyncio.Semaphore,
    slug: str,
    prefecture: str,
) -> list[dict]:
    url = f"{BASE_URL}/{slug}"
    async with sem:
        try:
            r = await client.get(url, timeout=20)
            r.raise_for_status()
            rows = parse_page(r.text, prefecture)
            await asyncio.sleep(DELAY)
            return rows
        except Exception as e:
            print(f"  [SKIP] {url}: {e}")
            return []


async def main() -> None:
    sem = asyncio.Semaphore(CONCURRENCY)
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
    }

    all_rows: list[dict] = []

    print(f"対象: {len(PREF_PAGES)} 都道府県 / 同時: {CONCURRENCY} / 間隔: {DELAY}s")

    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        tasks = [
            fetch(client, sem, slug, pref)
            for slug, pref in PREF_PAGES
        ]
        done = 0
        for coro in asyncio.as_completed(tasks):
            rows = await coro
            all_rows.extend(rows)
            done += 1
            print(f"  {done:2d}/{len(PREF_PAGES)} 完了 — 累計: {len(all_rows):,} 件")

    if not all_rows:
        print("\nデータが取得できませんでした。")
        return

    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["school_name", "prefecture", "course_name", "deviation"],
        )
        writer.writeheader()
        writer.writerows(all_rows)

    print(f"\n完了: {len(all_rows):,} 件 → {OUTPUT_CSV}")


if __name__ == "__main__":
    asyncio.run(main())
