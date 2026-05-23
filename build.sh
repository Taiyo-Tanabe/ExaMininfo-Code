#!/bin/bash
# Render のビルドコマンドとして使用
set -e

echo "=== Python dependencies ==="
pip install -r requirements.txt

echo "=== DB migration ==="
alembic upgrade head

echo "=== Build complete ==="
