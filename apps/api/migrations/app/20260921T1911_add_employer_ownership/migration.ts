#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/af9811187cae4a39fe8abf59069af62db690977f1f24dd63ec7186141cda36e6/contract';
import startContract from '../../snapshots/af9811187cae4a39fe8abf59069af62db690977f1f24dd63ec7186141cda36e6/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/fd0abfe791a4ec77f8890bf5c537257ad304e5a9d8457d8a141844d15769b986/contract';
import endContract from '../../snapshots/fd0abfe791a4ec77f8890bf5c537257ad304e5a9d8457d8a141844d15769b986/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'employer',
        column: col('userId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'employer',
        index: 'employer_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'employer',
        foreignKey: {
          name: 'employer_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
