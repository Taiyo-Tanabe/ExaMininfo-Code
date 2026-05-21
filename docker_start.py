"""
Docker起動スクリプト。
- 新規DB: create_all でテーブルを全作成 → alembic stamp head
- 既存DB: alembic upgrade head で差分マイグレーションのみ実行
"""
import subprocess
from sqlalchemy import text
from blog.database import engine
from blog import models

with engine.connect() as conn:
    # alembic_version テーブルが存在するか確認
    row = conn.execute(
        text("SELECT to_regclass('public.alembic_version')")
    ).scalar()
    alembic_initialized = row is not None

if not alembic_initialized:
    print("=== 新規DB: テーブルを作成します ===")
    models.Base.metadata.create_all(bind=engine)
    print("=== alembic を head にスタンプします ===")
    subprocess.run(["alembic", "stamp", "head"], check=True)
else:
    print("=== 既存DB: alembic upgrade head を実行します ===")
    subprocess.run(["alembic", "upgrade", "head"], check=True)

print("=== uvicorn を起動します ===")
subprocess.run(
    ["uvicorn", "blog.main:app", "--host", "0.0.0.0", "--port", "8000"],
    check=True,
)
