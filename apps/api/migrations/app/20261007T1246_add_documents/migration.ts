#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1055a8f1b0ca9f3d0c6f9e0c3d619e53782470121325c14fe0d2960ef9e23cd3/contract';
import endContract from '../../snapshots/1055a8f1b0ca9f3d0c6f9e0c3d619e53782470121325c14fe0d2960ef9e23cd3/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/acf4db96d337dfb47e6792770d1a3708460c20adec059b1260746c2a28cf231d/contract';
import startContract from '../../snapshots/acf4db96d337dfb47e6792770d1a3708460c20adec059b1260746c2a28cf231d/contract.json' with { type: 'json' };
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
        table: 'document',
        columns: [
          col('blobUrl', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('contentType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('fileName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('pathname', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sizeBytes', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('document_type_check_ef5c2f84', "\"type\" IN ('RESUME', 'COVER_LETTER')"),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'document',
        index: 'document_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'document',
        foreignKey: {
          name: 'document_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
