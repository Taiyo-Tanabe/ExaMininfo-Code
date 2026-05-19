"""add yomi and prefecture_yomi to schools

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-05-17 18:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('schools', sa.Column('yomi', sa.String(), nullable=True))
    op.add_column('schools', sa.Column('prefecture_yomi', sa.String(), nullable=True))
    op.create_index('ix_schools_yomi', 'schools', ['yomi'])
    op.create_index('ix_schools_prefecture_yomi', 'schools', ['prefecture_yomi'])


def downgrade():
    op.drop_index('ix_schools_prefecture_yomi', table_name='schools')
    op.drop_index('ix_schools_yomi', table_name='schools')
    op.drop_column('schools', 'prefecture_yomi')
    op.drop_column('schools', 'yomi')
