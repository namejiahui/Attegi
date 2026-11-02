import { defineConfig, build, type Plugin } from 'vite';
import path from 'node:path';
import fs from 'node:fs';

const isProduction = process.env.NODE_ENV === 'production';

// Vendor files that are conditionally loaded by Handlebars templates
const vendorFiles = [
  { src: 'src/js/libs/highlight.pack.js', dest: 'assets/js/highlight.pack.js' },
  { src: 'src/js/libs/glightbox.min.js', dest: 'assets/js/glightbox.min.js' },
  { src: 'node_modules/tocbot/dist/tocbot.min.js', dest: 'assets/js/tocbot.min.js' },
  { src: 'src/css/glightbox.min.css', dest: 'assets/css/glightbox.min.css' }
];

/**
 * Custom Vite plugin to:
 * 1. Build independent IIFE JavaScript entry points for Ghost templates (site.js, post.js, page.js)
 * 2. Copy static vendor libraries to assets
 * 3. Add watch listeners to src/js in development mode
 */
function ghostThemePlugin(): Plugin {
  return {
    name: 'ghost-theme-builder',
    buildStart() {
      // In watch mode, register src/js files so modifying JS triggers a rebuild
      const jsDir = path.resolve(import.meta.dirname, 'src/js');
      if (fs.existsSync(jsDir)) {
        const addFilesRecursively = (dir: string) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              addFilesRecursively(fullPath);
            } else if (/\.(js|ts|mjs)$/.test(entry.name)) {
              this.addWatchFile(fullPath);
            }
          }
        };
        addFilesRecursively(jsDir);
      }
    },
    async writeBundle() {
      // Copy vendor libraries
      for (const { src, dest } of vendorFiles) {
        const srcPath = path.resolve(import.meta.dirname, src);
        const destPath = path.resolve(import.meta.dirname, dest);
        if (fs.existsSync(srcPath)) {
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.copyFileSync(srcPath, destPath);
        }
      }

      // Build JS entry points
      const entries: Array<{ name: string; file: string }> = [
        { name: 'site', file: 'src/js/entries/site.ts' },
        { name: 'post', file: 'src/js/entries/post.ts' },
        { name: 'page', file: 'src/js/entries/page.ts' }
      ];

      for (const entry of entries) {
        const entryPath = path.resolve(import.meta.dirname, entry.file);
        if (!fs.existsSync(entryPath)) continue;

        await build({
          configFile: false,
          build: {
            outDir: path.resolve(import.meta.dirname, 'assets/js'),
            emptyOutDir: false,
            minify: isProduction,
            sourcemap: !isProduction ? 'inline' : false,
            lib: {
              entry: entryPath,
              name: `Attegi_${entry.name}`,
              formats: ['iife'],
              fileName: () => `${entry.name}.js`
            }
          }
        });
      }
    }
  };
}

export default defineConfig({
  build: {
    outDir: 'assets',
    emptyOutDir: false,
    minify: isProduction,
    sourcemap: !isProduction ? 'inline' : false,
    rollupOptions: {
      input: {
        style: path.resolve(import.meta.dirname, 'src/css/style.css')
      },
      output: {
        assetFileNames: 'css/[name][extname]'
      }
    }
  },
  plugins: [
    ghostThemePlugin()
  ]
});
