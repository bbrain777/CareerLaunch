#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/15a71de9a81fa98a8dfe4749daafee8e37c50ace0337810385eef0a657ed19a0/contract';
import startContract from '../../snapshots/15a71de9a81fa98a8dfe4749daafee8e37c50ace0337810385eef0a657ed19a0/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/5b376e16e2c6e69e16ab61e5a1c7469cf7c05e87a7bc3d1b72a50a2da6f06524/contract';
import endContract from '../../snapshots/5b376e16e2c6e69e16ab61e5a1c7469cf7c05e87a7bc3d1b72a50a2da6f06524/contract.json' with { type: 'json' };
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
        table: 'careerDocument',
        columns: [
          col('applicationId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('documentType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('fileName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('fileSizeBytes', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('mimeType', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('storageReference', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('version', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'careerDocument_documentType_check_e63fd2dc',
            "\"documentType\" IN ('RESUME', 'COVER_LETTER')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'jobInterviewPreparation',
        columns: [
          col('applicationId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('company', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('companyResearch', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('practiceQuestions', 'text[]', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('resources', 'text[]', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('responsibilities', 'text[]', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('scheduledFor', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('skills', 'text[]', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/text@1', many: true },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'jobInterviewPreparation_practiceQuestions_elem_not_nul_e541db27',
            'array_position("practiceQuestions", NULL) IS NULL',
          ),
          checkExpression(
            'jobInterviewPreparation_resources_elem_not_null_207a41cb',
            'array_position("resources", NULL) IS NULL',
          ),
          checkExpression(
            'jobInterviewPreparation_responsibilities_elem_not_null_1639ba51',
            'array_position("responsibilities", NULL) IS NULL',
          ),
          checkExpression(
            'jobInterviewPreparation_skills_elem_not_null_79c19a4f',
            'array_position("skills", NULL) IS NULL',
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'careerDocument',
        index: 'careerDocument_applicationId_idx_8158f91a',
        columns: ['applicationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'careerDocument',
        index: 'careerDocument_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'jobInterviewPreparation',
        index: 'jobInterviewPreparation_applicationId_idx_8158f91a',
        columns: ['applicationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'jobInterviewPreparation',
        index: 'jobInterviewPreparation_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'careerDocument',
        foreignKey: {
          name: 'careerDocument_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'careerDocument',
        foreignKey: {
          name: 'careerDocument_applicationId_fkey',
          columns: ['applicationId'],
          references: { schema: 'public', table: 'application', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'jobInterviewPreparation',
        foreignKey: {
          name: 'jobInterviewPreparation_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'jobInterviewPreparation',
        foreignKey: {
          name: 'jobInterviewPreparation_applicationId_fkey',
          columns: ['applicationId'],
          references: { schema: 'public', table: 'application', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
