"""add attendance note

Revision ID: l4f5g6h7i8j9
Revises: k3e4f5g6h7i8
Create Date: 2026-05-26
"""
from alembic import op
import sqlalchemy as sa

revision = 'l4f5g6h7i8j9'
down_revision = 'k3e4f5g6h7i8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('event_attendances',
        sa.Column('note', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('event_attendances', 'note')
