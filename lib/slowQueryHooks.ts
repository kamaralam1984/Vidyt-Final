// Auto-capture slow Mongo operations (queries + aggregates) and write them to
// the SlowQuery collection so they show up on /admin/super/activity-logs.
//
// Wires per-schema pre/post hooks on every registered Mongoose model. The
// hook is idempotent (Symbol-tagged) so repeat calls — Next.js dev hot-reload,
// connectDB() retries — won't double-attach.
//
// Recursion is prevented by skipping the SlowQuery + ErrorLog collections,
// since logSlowQuery() does an insert into SlowQuery itself.

import mongoose from 'mongoose';

const DB_THRESHOLD_MS = 1000;
const SKIP_COLLECTIONS = new Set(['slowqueries', 'errorlogs']);
const HOOK_KEY = Symbol.for('vidyt.slowQueryHooked');

const QUERY_OPS = [
  'find',
  'findOne',
  'findOneAndUpdate',
  'findOneAndDelete',
  'findOneAndReplace',
  'updateMany',
  'updateOne',
  'deleteMany',
  'deleteOne',
  'count',
  'countDocuments',
  'distinct',
];

function safeQueryShape(conditions: any) {
  // Trim heavy or sensitive payloads before persisting.
  if (!conditions || typeof conditions !== 'object') return undefined;
  try {
    const json = JSON.stringify(conditions);
    if (json.length > 1500) return { __truncated: true, preview: json.slice(0, 1500) };
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

async function recordSlow(entry: {
  kind: 'db';
  label: string;
  durationMs: number;
  collection: string;
  query?: any;
}) {
  try {
    const mod = await import('@/models/SlowQuery');
    await mod.logSlowQuery({
      ...entry,
      thresholdMs: DB_THRESHOLD_MS,
    });
  } catch {
    /* swallow — logging must never break the app */
  }
}

export function attachSlowQueryHooksToAllModels() {
  for (const name of mongoose.modelNames()) {
    const model = (mongoose.models as any)[name];
    if (!model) continue;
    const schema: any = model.schema;
    if (!schema || schema[HOOK_KEY]) continue;
    schema[HOOK_KEY] = true;

    for (const op of QUERY_OPS) {
      schema.pre(op, function (this: any) {
        this.__slowq_start = Date.now();
      });
      schema.post(op, function (this: any) {
        const start = this.__slowq_start;
        if (!start) return;
        const duration = Date.now() - start;
        if (duration < DB_THRESHOLD_MS) return;
        const collection = String(
          this?.mongooseCollection?.name || this?.model?.collection?.name || ''
        ).toLowerCase();
        if (SKIP_COLLECTIONS.has(collection)) return;
        recordSlow({
          kind: 'db',
          label: `${collection}.${op}`,
          durationMs: duration,
          collection,
          query: safeQueryShape(this?._conditions),
        });
      });
    }

    // Aggregate has its own lifecycle.
    schema.pre('aggregate', function (this: any) {
      this.__slowq_start = Date.now();
    });
    schema.post('aggregate', function (this: any) {
      const start = this.__slowq_start;
      if (!start) return;
      const duration = Date.now() - start;
      if (duration < DB_THRESHOLD_MS) return;
      const collection = String(this?._model?.collection?.name || '').toLowerCase();
      if (SKIP_COLLECTIONS.has(collection)) return;
      recordSlow({
        kind: 'db',
        label: `${collection}.aggregate`,
        durationMs: duration,
        collection,
        query: safeQueryShape({ pipeline: this?._pipeline }),
      });
    });
  }
}
