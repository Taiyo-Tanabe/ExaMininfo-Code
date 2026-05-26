"""add org members

Revision ID: i1c2d3e4f5g6
Revises: h0b1c2d3e4f5
Create Date: 2026-05-26
"""
from alembic import op
import sqlalchemy as sa

revision = 'i1c2d3e4f5g6'
down_revision = 'h0b1c2d3e4f5'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'org_members',
        sa.Column('id',        sa.Integer(),              nullable=False),
        sa.Column('org_id',    sa.Integer(),              nullable=False),
        sa.Column('user_id',   sa.Integer(),              nullable=False),
        sa.Column('role',      sa.String(),               nullable=False, server_default='member'),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['org_id'],  ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'],         ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('org_id', 'user_id', name='uq_org_member'),
    )
    op.create_index('ix_org_members_id', 'org_members', ['id'])


def downgrade():
    op.drop_index('ix_org_members_id', table_name='org_members')
    op.drop_table('org_members')
