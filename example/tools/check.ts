// Mechanical guardrails and doc checks for a Wayfinding codebase.
//
//   node tools/check.ts          check everything; exit 1 on any failure
//   node tools/check.ts --fix    regenerate the generated sections first
//
// Structural checks (paper, Section 10) and doc checks (Section 12) that need
// no judgment, including the one copy of every helper (Section 3). Semantic
// checks, such as a rule re-implemented under another name, are left to the
// independent QA agent.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import ts from 'typescript'

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
    } else if (walk(p).some((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))) {
      // A folder of code is a domain: a top-level one, or a child of the domain around it.
      fail(`${rel(p)}: folder of code has no DOMAIN.md (every folder of code is a domain)`)
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

// ------------------------------------------------------------- exports and files

const FILES_BLOCK = /<!-- generated: files, do not edit -->[\s\S]*?<!-- end generated -->/
const CONSUMERS_BLOCK = /<!-- generated: do not edit -->[\s\S]*?<!-- end generated -->/

const parseFile = (file: string) => ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
const isExported = (n: ts.Node) => ts.canHaveModifiers(n) && !!ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)

// Text on one line, comments dropped, cut at 160 characters.
function oneLine(text: string): string {
  const flat = text
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/([{(\[]) /g, '$1')
    .replace(/ ([})\]])/g, '$1')
    .replace(/;([})\]])/g, '$1')
    .replace(/;$/, '')
    .replace(/`/g, "'")
    .trim()
  return flat.length > 160 ? `${flat.slice(0, 160)}…` : flat
}

// Every export of a file with its signature: `name(params): return`, a type's shape,
// a class's fields. An agent calling another domain reads this instead of the code.
function exportsOf(file: string): { name: string; signature: string }[] {
  const sf = parseFile(file)
  const callable = (name: string, fn: ts.SignatureDeclaration) =>
    `${name}(${fn.parameters.map((p) => p.getText(sf)).join(', ')})${fn.type ? `: ${fn.type.getText(sf)}` : ''}`
  const out: { name: string; signature: string }[] = []
  for (const node of sf.statements.filter(isExported)) {
    if (ts.isFunctionDeclaration(node) && node.name) {
      out.push({ name: node.name.text, signature: callable(node.name.text, node) })
    } else if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      // An object type's members, `;`-separated whether or not the source writes semicolons.
      const shape = (members: ts.NodeArray<ts.TypeElement>) => `{ ${members.map((m) => oneLine(m.getText(sf))).join('; ')} }`
      const signature = ts.isInterfaceDeclaration(node)
        ? `interface ${node.name.text} ${shape(node.members)}`
        : ts.isTypeLiteralNode(node.type)
          ? `type ${node.name.text} = ${shape(node.type.members)}`
          : `type ${sf.text.slice(node.name.getStart(sf), node.end)}`
      out.push({ name: node.name.text, signature })
    } else if (ts.isClassDeclaration(node) && node.name) {
      const fields = node.members.filter(ts.isPropertyDeclaration).map((m) => m.name.getText(sf))
      out.push({ name: node.name.text, signature: `class ${node.name.text}${fields.length ? ` { ${fields.join(', ')} }` : ''}` })
    } else if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        const init = decl.initializer
        const name = decl.name.getText(sf)
        const fn = init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) ? init : undefined
        out.push({ name, signature: fn ? callable(name, fn) : name })
      }
    }
  }
  return out.map((e) => ({ name: e.name, signature: oneLine(e.signature) }))
}

// The generated Files section: the domain's own files (a child's belong to the child),
// the public file first with a signature per export, then the others' export names.
function filesBlock(d: Domain): string {
  const own = walk(d.dir).filter((f) => ownerOf(f) === d && basename(f) !== 'DOMAIN.md')
  const tests = own.filter((f) => f.endsWith('.test.ts')).map((f) => `\`${basename(f)}\``)
  const lines = own
    .filter((f) => !f.endsWith('.test.ts'))
    .sort((a, b) => Number(b === publicFile(d)) - Number(a === publicFile(d)) || a.localeCompare(b))
    .map((f) => {
      const exports = exportsOf(f)
      if (f === publicFile(d)) return `- \`${basename(f)}\` (interface):\n${exports.map((e) => `  - \`${e.signature}\``).join('\n')}`
      return `- \`${basename(f)}\`${exports.length ? `: ${exports.map((e) => e.name).join(', ')}` : ''}`
    })
  if (tests.length) lines.push(`- tests: ${tests.join(', ')}`)
  return lines.length ? `<!-- generated: files, do not edit -->\n${lines.join('\n')}\n<!-- end generated -->` : ''
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
  // Empty means absent: a top-level domain has no Parent line, a leaf no Child domains line.
  const parent = header(doc, 'Parent')
  if (d.parent ? !parent?.startsWith(d.parent.name) : parent && !/^none\b/.test(parent)) {
    fail(`${here}: Parent is "${parent ?? 'missing'}", but the folder says ${d.parent ? d.parent.name : 'top-level'}`)
  }
  const declaredChildren = listOf(header(doc, 'Child domains')).sort().join(', ')
  const actualChildren = d.children.map((c) => c.name).sort().join(', ')
  if (declaredChildren !== actualChildren) {
    fail(`${here}: Child domains lists [${declaredChildren}], folders are [${actualChildren}]`)
  }
  for (const f of ['Owns', 'Interface', 'Checkpoint']) {
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

  // Generated sections match what the code shows: Files, then Consumers.
  const consumers = domains
    .filter((other) => edges.get(other)?.has(d))
    .map((other) => (other.parent && other.parent !== d.parent ? id(other) : other.name))
    .sort()
  const generatedSections = [
    { title: 'Files', block: FILES_BLOCK, expected: filesBlock(d) },
    {
      title: 'Consumers',
      block: CONSUMERS_BLOCK,
      expected: consumers.length ? `<!-- generated: do not edit -->\n- ${consumers.join(', ')}\n<!-- end generated -->` : '',
    },
  ]
  let rewritten = false
  for (const g of generatedSections) {
    const found = doc.match(g.block)?.[0] ?? ''
    if (found === g.expected) continue
    const problem = !g.expected ? `${g.title} section is empty: remove it` : found ? `${g.title} section is stale` : `missing the generated ${g.title} block`
    if (!FIX) {
      fail(`${here}: ${problem}; run with --fix`)
      continue
    }
    if (!g.expected) doc = doc.replace(new RegExp(`\\n*## ${g.title}\\s*\\n${g.block.source}\\n*`), '\n\n').trimEnd() + '\n'
    else if (found) doc = doc.replace(g.block, g.expected)
    else {
      // Files goes before Mirrors or Consumers; Consumers goes last.
      const at = g.title === 'Files' ? doc.search(/^## (Mirrors|Consumers)\b/m) : -1
      const heading = `## ${g.title}\n${g.expected}\n`
      doc = at < 0 ? `${doc.trimEnd()}\n\n${heading}` : `${doc.slice(0, at)}${heading}\n${doc.slice(at)}`
    }
    rewritten = true
  }
  if (rewritten) {
    writeFileSync(path, doc)
    console.log(`regenerated ${here}`)
  }
}

// ------------------------------------------------------------ one copy of every helper

// A function with the same tokens in two domains is a second copy of one decision, however
// it is formatted. Move it into a domain both import (a sibling child, else a top-level
// domain), or declare the pair under Mirrors in a DOMAIN.md that names the other domain.
{
  const copies = new Map<string, { file: string; domain: Domain; name: string }[]>()
  for (const file of sourceFiles) {
    const domain = ownerOf(file)
    if (!domain) continue
    const sf = parseFile(file)
    for (const stmt of sf.statements) {
      const fns: { name: string; node: ts.Node }[] = []
      if (ts.isFunctionDeclaration(stmt) && stmt.name && stmt.body) fns.push({ name: stmt.name.text, node: stmt })
      if (ts.isVariableStatement(stmt)) {
        for (const decl of stmt.declarationList.declarations) {
          const init = decl.initializer
          if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) fns.push({ name: decl.name.getText(sf), node: stmt })
        }
      }
      for (const fn of fns) {
        const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, fn.node.getText(sf))
        const tokens: string[] = []
        for (let t = scanner.scan(); t !== ts.SyntaxKind.EndOfFileToken; t = scanner.scan()) tokens.push(scanner.getTokenText())
        if (tokens.length < 30) continue
        const key = tokens.join(' ')
        copies.set(key, [...(copies.get(key) ?? []), { file, domain, name: fn.name }])
      }
    }
  }
  const mirrors = (d: Domain) => section(readFileSync(join(d.dir, 'DOMAIN.md'), 'utf8'), 'Mirrors')
  const declared = (a: Domain, b: Domain) => mirrors(a).includes(b.name) || mirrors(b).includes(a.name)
  for (const group of copies.values()) {
    const domainsHere = new Set(group.map((c) => c.domain))
    if (domainsHere.size < 2) continue
    for (const c of group) {
      const others = group.filter((o) => o.domain !== c.domain)
      if (others.every((o) => declared(c.domain, o.domain))) continue
      fail(`${rel(c.file)}: ${c.name}() is also written in ${[...new Set(others.map((o) => id(o.domain)))].join(', ')}; move it into a domain both import`)
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
console.log(`✓ ${domains.length} domains checked: structure, data ownership, rules, recipes, files, consumers, helpers, map`)
