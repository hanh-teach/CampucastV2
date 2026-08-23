import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

console.log('🏃 Starting test runner (Vitest Mode)...');
console.log('📝 Note: Dead-tree domain, application, and unwired v4 architecture tests');
console.log('   have been moved to `_archive/unwired-v4-architecture/` to prevent maintenance overhead.');
console.log('   Core active tests (including `synthesis.test.ts` and `rssService.test.ts`) are preserved.');

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vitestCli = path.join(projectRoot, 'node_modules', 'vitest', 'vitest.mjs');
const result = spawnSync(process.execPath, [vitestCli, 'run'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
  },
});

if (result.status !== 0) {
  console.error('\n❌ Some test suites failed.');
  process.exit(1);
} else {
  console.log('\n🌟 ALL TEST SUITES EXECUTED SUCCESSFULLY!');
}
