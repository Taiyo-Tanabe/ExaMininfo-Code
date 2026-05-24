"""add reviews, reports, blocked_emails and missing columns

Revision ID: c3d4e5f6a7b8
Revises: a1b2c3d4e5f6
Create Date: 2026-05-24 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id         SERIAL PRIMARY KEY,
            user_id    INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
            school_id  INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
            rating     INTEGER NOT NULL,
            comment    TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT uq_user_school_review UNIQUE (user_id, school_id)
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS blocked_emails (
            id         SERIAL PRIMARY KEY,
            email      VARCHAR UNIQUE NOT NULL,
            blocked_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id          SERIAL PRIMARY KEY,
            reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            target_type VARCHAR NOT NULL,
            target_id   INTEGER NOT NULL,
            reason      TEXT,
            created_at  TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    op.execute("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS occurred_year  INTEGER")
    op.execute("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS occurred_month INTEGER")
    op.execute("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS occurred_day   INTEGER")
    op.execute("""
        UPDATE incidents
        SET occurred_year  = EXTRACT(YEAR  FROM occurred_date)::INTEGER,
            occurred_month = EXTRACT(MONTH FROM occurred_date)::INTEGER,
            occurred_day   = EXTRACT(DAY   FROM occurred_date)::INTEGER
        WHERE occurred_date IS NOT NULL AND occurred_year IS NULL
    """)
    op.execute("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL")
    op.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS incident_id INTEGER REFERENCES incidents(id) ON DELETE SET NULL")
    op.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS review_id   INTEGER REFERENCES reviews(id)   ON DELETE SET NULL")
    op.execute("ALTER TABLE courses ALTER COLUMN deviation TYPE FLOAT USING deviation::FLOAT")
    op.execute("ALTER TABLE courses ADD COLUMN IF NOT EXISTS source VARCHAR")
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_course_school_name_source'
            ) THEN
                ALTER TABLE courses
                ADD CONSTRAINT uq_course_school_name_source
                UNIQUE (school_id, name, source);
            END IF;
        END $$
    """)
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_position_x INTEGER NOT NULL DEFAULT 50")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_position_y INTEGER NOT NULL DEFAULT 50")


def downgrade() -> None:
    pass
