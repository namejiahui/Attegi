#!/usr/bin/env node

/**
 * Node-native development task runner.
 * Spawns concurrent subtasks and streams colored logs.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import readline from 'node:readline';

const COLORS = {
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  dim: '\x1b[2m'
} as const;

interface DevTask {
  name: string;
  color: string;
  script: string;
}

interface RunningChild {
  task: DevTask;
  proc: ChildProcess;
}

const MODES: Record<string, DevTask[]> = {
  css: [
    { name: 'vite', color: COLORS.cyan, script: 'build:watch' }
  ],
  default: [
    { name: 'vite', color: COLORS.cyan, script: 'build:watch' }
  ],
  hot: [
    { name: 'vite', color: COLORS.cyan, script: 'build:watch' },
    { name: 'hot', color: COLORS.green, script: 'serve:hot' }
  ],
  preview: [
    { name: 'vite', color: COLORS.cyan, script: 'build:watch' },
    { name: 'preview', color: COLORS.green, script: 'serve:preview' }
  ]
};

const mode = process.argv[2] || 'default';
const tasks = MODES[mode];

if (!tasks) {
  console.error(`${COLORS.red}Unknown dev mode:${COLORS.reset} ${mode}`);
  console.error(`Use one of: ${Object.keys(MODES).join(', ')}`);
  process.exit(1);
}

const children: RunningChild[] = [];
let shuttingDown = false;

function prefix(name: string, color: string): string {
  return `${color}[${name}]${COLORS.reset}`;
}

function writeLine(target: NodeJS.WriteStream, name: string, color: string, line: string): void {
  const text = line.length ? line : '';
  target.write(`${prefix(name, color)} ${text}\n`);
}

function killChildren(signal: NodeJS.Signals = 'SIGTERM'): void {
  for (const child of children) {
    try {
      child.proc.kill(signal);
    } catch {
      // Ignore already-exited children.
    }
  }
}

function shutdown(code: number = 0, signal: NodeJS.Signals = 'SIGTERM'): void {
  if (shuttingDown) return;
  shuttingDown = true;
  killChildren(signal);
  process.exit(code);
}

function spawnTask(task: DevTask): void {
  const proc = spawn('pnpm', ['run', task.script], {
    cwd: process.cwd(),
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
    shell: true
  });

  const child: RunningChild = { task, proc };
  children.push(child);

  if (proc.stdout) {
    readline.createInterface({ input: proc.stdout }).on('line', (line) => {
      writeLine(process.stdout, task.name, task.color, line);
    });
  }

  if (proc.stderr) {
    readline.createInterface({ input: proc.stderr }).on('line', (line) => {
      writeLine(process.stderr, task.name, task.color, line);
    });
  }

  proc.on('close', (code) => {
    if (shuttingDown) return;

    if (code === 0) {
      writeLine(process.stdout, task.name, task.color, `${COLORS.dim}exited normally${COLORS.reset}`);
      shutdown(0);
      return;
    }

    writeLine(process.stderr, task.name, COLORS.red, `exited with code ${code}`);
    shutdown(code || 1);
  });
}

process.on('SIGINT', () => {
  shutdown(0, 'SIGINT');
});

process.on('SIGTERM', () => {
  shutdown(0, 'SIGTERM');
});

for (const task of tasks) {
  spawnTask(task);
}
