"""add org personal_info_prompt

Revision ID: m5g6h7i8j9k0
Revises: l4f5g6h7i8j9
Create Date: 2026-05-26 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'm5g6h7i8j9k0'
down_revision = 'l4f5g6h7i8j9'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('organizations', sa.Column('personal_info_prompt', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('organizations', 'personal_info_prompt')
