'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const workspace = require('./test-workspace.cjs');

function removeFixture(directory) {
  assert.equal(path.dirname(path.resolve(directory)), workspace.root);
  const stat = fs.lstatSync(directory);
  assert.equal(stat.isSymbolicLink(), false);
  assert.equal(path.dirname(fs.realpathSync(directory)), fs.realpathSync(workspace.root));
  fs.rmSync(directory, {recursive: true, force: true});
}

test('cleanup removes only folders created by this process and never adopts older fixtures', t => {
  const owned = workspace.create('workspace-owner-');
  const legacy = fs.mkdtempSync(path.join(workspace.root, 'workspace-legacy-'));
  t.after(() => removeFixture(legacy));
  const canary = path.join(legacy, 'keep.txt');
  fs.writeFileSync(canary, 'foreign fixture');
  fs.writeFileSync(path.join(owned, 'fixture.json'), '{}');

  const result = workspace.cleanup();

  assert.ok(result.removed.includes(owned));
  assert.equal(fs.existsSync(owned), false);
  assert.equal(fs.readFileSync(canary, 'utf8'), 'foreign fixture');
  assert.equal(workspace.cleanup.length, 0);
  workspace.cleanup(legacy); // Passing a foreign path cannot register it.
  assert.equal(fs.existsSync(canary), true);
});

test('cleanup does not follow links and refuses a replaced workspace root', t => {
  const foreign = fs.mkdtempSync(path.join(workspace.root, 'workspace-canary-'));
  t.after(() => removeFixture(foreign));
  const canary = path.join(foreign, 'keep.txt');
  fs.writeFileSync(canary, 'outside owned tree');
  const owned = workspace.create('workspace-linked-');
  const replaced = workspace.create('workspace-replaced-');
  fs.rmdirSync(replaced);
  try {
    fs.symlinkSync(foreign, path.join(owned, 'external'), 'junction');
    fs.symlinkSync(foreign, replaced, 'junction');
  } catch (error) {
    if (error.code !== 'EPERM' && error.code !== 'EACCES') throw error;
    t.skip('Система не разрешает создавать ссылки для проверки.');
    return;
  }
  t.after(() => {
    try {fs.unlinkSync(replaced);} catch (error) {if (error.code !== 'ENOENT') throw error;}
  });

  const result = workspace.cleanup();

  assert.equal(fs.existsSync(owned), false);
  assert.ok(result.retained.some(item => item.directory === replaced));
  assert.equal(fs.readFileSync(canary, 'utf8'), 'outside owned tree');
  assert.ok(fs.lstatSync(replaced).isSymbolicLink());
});

test('workspace prefixes cannot escape the research directory', () => {
  for (const prefix of ['../outside-', '..\\outside-', '/outside-', '', 'nested/name-']) {
    assert.throws(() => workspace.create(prefix), TypeError);
  }
});

test('a foreign replacement at a formerly owned path is retained', t => {
  const replaced = workspace.create('workspace-replacement-');
  const original = `${replaced}-original`;
  fs.renameSync(replaced, original);
  fs.mkdirSync(replaced);
  const canary = path.join(replaced, 'keep.txt');
  fs.writeFileSync(canary, 'new owner');
  t.after(() => {
    removeFixture(original);
    removeFixture(replaced);
  });

  const result = workspace.cleanup();

  assert.ok(result.retained.some(item => item.directory === replaced));
  assert.equal(fs.readFileSync(canary, 'utf8'), 'new owner');
  assert.equal(fs.existsSync(original), true);
});

test('a completed process automatically removes its own workspace', () => {
  const program = `const workspace = require(${JSON.stringify(require.resolve('./test-workspace.cjs'))});\n` +
    `process.stdout.write(JSON.stringify(workspace.create('workspace-auto-')) + '\\n');`;
  const result = spawnSync(process.execPath, ['-e', program], {encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr);
  const directory = JSON.parse(result.stdout.split(/\r?\n/)[0]);
  assert.equal(path.dirname(directory), workspace.root);
  assert.equal(fs.existsSync(directory), false);
});
