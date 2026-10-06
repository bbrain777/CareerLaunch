#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/94a2e0a292af29cba394fe3f83495274f8841a782b336256c8e46a692fa97644/contract';
import startContract from '../../snapshots/94a2e0a292af29cba394fe3f83495274f8841a782b336256c8e46a692fa97644/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/acf4db96d337dfb47e6792770d1a3708460c20adec059b1260746c2a28cf231d/contract';
import endContract from '../../snapshots/acf4db96d337dfb47e6792770d1a3708460c20adec059b1260746c2a28cf231d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('currentRole', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('targetRole', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('weeklyGoal', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
