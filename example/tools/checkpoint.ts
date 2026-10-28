import { spawnSync } from 'node:child_process'

const domain = process.argv[2]
if (!domain) {
  console.error('usage: npm run checkpoint -- <domain>')
  process.exit(2)
}
const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', '--test', `src/${domain}/**/*.test.ts`],
  { stdio: 'inherit' },
)
process.exit(result.status ?? 1)
