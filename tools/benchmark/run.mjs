#!/usr/bin/env node
// Throughput benchmark scaffold. The real executor wiring lands with
// B-API-RUN-EXECUTE (#7) — until then this stub emits zeroes so the
// workflow has a stable contract (results/benchmark.json shape).
//
// When #7 lands, replace the stub body with: boot the NestJS app via
// AppModule, POST the demo workflow, fire BENCHMARK_RUNS triggers,
// measure end-to-end latency to terminal status, write the result.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const runs = Number(process.env.BENCHMARK_RUNS ?? '50');
const out = `${here}/../../results/benchmark.json`;
mkdirSync(dirname(out), { recursive: true });

const result = {
  runs,
  p50_ms: 0,
  p99_ms: 0,
  throughput_rps: 0,
  note: 'stub — executor wiring lands with #7 B-API-RUN-EXECUTE',
};

writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
console.log(`benchmark stub wrote ${out}`);
