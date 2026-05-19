"""add bio to users, reply_to_id to posts, follows table

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-05-17 14:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))
    op.add_column('posts', sa.Column('reply_to_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_posts_reply_to', 'posts', 'posts', ['reply_to_id'], ['id'], ondelete='SET NULL')

    from sqlalchemy.engine import reflection
    bind = op.get_bind()
    inspector = reflection.Inspector.from_engine(bind)
    if 'follows' not in inspector.get_table_names():
        op.create_table(
            'follows',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('follower_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('following_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
            sa.UniqueConstraint('follower_id', 'following_id', name='uq_follow'),
        )


def downgrade():
    op.drop_table('follows')
    op.drop_constraint('fk_posts_reply_to', 'posts', type_='foreignkey')
    op.drop_column('posts', 'reply_to_id')
    op.drop_column('users', 'bio')
