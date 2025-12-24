#!/usr/bin/env node
import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Image optimization configurations
const configs = {
  logo: { width: 300, quality: 90, webpQuality: 85 }, // Header logos
  favicon: { width: 512, quality: 90, webpQuality: 85 }, // Favicons
  cover: { width: 1920, quality: 85, webpQuality: 80 }, // Large covers
  hero: { width: 1920, quality: 85, webpQuality: 80 }, // Hero images
  general: { width: 1200, quality: 85, webpQuality: 80 } // General images
};

function getConfig(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('logo')) return configs.logo;
  if (lower.includes('favicon') || lower.includes('icon') || lower.includes('apple-touch')) return configs.favicon;
  if (lower.includes('cover')) return configs.cover;
  if (lower.includes('hero')) return configs.hero;
  return configs.general;
}

async function optimizeImage(inputPath, outputPath, config) {
  const ext = extname(inputPath).toLowerCase();
  const baseName = basename(inputPath, ext);

  console.log(`\nProcessing: ${inputPath}`);

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    console.log(`  Original: ${metadata.width}x${metadata.height}, ${metadata.format}, ${(metadata.size / 1024).toFixed(2)}KB`);

    // Resize and optimize based on format
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      // Generate WebP version
      const webpPath = outputPath.replace(ext, '.webp');
      await image
        .resize(config.width, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({
          quality: config.webpQuality,
          effort: 6
        })
        .toFile(webpPath);

      const webpStats = await stat(webpPath);
      console.log(`  WebP created: ${(webpStats.size / 1024).toFixed(2)}KB`);

      // Optimize original format
      if (ext === '.png') {
        await sharp(inputPath)
          .resize(config.width, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .png({
            quality: config.quality,
            compressionLevel: 9,
            effort: 10
          })
          .toFile(outputPath);
      } else {
        await sharp(inputPath)
          .resize(config.width, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .jpeg({
            quality: config.quality,
            mozjpeg: true
          })
          .toFile(outputPath);
      }

      const optimizedStats = await stat(outputPath);
      console.log(`  Optimized ${ext}: ${(optimizedStats.size / 1024).toFixed(2)}KB`);
      console.log(`  Savings: ${((1 - optimizedStats.size / metadata.size) * 100).toFixed(1)}%`);
    } else if (ext === '.webp') {
      // Re-optimize existing WebP
      await image
        .resize(config.width, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({
          quality: config.webpQuality,
          effort: 6
        })
        .toFile(outputPath);

      const optimizedStats = await stat(outputPath);
      console.log(`  Optimized WebP: ${(optimizedStats.size / 1024).toFixed(2)}KB`);
    }
  } catch (error) {
    console.error(`  Error optimizing ${inputPath}:`, error.message);
  }
}

async function processDirectory(dirPath, outputDir) {
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    const outputPath = join(outputDir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, dist, etc.
      if (!['node_modules', 'dist', '.git', 'scripts'].includes(entry.name)) {
        await processDirectory(fullPath, outputPath);
      }
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        const config = getConfig(entry.name);
        await optimizeImage(fullPath, outputPath, config);
      }
    }
  }
}

// Main execution
console.log('🖼️  Image Optimization Script\n');
console.log('This will optimize images in public/ and src/assets/\n');

const publicDir = join(projectRoot, 'public');
const assetsDir = join(projectRoot, 'src', 'assets');

(async () => {
  try {
    console.log('📁 Optimizing public/ images...');
    await processDirectory(publicDir, publicDir);

    console.log('\n📁 Optimizing src/assets/ images...');
    await processDirectory(assetsDir, assetsDir);

    console.log('\n✅ Image optimization complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Review the optimized images');
    console.log('   2. Update image references to use WebP with PNG/JPG fallbacks');
    console.log('   3. Add width/height attributes to <img> tags');
  } catch (error) {
    console.error('❌ Error during optimization:', error);
    process.exit(1);
  }
})();
