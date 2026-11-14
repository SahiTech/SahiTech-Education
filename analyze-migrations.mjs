import fs from 'node:fs';
import path from 'node:path';

const dir = 'packages/database/migrations';
const files = fs.readdirSync(dir).filter(f => {
  const m = f.match(/^(\d+)/);
  if (!m) return false;
  const num = parseInt(m[1], 10);
  return num >= 8 && num <= 40;
}).sort();

console.log('Total migrations to analyze:', files.length);

const results = [];
for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const hasConcurrently = /create\s+(unique\s+)?index\s+concurrently/i.test(content);
  const createsTables = [...content.matchAll(/create\s+table\s+(if\s+not\s+exists\s+)?([a-zA-Z0-9_\.]+)/gi)].map(m => m[2]);
  const createsFunctions = [...content.matchAll(/create\s+(or\s+replace\s+)?function\s+([a-zA-Z0-9_\.]+)/gi)].map(m => m[2]);
  const altersTables = [...content.matchAll(/alter\s+table\s+(if\s+exists\s+)?([a-zA-Z0-9_\.]+)/gi)].map(m => m[2]);
  results.push({
    file,
    hasConcurrently,
    createsTables,
    createsFunctions,
    altersTables: [...new Set(altersTables)]
  });
}

const concurrentlyList = results.filter(r => r.hasConcurrently).map(r => r.file);
console.log('Any CONCURRENTLY indexes (which prevent transactional execution)?', concurrentlyList.length ? concurrentlyList : 'None (100% Transaction Safe)');

console.log('\nMigration Detail:');
for (const r of results) {
  console.log(`[${r.file}]:`);
  if (r.createsTables.length) console.log(`   Creates: ${r.createsTables.join(', ')}`);
  if (r.altersTables.length) console.log(`   Alters:  ${r.altersTables.join(', ')}`);
  if (r.createsFunctions.length) console.log(`   Functions: ${r.createsFunctions.join(', ')}`);
}

