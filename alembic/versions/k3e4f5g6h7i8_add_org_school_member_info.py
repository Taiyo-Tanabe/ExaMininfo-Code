"""add org school/dept, member personal_info, event start_at nullable

Revision ID: k3e4f5g6h7i8
Revises: j2d3e4f5g6h7
Create Date: 2026-05-26
"""
from alembic import op
import sqlalchemy as sa

revision = 'k3e4f5g6h7i8'
down_revision = 'j2d3e4f5g6h7'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('organizations',
        sa.Column('school_id', sa.Integer(), nullable=True))
    op.add_column('organizations',
        sa.Column('department', sa.String(), nullable=True))
    op.create_foreign_key(
        'fk_org_school', 'organizations', 'schools',
        ['school_id'], ['id'], ondelete='SET NULL')

    op.add_column('org_members',
        sa.Column('personal_info', sa.Text(), nullable=True))

    op.alter_column('events', 'start_at', nullable=True)


def downgrade():
    op.alter_column('events', 'start_at', nullable=False)
    op.drop_column('org_members', 'personal_info')
    op.drop_constraint('fk_org_school', 'organizations', type_='foreignkey')
    op.drop_column('organizations', 'department')
    op.drop_column('organizations', 'school_id')
