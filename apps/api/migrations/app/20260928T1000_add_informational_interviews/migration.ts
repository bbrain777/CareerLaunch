#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/264a74de38e19630c81d4b0c903438e18fa6328a6918f96b22de574b0e8a0fd6/contract';
import startContract from '../../snapshots/264a74de38e19630c81d4b0c903438e18fa6328a6918f96b22de574b0e8a0fd6/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/94a2e0a292af29cba394fe3f83495274f8841a782b336256c8e46a692fa97644/contract';
import endContract from '../../snapshots/94a2e0a292af29cba394fe3f83495274f8841a782b336256c8e46a692fa97644/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'informationalInterview',
        columns: [
          col('company', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('contactId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('contactName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('keyTakeaway', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('nextFollowUp', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('preparationQuestions', 'text[]', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('recommendedAction', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('referral', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('scheduledFor', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('PREPARING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('thankYouSent', 'bool', { notNull: true, codecRef: { codecId: 'pg/bool@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'informationalInterview_preparationQuestions_elem_not_n_4cc07314',
            'array_position("preparationQuestions", NULL) IS NULL',
          ),
          checkExpression(
            'informationalInterview_status_check_959e1b90',
            "\"status\" IN ('PREPARING', 'SCHEDULED', 'COMPLETED')",
          ),
        ],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'user',
        constraint: 'user_role_check_482f18a5',
        expression: "\"role\" IN ('STUDENT', 'ADMIN')",
      }),
      this.createIndex({
        schema: 'public',
        table: 'informationalInterview',
        index: 'informationalInterview_contactId_idx_ec98db2a',
        columns: ['contactId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'informationalInterview',
        index: 'informationalInterview_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'informationalInterview',
        foreignKey: {
          name: 'informationalInterview_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'informationalInterview',
        foreignKey: {
          name: 'informationalInterview_contactId_fkey',
          columns: ['contactId'],
          references: { schema: 'public', table: 'contact', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
