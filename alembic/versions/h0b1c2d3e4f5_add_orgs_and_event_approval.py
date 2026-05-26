"""add organizations and event approval flags

Revision ID: h0b1c2d3e4f5
Revises: g9a1b2c3d4e5
Create Date: 2026-05-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'h0b1c2d3e4f5'
down_revision: Union[str, None] = 'g9a1b2c3d4e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # organizations table
    op.create_table(
        'organizations',
        sa.Column('id',          sa.Integer(),               nullable=False),
        sa.Column('name',        sa.String(),                nullable=False),
        sa.Column('description', sa.Text(),                  nullable=True),
        sa.Column('created_by',  sa.Integer(),               nullable=True),
        sa.Column('created_at',  sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name', name='uq_org_name'),
    )
    op.create_index('ix_organizations_id',   'organizations', ['id'],   unique=False)
    op.create_index('ix_organizations_name', 'organizations', ['name'], unique=True)

    # events: add org_id and approval flags
    op.add_column('events', sa.Column('org_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_events_org_id', 'events', 'organizations', ['org_id'], ['id'], ondelete='CASCADE'
    )
    op.add_column('events', sa.Column(
        'requires_view_approval', sa.Boolean(), nullable=False, server_default='false'
    ))
    op.add_column('events', sa.Column(
        'requires_join_approval', sa.Boolean(), nullable=False, server_default='false'
    ))

    # event_view_requests table
    op.create_table(
        'event_view_requests',
        sa.Column('id',         sa.Integer(),               nullable=False),
        sa.Column('event_id',   sa.Integer(),               nullable=False),
        sa.Column('user_id',    sa.Integer(),               nullable=False),
        sa.Column('status',     sa.String(),                nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'],  ['users.id'],  ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('event_id', 'user_id', name='uq_view_request'),
    )
    op.create_index('ix_event_view_requests_id', 'event_view_requests', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('event_view_requests')
    op.drop_constraint('fk_events_org_id', 'events', type_='foreignkey')
    op.drop_column('events', 'requires_join_approval')
    op.drop_column('events', 'requires_view_approval')
    op.drop_column('events', 'org_id')
    op.drop_table('organizations')
