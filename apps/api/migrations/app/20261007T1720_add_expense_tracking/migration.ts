#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/1055a8f1b0ca9f3d0c6f9e0c3d619e53782470121325c14fe0d2960ef9e23cd3/contract';
import startContract from '../../snapshots/1055a8f1b0ca9f3d0c6f9e0c3d619e53782470121325c14fe0d2960ef9e23cd3/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/15a71de9a81fa98a8dfe4749daafee8e37c50ace0337810385eef0a657ed19a0/contract';
import endContract from '../../snapshots/15a71de9a81fa98a8dfe4749daafee8e37c50ace0337810385eef0a657ed19a0/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'expense',
        columns: [
          col('amount', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('applicationId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('category', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('date', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
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
        index: 'expense_applicationId_idx_8158f91a',
        columns: ['applicationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'expense',
        index: 'expense_userId_idx_a489d58a',
        columns: ['userId'],
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
