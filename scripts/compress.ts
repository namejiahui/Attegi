import { ZipArchive } from 'archiver';
import fs from 'node:fs';
import path from 'node:path';
import pkg from '../package.json' with { type: 'json' };

// Output configuration
const distDir = path.resolve('dist');
const themeName = pkg.name || 'attegi';
const outputPath = path.join(distDir, `${themeName}.zip`);

// Files and directories to exclude
const excludePatterns: string[] = [
  'node_modules/**',
  'src/**',
  'dist/**',
  'screenshots/**',
  '.git/**',
  '.github/**',
  'scripts/**',
  '.gitignore',
  '.gitattributes',
  'Gruntfile.js',
  'bun.lock',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'package-lock.json',
  'docker-compose.yml',
  'AGENTS.md',
  'CLAUDE.md',
  'skills-lock.json',
  'README_zh.md',
  '.DS_Store',
  '.lighthouseci/**',
  '.playwright-mcp/**',
  'postcss.config.*',
  'vite.config.*',
  'tsconfig.json',
  'assets/css/*.map',
  '*.log'
];

async function compress(): Promise<void> {
  console.log('\n========================================');
  console.log('  Attegi Theme Compression');
  console.log('========================================\n');

  // Ensure dist directory exists
  fs.mkdirSync(distDir, { recursive: true });

  // Clean existing archive if present
  fs.rmSync(outputPath, { force: true });

  // Create write stream
  const output = fs.createWriteStream(outputPath);
  const archive = new ZipArchive({
    zlib: { level: 9 } // Maximum compression
  });

  return new Promise<void>((resolve, reject) => {
    output.on('close', () => {
      const sizeKB = (archive.pointer() / 1024).toFixed(2);
      console.log(`\n[Done] Created ${outputPath}`);
      console.log(`       Size: ${sizeKB} KB`);
      resolve();
    });

    archive.on('warning', (err: { code: string; message: string }) => {
      if (err.code === 'ENOENT') {
        console.warn('[Warning]', err.message);
      } else {
        reject(err);
      }
    });

    archive.on('error', (err: Error) => {
      reject(err);
    });

    // Pipe archive to file
    archive.pipe(output);

    // Add all files except excluded patterns
    archive.glob('**/*', {
      ignore: excludePatterns,
      dot: false
    });

    // Finalize archive
    archive.finalize().catch(reject);
  });
}

compress().catch((err: Error) => {
  console.error('[Error]', err.message);
  process.exit(1);
});
