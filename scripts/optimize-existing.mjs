#!/usr/bin/env node
import sharp from 'sharp';
import { readdir, rename, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const configs = {
  logo: { width: 300, quality: 90 },
  favicon: { width: 512, quality: 90 },
  cover: { width: 1920, quality: 85 },
  hero: { width: 1920, quality: 85 },
  general: { width: 1200, quality: 85 }
};

function getConfig(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('logo')) return configs.logo;
  if (lower.includes('favicon') || lower.includes('icon') || lower.includes('apple-touch')) return configs.favicon;
  if (lower.includes('cover')) return configs.cover;
  if (lower.includes('hero')) return configs.hero;
  return configs.general;
}

async function optimizeFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  const config = getConfig(filePath);
  const tempPath = filePath + '.tmp';

  try {
    const oldStats = await stat(filePath);
    console.log(`\nOptimizing: ${filePath}`);
    console.log(`  Original: ${(oldStats.size / 1024).toFixed(2)}KB`);

    const image = sharp(filePath);

    if (ext === '.png') {
      await image
        .resize(config.width, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .png({
          quality: config.quality,
          compressionLevel: 9,
          effort: 10
        })
        .toFile(tempPath);
    } else if (ext === '.jpg' || ext === '.jpeg') {
      await image
        .resize(config.width, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({
          quality: config.quality,
          mozjpeg: true
        })
        .toFile(tempPath);
    }

    await rename(tempPath, filePath);
    const newStats = await stat(filePath);
    const savings = ((1 - newStats.size / oldStats.size) * 100).toFixed(1);

    console.log(`  Optimized: ${(newStats.size / 1024).toFixed(2)}KB`);
    console.log(`  Savings: ${savings}%`);
  } catch (error) {
    console.error(`  Error: ${error.message}`);
  }
}

// Files to optimize
const filesToOptimize = [
  'public/Chicago.png',
  'public/Cover.png',
  'public/Logo.png',
  'public/favicon.png',
  'public/android-chrome-192x192.png',
  'public/android-chrome-512x512.png',
  'public/apple-touch-icon.png',
  'src/assets/craftlocal-chicago-logo.png',
  'src/assets/craftlocal-logo.jpeg',
  'src/assets/hero-marketplace.jpg',
  'src/assets/makers-collage.jpg'
];

console.log('🖼️  Optimizing PNG/JPG files in place...\n');

(async () => {
  for (const file of filesToOptimize) {
    const fullPath = join(projectRoot, file);
    await optimizeFile(fullPath);
  }
  console.log('\n✅ Optimization complete!');
})();
