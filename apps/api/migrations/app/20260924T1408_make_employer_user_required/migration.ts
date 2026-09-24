#!/usr/bin/env -S node
import 'temporal-polyfill/global';
import type { Contract as End } from '../../snapshots/264a74de38e19630c81d4b0c903438e18fa6328a6918f96b22de574b0e8a0fd6/contract';
import endContract from '../../snapshots/264a74de38e19630c81d4b0c903438e18fa6328a6918f96b22de574b0e8a0fd6/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/fd0abfe791a4ec77f8890bf5c537257ad304e5a9d8457d8a141844d15769b986/contract';
import startContract from '../../snapshots/fd0abfe791a4ec77f8890bf5c537257ad304e5a9d8457d8a141844d15769b986/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';
import postgres from '@prisma/orm-postgres/runtime';

const { sql: db, contract } = postgres<End>({ contractJson: endContract });

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dataTransform(contract, 'handle-nulls-employer-userId', {
        check: () =>
          db.public.employer
            .select('id')
            .where((f, fns) => fns.eq(f.userId, null))
            .limit(1),

        run: () =>
          db.public.employer
            .update({ userId: 11 })
            .where((f, fns) => fns.eq(f.userId, null)),
      }),
      this.setNotNull({
        schema: 'public',
        table: 'employer',
        column: 'userId',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);