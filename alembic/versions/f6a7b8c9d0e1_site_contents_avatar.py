"""add site_contents table and avatar_url to users

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-05-17 20:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'f6a7b8c9d0e1'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on = None


def upgrade():
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    if 'site_contents' not in inspector.get_table_names():
        op.create_table(
            'site_contents',
            sa.Column('key',   sa.String(), primary_key=True),
            sa.Column('value', sa.Text(),   nullable=True),
        )
    existing_cols = [c['name'] for c in inspector.get_columns('users')]
    if 'avatar_url' not in existing_cols:
        op.add_column('users', sa.Column('avatar_url', sa.String(), nullable=True))


def downgrade():
    op.drop_column('users', 'avatar_url')
    op.drop_table('site_contents')
