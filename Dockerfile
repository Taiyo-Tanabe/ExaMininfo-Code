# ── Stage 1: フロントエンドビルド ──────────────────────────────
# Node.js イメージで React をビルドし dist/ を生成する
FROM node:20-slim AS frontend-build

WORKDIR /frontend

# package.json だけ先にコピーして npm ci を実行
# (ソースより先にキャッシュが効くようにするため)
COPY frontend/package*.json ./
RUN npm ci

# ソース全体をコピーしてビルド
COPY frontend/ ./
ARG VITE_API_BASE=
RUN echo "VITE_API_BASE=${VITE_API_BASE}" > .env.production.local
RUN npm run build


# ── Stage 2: バックエンド（本番イメージ） ────────────────────────
# Python だけの軽量イメージ。node は含まれない
FROM python:3.11-slim

WORKDIR /app

# Python 依存ライブラリをインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# FastAPI アプリ本体
COPY backend/ backend/

# Alembic マイグレーション
COPY alembic/ alembic/
COPY alembic.ini .

# Stage 1 でビルドした React の dist/ をコピー
# main.py が frontend/dist/ を探して静的配信するため、このパスに置く
COPY --from=frontend-build /frontend/dist frontend/dist/

# 起動スクリプト（新規DB / 既存DB を自動判別してマイグレーション実行）
COPY docker_start.py .

# アバター等の静的ファイル置き場（空でも作成）
RUN mkdir -p static

EXPOSE 8000

CMD ["python", "docker_start.py"]
