'use strict';

// Test-only workspaces stay beside the original fixtures because several tests
// exercise repository-relative paths. Never discover or adopt existing folders.
const fs = require('node:fs');
const path = require('node:path');
const {after} = require('node:test');

const root = path.resolve(__dirname, '../research');
const parent = fs.realpathSync(path.dirname(root));
const owned = new Map();
let lastCleanup = {removed: [], retained: []};

function samePath(left, right) {
  return path.relative(left, right) === '';
}

function checkedRoot() {
  const stat = fs.lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error('Папка тестовых данных не должна быть ссылкой.');
  }
  const real = fs.realpathSync(root);
  if (!samePath(path.dirname(real), parent) ||
      path.basename(real).toLowerCase() !== 'research') {
    throw new Error('Папка тестовых данных находится за пределами проекта.');
  }
  return real;
}

function identity(stat) {
  return [stat.dev, stat.ino, stat.birthtimeNs].join(':');
}

function create(prefix) {
  if (typeof prefix !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,99}-$/i.test(prefix)) {
    throw new TypeError('Нужен простой префикс тестовой папки с дефисом в конце.');
  }
  fs.mkdirSync(root, {recursive: true});
  const realRoot = checkedRoot();
  const directory = fs.mkdtempSync(path.join(root, prefix));
  const real = fs.realpathSync(directory);
  if (!samePath(path.dirname(real), realRoot)) {
    throw new Error('Тестовая папка находится за пределами разрешённого каталога.');
  }
  owned.set(directory, {
    real,
    realRoot,
    identity: identity(fs.lstatSync(directory, {bigint: true})),
  });
  return directory;
}

function cleanup() {
  const result = {removed: [], retained: []};
  for (const [directory, record] of owned) {
    try {
      const stat = fs.lstatSync(directory, {bigint: true});
      if (!samePath(path.dirname(path.resolve(directory)), root) ||
          !samePath(checkedRoot(), record.realRoot) ||
          !stat.isDirectory() || stat.isSymbolicLink() ||
          identity(stat) !== record.identity ||
          !samePath(fs.realpathSync(directory), record.real)) {
        result.retained.push({directory, reason: 'ownership-changed'});
        continue;
      }
      // Node removes links inside a directory without following their targets.
      // The checked root, exact path and identity fence apply before recursion.
      fs.rmSync(directory, {recursive: true, force: true, maxRetries: 1, retryDelay: 5});
      owned.delete(directory);
      result.removed.push(directory);
    } catch (error) {
      const reason = error && error.code || 'cleanup-failed';
      if (reason === 'ENOENT') owned.delete(directory);
      else result.retained.push({directory, reason});
    }
  }
  lastCleanup = result;
  return result;
}

after(cleanup);
// Also covers an interrupted suite that exits before its root after-hook.
process.once('exit', cleanup);

module.exports = {create, cleanup, root, get lastCleanup() {return lastCleanup;}};
