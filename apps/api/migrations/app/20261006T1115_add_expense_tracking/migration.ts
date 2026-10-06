#!/usr/bin/env -S node
import startContract from '../../snapshots/94a2e0a292af29cba394fe3f83495274f8841a782b336256c8e46a692fa97644/contract.json' with { type: 'json' };
import endContract from '../../snapshots/0f1e0fbc228b248cc6d4f4637a418e2a10313464833368cc185e792f24edfc46/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<any, any> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'expense',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('amount', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('category', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('date', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('applicationId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'expense_category_check_5ab8d097',
            "\"category\" IN ('TRAVEL', 'PRINTING', 'TRAINING', 'PROFESSIONAL_SERVICES')",
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'expense',
        index: 'expense_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'expense',
        index: 'expense_applicationId_idx_8158f91a',
        columns: ['applicationId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'expense',
        foreignKey: {
          name: 'expense_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'expense',
        foreignKey: {
          name: 'expense_applicationId_fkey',
          columns: ['applicationId'],
          references: { schema: 'public', table: 'application', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);