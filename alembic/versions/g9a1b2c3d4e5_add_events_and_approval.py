"""add events and user approval

Revision ID: g9a1b2c3d4e5
Revises: f8850e3bdf8a
Create Date: 2026-05-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'g9a1b2c3d4e5'
down_revision: Union[str, None] = 'a1b2c3d4e5f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users.is_approved
    # 既存ユーザーは一旦 NULL で追加 → 全員 true に更新 → NOT NULL + DEFAULT false に変更
    op.add_column('users', sa.Column('is_approved', sa.Boolean(), nullable=True))
    op.execute("UPDATE users SET is_approved = true")
    op.alter_column('users', 'is_approved', nullable=False, server_default=sa.text('false'))

    # events table
    op.create_table(
        'events',
        sa.Column('id',               sa.Integer(),                       nullable=False),
        sa.Column('title',            sa.String(),                        nullable=False),
        sa.Column('description',      sa.Text(),                          nullable=True),
        sa.Column('location',         sa.String(),                        nullable=True),
        sa.Column('start_at',         sa.DateTime(timezone=True),         nullable=False),
        sa.Column('end_at',           sa.DateTime(timezone=True),         nullable=True),
        sa.Column('max_participants', sa.Integer(),                       nullable=True),
        sa.Column('created_by',       sa.Integer(),                       nullable=True),
        sa.Column('created_at',       sa.DateTime(timezone=True),         server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_events_id',    'events', ['id'],    unique=False)
    op.create_index('ix_events_title', 'events', ['title'], unique=False)

    # event_attendances table
    op.create_table(
        'event_attendances',
        sa.Column('id',         sa.Integer(),               nullable=False),
        sa.Column('event_id',   sa.Integer(),               nullable=False),
        sa.Column('user_id',    sa.Integer(),               nullable=False),
        sa.Column('status',     sa.String(),                nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'],  ['users.id'],  ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('event_id', 'user_id', name='uq_event_attendance'),
    )
    op.create_index('ix_event_attendances_id', 'event_attendances', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('event_attendances')
    op.drop_table('events')
    op.drop_column('users', 'is_approved')
