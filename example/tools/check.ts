import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import ts from 'typescript'

const ROOT = resolve(import.meta.dirname, '..')
const SRC = join(ROOT, 'src')
const TOOLS = join(ROOT, 'tools')
const FIX = process.argv.includes('--fix')
const README_MAX_LINES = 60
const ENTRY_FILES = [join(SRC, 'server.ts')]
const IMPORTABLE_OUTSIDE_FOLDERS = [join(SRC, 'db.ts')]

const DOMAIN_KINDS = ['domain', 'child domain', 'junction']
const KINDS = [...DOMAIN_KINDS, 'adapter', 'shared']

const failures: string[] = []
const warnings: string[] = []
const fail = (msg: string) => failures.push(msg)
const rel = (p: string) => relative(ROOT, p).split(sep).join('/')

type Folder = { dir: string; name: string; kind: string; parent: Folder | null; children: Folder[] }

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const readme = (f: Folder) => join(f.dir, 'README.md')
const docOf = (f: Folder) => readFileSync(readme(f), 'utf8')

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

const folders: Folder[] = []
function discover(dir: string, parent: Folder | null) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (!statSync(p).isDirectory()) continue
    if (existsSync(join(p, 'README.md'))) {
      const kind = header(readFileSync(join(p, 'README.md'), 'utf8'), 'Kind') ?? ''
      const f: Folder = { dir: p, name: entry, kind, parent, children: [] }
      folders.push(f)
      parent?.children.push(f)
      discover(p, f)
    } else if (walk(p).some((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))) {
      fail(`${rel(p)}: folder of code has no README.md with a Kind line`)
    }
  }
}
discover(SRC, null)

const isDomain = (f: Folder) => DOMAIN_KINDS.includes(f.kind)
const topLevel = folders.filter((f) => f.parent === null)
const id = (f: Folder) => rel(f.dir).replace(/^src\//, '')

for (const f of folders) {
  const where = `${rel(readme(f))}: Kind is "${f.kind || 'missing'}"`
  if (!KINDS.includes(f.kind)) fail(`${where}; use one of: ${KINDS.join(', ')}`)
  else if (!f.parent && !['domain', 'junction', 'shared'].includes(f.kind)) fail(`${where}, but a top-level folder is a domain, a junction, or a declared shared folder`)
  else if (f.parent && !['child domain', 'adapter', 'shared'].includes(f.kind)) fail(`${where}, but a folder inside ${id(f.parent)} is a child domain, an adapter, or shared`)
  else if (f.parent && f.kind === 'child domain' && !isDomain(f.parent)) fail(`${where}, but ${id(f.parent)} is not a domain`)
}

function ownerOf(file: string): Folder | undefined {
  return folders.filter((f) => file.startsWith(f.dir + sep)).sort((a, b) => b.dir.length - a.dir.length)[0]
}

const isAncestor = (a: Folder, b: Folder): boolean => {
  for (let p = b.parent; p; p = p.parent) if (p === a) return true
  return false
}
const within = (f: Folder, scope: Folder) => f === scope || isAncestor(scope, f)

const publicFile = (f: Folder) => join(f.dir, 'service.ts')

const sourceFiles = walk(SRC).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
const testFiles = walk(SRC).filter((f) => f.endsWith('.test.ts'))
const parseFile = (file: string) => ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)

type Use = { from: string; target: string; names: string[] | '*' }
const uses: Use[] = []
for (const file of [...sourceFiles, ...testFiles]) {
  for (const stmt of parseFile(file).statements) {
    if (!(ts.isImportDeclaration(stmt) || ts.isExportDeclaration(stmt))) continue
    const spec = stmt.moduleSpecifier
    if (!spec || !ts.isStringLiteral(spec) || !spec.text.startsWith('.')) continue
    let names: string[] | '*' = []
    if (ts.isImportDeclaration(stmt) && stmt.importClause) {
      const clause = stmt.importClause
      if (clause.name) names.push('default')
      const bindings = clause.namedBindings
      if (bindings && ts.isNamespaceImport(bindings)) names = '*'
      else if (bindings) for (const el of bindings.elements) (names as string[]).push((el.propertyName ?? el.name).text)
    } else names = '*'
    uses.push({ from: file, target: resolve(dirname(file), spec.text), names })
  }
}

const edges = new Map<Folder, Set<Folder>>()
for (const use of uses) {
  const { from: file, target } = use
  const isTest = file.endsWith('.test.ts')
  const from = ownerOf(file)
  if (!from) continue
  const to = ownerOf(target)
  const where = `${rel(file)} imports ${rel(target)}`
  if (!to) {
    if (!IMPORTABLE_OUTSIDE_FOLDERS.includes(target) && !isTest) fail(`${where}: folder code may import only db.ts from outside the folders`)
    continue
  }
  if (to === from) continue

  if (from.kind === 'shared' && !isTest) {
    fail(`${where}: shared code imports nothing from other folders`)
    continue
  }
  if (to.kind === 'adapter') {
    const callerOk = (from === to.parent && file === publicFile(to.parent)) || (isTest && to.parent && within(from, to.parent))
    if (!callerOk) fail(`${where}: ${id(to)} is an adapter; only ${to.parent ? id(to.parent) : 'its domain'}'s service.ts calls it`)
  } else if (to.kind === 'shared') {
    if (to.parent && !within(from, to.parent)) fail(`${where}: ${id(to)} is shared only inside ${id(to.parent)}`)
  } else {
    const inbound = from.kind === 'adapter' && to === from.parent
    if (isAncestor(to, from) && !inbound) {
      fail(`${where}: a child domain may not depend on its parent (${id(to)})`)
      continue
    }
    if (target !== publicFile(to)) fail(`${where}: reaches a private file of ${id(to)}; import its service.ts`)
    if (from.kind === 'adapter' && !inbound) fail(`${where}: an adapter reaches only its own domain's service.ts`)
    if (to.parent && !within(from, to.parent)) fail(`${where}: ${id(to)} is a child domain, visible only inside ${id(to.parent)}`)
  }
  if (!isTest) {
    if (!edges.has(from)) edges.set(from, new Set())
    edges.get(from)!.add(to)
  }
}

{
  const state = new Map<Folder, 'visiting' | 'done'>()
  const visit = (f: Folder, path: Folder[]) => {
    if (state.get(f) === 'done') return
    if (state.get(f) === 'visiting') {
      fail(`dependency cycle: ${[...path.slice(path.indexOf(f)), f].map(id).join(' → ')}`)
      return
    }
    state.set(f, 'visiting')
    for (const next of edges.get(f) ?? []) if (!isAncestor(next, f)) visit(next, [...path, f])
    state.set(f, 'done')
  }
  for (const f of folders) visit(f, [])
}

const allowedComment = (text: string) =>
  /^\/\/\s*(@ts-|eslint|prettier-ignore)|^\/\*\s*eslint|^\/\*!|SPDX-License-Identifier|^\/\/\/\s*<reference/.test(text)

for (const file of [...walk(SRC), ...walk(TOOLS)].filter((f) => f.endsWith('.ts'))) {
  const text = readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
  const seen = new Set<number>()
  const report = (ranges: ts.CommentRange[] | undefined) => {
    for (const r of ranges ?? []) {
      if (seen.has(r.pos) || allowedComment(text.slice(r.pos, r.end))) continue
      seen.add(r.pos)
      fail(`${rel(file)}:${sf.getLineAndCharacterOfPosition(r.pos).line + 1}: comment in code; behavior goes in README.md`)
    }
  }
  const visit = (node: ts.Node) => {
    report(ts.getLeadingCommentRanges(text, node.pos))
    report(ts.getTrailingCommentRanges(text, node.end))
    node.getChildren(sf).forEach(visit)
  }
  visit(sf)
}

const isExported = (n: ts.Node) => ts.canHaveModifiers(n) && !!ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)

function valueExports(file: string): string[] {
  const out: string[] = []
  for (const node of parseFile(file).statements.filter(isExported)) {
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) out.push(node.name.text)
    if (ts.isVariableStatement(node)) for (const decl of node.declarationList.declarations) out.push(decl.name.getText())
  }
  return out
}

for (const file of sourceFiles) {
  if (ENTRY_FILES.includes(file)) continue
  const usedBy = uses.filter((u) => u.target === file && u.from !== file)
  if (!usedBy.length) {
    fail(`${rel(file)}: nothing imports this file; delete it, or declare its consumer`)
    continue
  }
  if (usedBy.some((u) => u.names === '*')) continue
  const owner = ownerOf(file)
  const declared = owner ? docOf(owner) : ''
  for (const name of valueExports(file)) {
    if (usedBy.some((u) => (u.names as string[]).includes(name))) continue
    if (declared.includes(`${name}(`)) continue
    fail(`${rel(file)}: export ${name} is used by nothing; delete it, or declare its consumer in README.md`)
  }
}

const generated = (lines: string[]) => (lines.length ? `<!-- generated: do not edit -->\n${lines.join('\n')}\n<!-- end generated -->` : '')
const sectionBlock = (title: string) => new RegExp(`^## ${title}\\n<!-- generated: do not edit -->[\\s\\S]*?<!-- end generated -->\\n?`, 'm')
const plural = (names: string[], one: string, many: string) => `- ${names.join(', ')} (${names.length > 1 ? many : one})`

function containsLines(f: Folder): string[] {
  const of = (kind: string) => f.children.filter((c) => c.kind === kind).map((c) => c.name).sort()
  const lines: string[] = []
  const children = of('child domain')
  const adapters = of('adapter')
  const shared = of('shared')
  if (children.length) lines.push(plural(children, 'child domain', 'child domains'))
  if (adapters.length) lines.push(plural(adapters, 'adapter', 'adapters'))
  if (shared.length) lines.push(plural(shared, 'shared', 'shared'))
  return lines
}

function consumerLines(f: Folder): string[] {
  const names = folders
    .filter((other) => edges.get(other)?.has(f) && !isAncestor(f, other))
    .map((other) => (other.parent && other.parent !== f.parent ? id(other) : other.name))
    .sort()
  return names.length ? [`- ${names.join(', ')}`] : []
}

const ruleOwners = new Map<string, string>()
const tableOwners = new Map<string, string>()

for (const f of folders) {
  const path = readme(f)
  let doc = readFileSync(path, 'utf8')
  const here = rel(path)

  const parent = header(doc, 'Parent')
  if (f.parent ? !parent?.startsWith(f.parent.name) : parent && !/^none\b/.test(parent)) {
    fail(`${here}: Parent is "${parent ?? 'missing'}", but the folder says ${f.parent ? f.parent.name : 'top-level'}`)
  }
  if (header(doc, 'Child domains')) fail(`${here}: "Child domains:" is replaced by the generated Contains section`)
  for (const field of ['Owns', 'Interface', 'Checkpoint']) if (!header(doc, field)) fail(`${here}: missing "${field}:"`)
  if (f.kind === 'junction' && !header(doc, 'Inputs')) fail(`${here}: a junction lists its Inputs`)

  const modelFile = join(f.dir, 'model.ts')
  const tables = existsSync(modelFile) ? [...readFileSync(modelFile, 'utf8').matchAll(/@Entity\(\s*['"](\w+)['"]/g)].map((m) => m[1]) : []
  const declaredTables = listOf(header(doc, 'Owns data')).sort().join(', ')
  if (declaredTables !== [...tables].sort().join(', ')) fail(`${here}: Owns data lists [${declaredTables}], model.ts defines [${tables.join(', ')}]`)
  let top = f
  while (top.parent) top = top.parent
  const prefix = top.name.replace(/-/g, '_')
  for (const t of tables) {
    if (t !== prefix && !t.startsWith(prefix + '_')) fail(`${here}: table ${t} should start with ${prefix}_`)
    if (tableOwners.has(t)) fail(`${here}: table ${t} is also created by ${tableOwners.get(t)}`)
    tableOwners.set(t, id(f))
  }

  for (const rule of section(doc, 'Rules').split(/^- /m).slice(1)) {
    const first = rule.split('\n')[0].trim()
    const anchor = rule.match(/Enforced by:\s*(\S+)\s*›\s*"([^"]+)"/)
    if (!anchor) fail(`${here}: rule has no "Enforced by" test: ${first}`)
    else {
      const testFile = join(f.dir, anchor[1])
      const body = existsSync(testFile) ? readFileSync(testFile, 'utf8') : ''
      if (![`'${anchor[2]}'`, `"${anchor[2]}"`, `\`${anchor[2]}\``].some((q) => body.includes(`test(${q}`))) {
        fail(`${here}: rule anchored to a missing test: ${anchor[1]} › "${anchor[2]}"`)
      }
    }
    const key = first.toLowerCase()
    if (ruleOwners.has(key)) fail(`${here}: rule also appears in ${ruleOwners.get(key)}: ${first}`)
    ruleOwners.set(key, here)
  }

  const folderFiles = walk(f.dir).map((file) => basename(file))
  for (const m of section(doc, 'Recipes').matchAll(/\b([\w.-]+\.(?:ts|sql))\b/g)) {
    if (!folderFiles.includes(m[1])) fail(`${here}: Recipes mention ${m[1]}, which does not exist`)
  }

  let rewritten = false
  for (const g of [
    { title: 'Contains', expected: generated(containsLines(f)) },
    { title: 'Consumers', expected: generated(consumerLines(f)) },
  ]) {
    const found = doc.match(sectionBlock(g.title))?.[0].replace(/^## \w+\n/, '').trimEnd() ?? ''
    if (found === g.expected) continue
    const problem = !g.expected ? `${g.title} section is empty: remove it` : found ? `${g.title} section is stale` : `missing the generated ${g.title} section`
    if (!FIX) {
      fail(`${here}: ${problem}; run npm run docs:regen`)
      continue
    }
    const heading = g.expected ? `## ${g.title}\n${g.expected}\n` : ''
    if (found) doc = doc.replace(sectionBlock(g.title), heading)
    else {
      const at = g.title === 'Contains' ? doc.search(/^## Consumers\b/m) : -1
      doc = at < 0 ? `${doc.trimEnd()}\n\n${heading}` : `${doc.slice(0, at)}${heading}\n${doc.slice(at)}`
    }
    doc = doc.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
    rewritten = true
  }
  if (rewritten) {
    writeFileSync(path, doc)
    console.log(`regenerated ${here}`)
  }

  const lines = doc.trimEnd().split('\n').length
  if (lines > README_MAX_LINES) warnings.push(`${here}: ${lines} lines, past the ${README_MAX_LINES}-line limit; flagged for QA`)
}

{
  const copies = new Map<string, { file: string; folder: Folder; name: string }[]>()
  for (const file of sourceFiles) {
    const folder = ownerOf(file)
    if (!folder) continue
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
        copies.set(key, [...(copies.get(key) ?? []), { file, folder, name: fn.name }])
      }
    }
  }
  const declared = (a: Folder, b: Folder) => section(docOf(a), 'Mirrors').includes(b.name) || section(docOf(b), 'Mirrors').includes(a.name)
  for (const group of copies.values()) {
    if (new Set(group.map((c) => c.folder)).size < 2) continue
    for (const c of group) {
      const others = group.filter((o) => o.folder !== c.folder)
      if (others.every((o) => declared(c.folder, o.folder))) continue
      fail(
        `${rel(c.file)}: ${c.name}() is also written in ${[...new Set(others.map((o) => id(o.folder)))].join(', ')}; ` +
          `reuse one copy: a shared/ folder in the nearest common parent, or the owning domain's service`,
      )
    }
  }
}

{
  const mapPath = join(ROOT, 'MAP.md')
  const map = existsSync(mapPath) ? readFileSync(mapPath, 'utf8') : ''
  const rows = [...map.matchAll(/^\|\s*([\w-]+)\s*\|\s*([^|]*)\|/gm)]
    .map((m) => ({ name: m[1], owns: m[2].trim() }))
    .filter((r) => r.name !== 'Domain' && /[a-z]/i.test(r.name))
  for (const f of topLevel) {
    if (f.kind === 'shared') {
      if (!new RegExp(`^- ${f.name}:`, 'm').test(section(map, 'Shared'))) fail(`MAP.md: top-level shared folder ${f.name} is not declared under "## Shared" with its reason`)
      continue
    }
    const row = rows.find((r) => r.name === f.name)
    if (!row) fail(`MAP.md: top-level domain ${f.name} is not on the map`)
    else if ((f.kind === 'junction') !== row.owns.startsWith('junction:')) fail(`MAP.md: ${f.name} is ${f.kind === 'junction' ? '' : 'not '}a junction, but the map says otherwise`)
  }
  for (const r of rows) if (!topLevel.some((f) => f.name === r.name)) fail(`MAP.md: ${r.name} is on the map but has no folder in src/`)
}

for (const w of warnings) console.warn(`! ${w}`)
if (failures.length) {
  console.error(`✗ ${failures.length} problem(s):\n`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log(`✓ ${folders.length} folders checked: structure, adapters, shared code, data ownership, rules, recipes, comments, dead code, generated sections, helpers, map`)
