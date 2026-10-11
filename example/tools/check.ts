// Mechanical guardrails and doc checks for a Wayfinding codebase.
//
//   node tools/check.ts          check everything; exit 1 on any failure
//   node tools/check.ts --fix    regenerate the generated sections first
//
// Structural checks (paper, Section 10) and doc checks (Section 12) that need
// no judgment. Semantic checks, such as duplicate authority, are left to the
// independent QA agent.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const SRC = join(ROOT, 'src')
const FIX = process.argv.includes('--fix')

const failures: string[] = []
const fail = (msg: string) => failures.push(msg)
const rel = (p: string) => relative(ROOT, p).split(sep).join('/')

// ---------------------------------------------------------------- discovery

type Domain = { dir: string; name: string; parent: Domain | null; children: Domain[] }

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const domains: Domain[] = []
function discover(dir: string, parent: Domain | null) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (!statSync(p).isDirectory()) continue
    if (existsSync(join(p, 'DOMAIN.md'))) {
      const d: Domain = { dir: p, name: entry, parent, children: [] }
      domains.push(d)
      parent?.children.push(d)
      discover(p, d)
    } else if (parent === null) {
      fail(`${rel(p)}: folder in src/ has no DOMAIN.md`)
    }
  }
}
discover(SRC, null)

const topLevel = domains.filter((d) => d.parent === null)
const id = (d: Domain) => rel(d.dir).replace(/^src\//, '')

function ownerOf(file: string): Domain | undefined {
  return domains
    .filter((d) => file.startsWith(d.dir + sep))
    .sort((a, b) => b.dir.length - a.dir.length)[0]
}

const isAncestor = (a: Domain, b: Domain): boolean => {
  for (let p = b.parent; p; p = p.parent) if (p === a) return true
  return false
}

// Each domain's only public file. model.ts and routes.ts are private to it
// (routes are mounted by src/app.ts, which is not a domain).
const publicFile = (d: Domain) => join(d.dir, 'service.ts')

// Files outside the domains that domain code may import.
const SHARED = [join(SRC, 'db.ts')]

// ----------------------------------------------------------- import guardrails

const edges = new Map<Domain, Set<Domain>>()
const sourceFiles = walk(SRC).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
const testFiles = walk(SRC).filter((f) => f.endsWith('.test.ts'))

for (const file of [...sourceFiles, ...testFiles]) {
  const from = ownerOf(file)
  if (!from) continue
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
    const target = resolve(dirname(file), m[1])
    const to = ownerOf(target)
    if (!to) {
      if (!SHARED.includes(target) && !file.endsWith('.test.ts')) {
        fail(`${rel(file)} imports ${rel(target)}: domain code may import only db.ts from outside the domains`)
      }
      continue
    }
    if (to === from) continue
    const where = `${rel(file)} imports ${rel(target)}`

    if (isAncestor(to, from)) {
      fail(`${where}: a child domain may not depend on its parent (${id(to)})`)
      continue
    }
    if (target !== publicFile(to)) {
      fail(`${where}: reaches a private file of ${id(to)}; import its service.ts`)
    }
    if (to.parent && from !== to.parent && from.parent !== to.parent) {
      fail(`${where}: ${id(to)} is a child domain, visible only inside ${id(to.parent)}`)
    }
    // Tests may reach other domains to set up scenarios, but they are not consumers.
    if (!file.endsWith('.test.ts')) {
      if (!edges.has(from)) edges.set(from, new Set())
      edges.get(from)!.add(to)
    }
  }
}

// Dependency cycles between domains.
{
  const state = new Map<Domain, 'visiting' | 'done'>()
  const visit = (d: Domain, path: Domain[]) => {
    if (state.get(d) === 'done') return
    if (state.get(d) === 'visiting') {
      const cycle = [...path.slice(path.indexOf(d)), d].map(id).join(' → ')
      fail(`dependency cycle: ${cycle}`)
      return
    }
    state.set(d, 'visiting')
    for (const next of edges.get(d) ?? []) visit(next, [...path, d])
    state.set(d, 'done')
  }
  for (const d of domains) visit(d, [])
}

// ------------------------------------------------------------------- DOMAIN.md

function header(doc: string, field: string): string | undefined {
  return doc.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))?.[1].trim()
}

function section(doc: string, title: string): string {
  const m = doc.match(new RegExp(`^## ${title}\\s*$([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm'))
  return m?.[1] ?? ''
}

function listOf(value: string | undefined): string[] {
  if (!value || /^none\b/.test(value)) return []
  return value.split(',').map((s) => s.trim().split(/\s/)[0]).filter(Boolean)
}

const ruleOwners = new Map<string, string>()
const tableOwners = new Map<string, string>()

for (const d of domains) {
  const path = join(d.dir, 'DOMAIN.md')
  let doc = readFileSync(path, 'utf8')
  const here = rel(path)

  // Header matches the discovered structure.
  const parent = header(doc, 'Parent')
  const expectedParent = d.parent ? d.parent.name : 'none'
  if (!parent || !parent.startsWith(expectedParent)) {
    fail(`${here}: Parent is "${parent}", but the folder says ${expectedParent}`)
  }
  const declaredChildren = listOf(header(doc, 'Child domains')).sort().join(', ')
  const actualChildren = d.children.map((c) => c.name).sort().join(', ')
  if (declaredChildren !== actualChildren) {
    fail(`${here}: Child domains lists [${declaredChildren}], folders are [${actualChildren}]`)
  }
  for (const f of ['Owns', 'Does not own', 'Interface', 'Checkpoint']) {
    if (!header(doc, f)) fail(`${here}: missing "${f}:"`)
  }

  // One writer per table: entities in model.ts match "Owns data", carry the prefix, and are unique.
  const modelFile = join(d.dir, 'model.ts')
  const tables = existsSync(modelFile)
    ? [...readFileSync(modelFile, 'utf8').matchAll(/@Entity\(\s*['"](\w+)['"]/g)].map((m) => m[1])
    : []
  const declaredTables = listOf(header(doc, 'Owns data')).sort().join(', ')
  if (declaredTables !== [...tables].sort().join(', ')) {
    fail(`${here}: Owns data lists [${declaredTables}], model.ts defines [${tables.join(', ')}]`)
  }
  let top = d
  while (top.parent) top = top.parent
  const prefix = top.name.replace(/-/g, '_')
  for (const t of tables) {
    if (t !== prefix && !t.startsWith(prefix + '_')) fail(`${here}: table ${t} should start with ${prefix}_`)
    if (tableOwners.has(t)) fail(`${here}: table ${t} is also created by ${tableOwners.get(t)}`)
    tableOwners.set(t, id(d))
  }

  // Every rule is anchored to a test that exists; no rule appears in two domains.
  const rules = section(doc, 'Rules').split(/^- /m).slice(1)
  for (const rule of rules) {
    const first = rule.split('\n')[0].trim()
    const anchor = rule.match(/Enforced by:\s*(\S+)\s*›\s*"([^"]+)"/)
    if (!anchor) {
      fail(`${here}: rule has no "Enforced by" test: ${first}`)
    } else {
      const testFile = join(d.dir, anchor[1])
      const name = anchor[2]
      const body = existsSync(testFile) ? readFileSync(testFile, 'utf8') : ''
      const quoted = [`'${name}'`, `"${name}"`, `\`${name}\``]
      if (!quoted.some((q) => body.includes(`test(${q}`))) {
        fail(`${here}: rule anchored to a missing test: ${anchor[1]} › "${name}"`)
      }
    }
    const key = first.toLowerCase()
    if (ruleOwners.has(key)) fail(`${here}: rule also appears in ${ruleOwners.get(key)}: ${first}`)
    ruleOwners.set(key, here)
  }

  // Files named in Recipes still exist in the domain.
  const domainFiles = walk(d.dir).map((f) => basename(f))
  for (const m of section(doc, 'Recipes').matchAll(/\b([\w.-]+\.(?:ts|sql))\b/g)) {
    if (!domainFiles.includes(m[1])) fail(`${here}: Recipes mention ${m[1]}, which does not exist`)
  }

  // Generated Consumers section matches discovered consumers.
  const consumers = domains
    .filter((other) => edges.get(other)?.has(d))
    .map((other) => (other.parent && other.parent !== d.parent ? id(other) : other.name))
    .sort()
  const generated = `<!-- generated: do not edit -->\n${consumers.length ? `- ${consumers.join(', ')}\n` : '- none\n'}<!-- end generated -->`
  const block = /<!-- generated: do not edit -->[\s\S]*?<!-- end generated -->/
  if (!block.test(doc)) {
    fail(`${here}: missing generated Consumers block`)
  } else if (doc.match(block)![0] !== generated) {
    if (FIX) {
      doc = doc.replace(block, generated)
      writeFileSync(path, doc)
      console.log(`regenerated ${here}`)
    } else {
      fail(`${here}: Consumers section is stale; run with --fix`)
    }
  }
}

// ---------------------------------------------------------------------- MAP.md

{
  const mapPath = join(ROOT, 'MAP.md')
  const map = existsSync(mapPath) ? readFileSync(mapPath, 'utf8') : ''
  const rows = [...map.matchAll(/^\|\s*([\w-]+)\s*\|\s*([^|]*)\|/gm)]
    .map((m) => ({ name: m[1], owns: m[2].trim() }))
    .filter((r) => r.name !== 'Domain' && /[a-z]/i.test(r.name))
  const listed = new Set(rows.map((r) => r.name))
  for (const d of topLevel) {
    if (!listed.has(d.name)) fail(`MAP.md: top-level domain ${d.name} is not on the map`)
    const isJunction = /^Kind:\s*junction/m.test(readFileSync(join(d.dir, 'DOMAIN.md'), 'utf8'))
    const row = rows.find((r) => r.name === d.name)
    if (row && isJunction !== row.owns.startsWith('junction:')) {
      fail(`MAP.md: ${d.name} is ${isJunction ? '' : 'not '}a junction, but the map says otherwise`)
    }
  }
  for (const r of rows) {
    if (!topLevel.some((d) => d.name === r.name)) fail(`MAP.md: ${r.name} is on the map but has no folder in src/`)
  }
}

// --------------------------------------------------------------------- report

if (failures.length) {
  console.error(`✗ ${failures.length} problem(s):\n`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log(`✓ ${domains.length} domains checked: structure, data ownership, rules, recipes, consumers, map`)
