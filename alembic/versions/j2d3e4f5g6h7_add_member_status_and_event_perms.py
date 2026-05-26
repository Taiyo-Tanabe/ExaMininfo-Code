"""add member status and event member permissions

Revision ID: j2d3e4f5g6h7
Revises: i1c2d3e4f5g6
Create Date: 2026-05-26
"""
from alembic import op
import sqlalchemy as sa

revision = 'j2d3e4f5g6h7'
down_revision = 'i1c2d3e4f5g6'
branch_labels = None
depends_on = None


def upgrade():
    # 既存メンバーは承認済み扱い（server_default='approved'）
    op.add_column('org_members',
        sa.Column('status', sa.String(), nullable=False, server_default='approved'))

    op.add_column('events',
        sa.Column('allow_member_view', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('events',
        sa.Column('allow_member_join', sa.Boolean(), nullable=False, server_default='true'))


def downgrade():
    op.drop_column('events', 'allow_member_join')
    op.drop_column('events', 'allow_member_view')
    op.drop_column('org_members', 'status')
