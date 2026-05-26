"""add org icon

Revision ID: n6h7i8j9k0l1
Revises: m5g6h7i8j9k0
Create Date: 2026-05-26
"""
from alembic import op
import sqlalchemy as sa

revision = 'n6h7i8j9k0l1'
down_revision = 'm5g6h7i8j9k0'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('organizations', sa.Column('icon_url', sa.Text(), nullable=True))
    op.add_column('organizations', sa.Column('icon_position_x', sa.Integer(), server_default='50', nullable=True))
    op.add_column('organizations', sa.Column('icon_position_y', sa.Integer(), server_default='50', nullable=True))


def downgrade():
    op.drop_column('organizations', 'icon_position_y')
    op.drop_column('organizations', 'icon_position_x')
    op.drop_column('organizations', 'icon_url')
