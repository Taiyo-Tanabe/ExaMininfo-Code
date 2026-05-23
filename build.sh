#!/bin/bash
# Render のビルドコマンドとして使用
set -e

echo "=== Python dependencies ==="
pip install -r requirements.txt

echo "=== Build complete ==="
