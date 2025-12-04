/**
 * Image Optimization Script
 * 
 * This script optimizes images for web use by:
 * - Converting to WebP format with JPEG fallback
 * - Compressing images to reduce file size
 * - Generating responsive image sizes
 * - Creating optimized versions for different screen sizes
 * 
 * Usage: node scripts/optimize-images.js
 * 
 * Requirements:
 * - npm install sharp --save-dev
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Sharp is not installed. Please run: npm install sharp --save-dev');
  process.exit(1);
}

// Configuration
const CONFIG = {
  inputDir: path.join(__dirname, '../public/assets/images'),
  outputDir: path.join(__dirname, '../public/assets/images/optimized'),
  sizes: {
    thumbnail: 200,
    small: 400,
    medium: 800,
    large: 1200,
    xlarge: 1920,
  },
  quality: {
    webp: 85,
    jpeg: 85,
  },
  maxFileSize: 100 * 1024, // 100KB target
};

/**
 * Get all image files from a directory recursively
 */
function getImageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getImageFiles(filePath, fileList);
    } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Optimize a single image
 */
async function optimizeImage(inputPath) {
  const relativePath = path.relative(CONFIG.inputDir, inputPath);
  const parsedPath = path.parse(relativePath);
  const outputDir = path.join(CONFIG.outputDir, parsedPath.dir);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`\n📸 Optimizing: ${relativePath}`);

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    console.log(`   Original: ${metadata.width}x${metadata.height}, ${(metadata.size / 1024).toFixed(2)}KB`);

    // Generate WebP versions at different sizes
    for (const [sizeName, width] of Object.entries(CONFIG.sizes)) {
      // Skip if original is smaller than target size
      if (metadata.width < width) continue;

      const webpPath = path.join(
        outputDir,
        `${parsedPath.name}-${sizeName}.webp`
      );
      const jpegPath = path.join(
        outputDir,
        `${parsedPath.name}-${sizeName}.jpg`
      );

      // Generate WebP
      await image
        .clone()
        .resize(width, null, { withoutEnlargement: true })
        .webp({ quality: CONFIG.quality.webp })
        .toFile(webpPath);

      const webpStats = fs.statSync(webpPath);
      console.log(`   ✓ WebP ${sizeName}: ${width}px, ${(webpStats.size / 1024).toFixed(2)}KB`);

      // Generate JPEG fallback
      await image
        .clone()
        .resize(width, null, { withoutEnlargement: true })
        .jpeg({ quality: CONFIG.quality.jpeg, progressive: true })
        .toFile(jpegPath);

      const jpegStats = fs.statSync(jpegPath);
      console.log(`   ✓ JPEG ${sizeName}: ${width}px, ${(jpegStats.size / 1024).toFixed(2)}KB`);
    }

    console.log(`   ✅ Completed: ${relativePath}`);
  } catch (error) {
    console.error(`   ❌ Error optimizing ${relativePath}:`, error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting image optimization...\n');
  console.log(`Input directory: ${CONFIG.inputDir}`);
  console.log(`Output directory: ${CONFIG.outputDir}\n`);

  // Get all image files
  const imageFiles = getImageFiles(CONFIG.inputDir);

  if (imageFiles.length === 0) {
    console.log('⚠️  No images found to optimize.');
    return;
  }

  console.log(`Found ${imageFiles.length} images to optimize.\n`);

  // Optimize each image
  for (const imagePath of imageFiles) {
    await optimizeImage(imagePath);
  }

  console.log('\n✨ Image optimization complete!\n');
  console.log('📝 Next steps:');
  console.log('   1. Review optimized images in:', CONFIG.outputDir);
  console.log('   2. Update image paths in components to use optimized versions');
  console.log('   3. Implement responsive images with srcset');
  console.log('   4. Test images on different devices and screen sizes\n');
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
