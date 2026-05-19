"""add course_name to incidents and posts

Revision ID: c3d4e5f6a7b8
Revises: a1b2c3d4e5f6
Create Date: 2026-05-17 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('incidents', sa.Column('course_name', sa.String(), nullable=True))
    op.add_column('posts',     sa.Column('course_name', sa.String(), nullable=True))


def downgrade():
    op.drop_column('incidents', 'course_name')
    op.drop_column('posts',     'course_name')
