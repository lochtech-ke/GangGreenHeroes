#!/usr/bin/env node

/**
 * Splash Screen Asset Optimization Script
 * 
 * This script helps optimize splash screen assets for production deployment.
 * It checks file sizes, provides optimization recommendations, and can
 * automatically optimize SVG files.
 * 
 * Requirements: 6.5, 7.5
 * 
 * Usage:
 *   node scripts/optimize-splash-assets.js [--optimize]
 * 
 * Options:
 *   --optimize    Automatically optimize SVG files using SVGO
 *   --check       Check file sizes and provide recommendations (default)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SPLASH_ASSETS_DIR = path.join(__dirname, '../public/assets/splash');
const MAX_TOTAL_SIZE = 500 * 1024; // 500KB
const MAX_SINGLE_ASSET_SIZE = 200 * 1024; // 200KB per asset

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Check if SVGO is installed
 */
function isSvgoInstalled() {
  try {
    execSync('npx svgo --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Optimize SVG file using SVGO
 */
function optimizeSvg(filePath) {
  try {
    console.log(`${colors.cyan}Optimizing: ${path.basename(filePath)}${colors.reset}`);
    
    const originalSize = getFileSize(filePath);
    
    // Create backup
    const backupPath = filePath + '.backup';
    fs.copyFileSync(filePath, backupPath);
    
    // Run SVGO
    execSync(`npx svgo "${filePath}" --multipass`, { stdio: 'inherit' });
    
    const optimizedSize = getFileSize(filePath);
    const savings = originalSize - optimizedSize;
    const savingsPercent = Math.round((savings / originalSize) * 100);
    
    console.log(`${colors.green}✓ Optimized: ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${savingsPercent}% smaller)${colors.reset}`);
    
    // Remove backup if optimization was successful
    fs.unlinkSync(backupPath);
    
    return { originalSize, optimizedSize, savings };
  } catch (error) {
    console.error(`${colors.red}✗ Failed to optimize ${path.basename(filePath)}: ${error.message}${colors.reset}`);
    
    // Restore backup if it exists
    const backupPath = filePath + '.backup';
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, filePath);
      fs.unlinkSync(backupPath);
    }
    
    return null;
  }
}

/**
 * Analyze splash screen assets
 */
function analyzeAssets() {
  console.log(`\n${colors.bright}${colors.blue}=== Splash Screen Asset Analysis ===${colors.reset}\n`);
  
  if (!fs.existsSync(SPLASH_ASSETS_DIR)) {
    console.error(`${colors.red}Error: Splash assets directory not found: ${SPLASH_ASSETS_DIR}${colors.reset}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(SPLASH_ASSETS_DIR);
  const assets = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.svg', '.gif', '.png', '.jpg', '.webp'].includes(ext);
  });
  
  if (assets.length === 0) {
    console.log(`${colors.yellow}No image assets found in ${SPLASH_ASSETS_DIR}${colors.reset}`);
    return { totalSize: 0, assets: [] };
  }
  
  let totalSize = 0;
  const assetInfo = [];
  
  console.log(`${colors.bright}Asset Sizes:${colors.reset}\n`);
  
  assets.forEach(asset => {
    const filePath = path.join(SPLASH_ASSETS_DIR, asset);
    const size = getFileSize(filePath);
    totalSize += size;
    
    const status = size > MAX_SINGLE_ASSET_SIZE 
      ? `${colors.red}⚠ TOO LARGE${colors.reset}`
      : `${colors.green}✓ OK${colors.reset}`;
    
    console.log(`  ${asset.padEnd(35)} ${formatBytes(size).padStart(12)} ${status}`);
    
    assetInfo.push({ name: asset, path: filePath, size });
  });
  
  console.log(`\n${colors.bright}Total Size:${colors.reset} ${formatBytes(totalSize)}`);
  
  if (totalSize > MAX_TOTAL_SIZE) {
    console.log(`${colors.red}⚠ WARNING: Total size exceeds target of ${formatBytes(MAX_TOTAL_SIZE)}${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Total size is within target of ${formatBytes(MAX_TOTAL_SIZE)}${colors.reset}`);
  }
  
  return { totalSize, assets: assetInfo };
}

/**
 * Provide optimization recommendations
 */
function provideRecommendations(assetInfo) {
  console.log(`\n${colors.bright}${colors.blue}=== Optimization Recommendations ===${colors.reset}\n`);
  
  const svgAssets = assetInfo.assets.filter(a => a.name.endsWith('.svg'));
  const gifAssets = assetInfo.assets.filter(a => a.name.endsWith('.gif'));
  const pngAssets = assetInfo.assets.filter(a => a.name.endsWith('.png'));
  
  if (svgAssets.length > 0) {
    console.log(`${colors.cyan}SVG Files:${colors.reset}`);
    console.log(`  • Run with --optimize flag to automatically optimize SVG files`);
    console.log(`  • Or manually: npx svgo public/assets/splash/*.svg --multipass\n`);
  }
  
  if (gifAssets.length > 0) {
    console.log(`${colors.cyan}GIF Files:${colors.reset}`);
    console.log(`  • Use Gifsicle: gifsicle -O3 --colors 128 input.gif -o output.gif`);
    console.log(`  • Or use online tool: https://ezgif.com/optimize`);
    console.log(`  • Target: < 500KB per GIF\n`);
  }
  
  if (pngAssets.length > 0) {
    console.log(`${colors.cyan}PNG Files:${colors.reset}`);
    console.log(`  • Use ImageOptim (Mac) or TinyPNG (Web)`);
    console.log(`  • Or use: npx imagemin public/assets/splash/*.png --out-dir=public/assets/splash\n`);
  }
  
  console.log(`${colors.cyan}General Tips:${colors.reset}`);
  console.log(`  • Keep total assets under ${formatBytes(MAX_TOTAL_SIZE)}`);
  console.log(`  • Use SVG for vector graphics (best quality/size ratio)`);
  console.log(`  • Use WebP for photos (better compression than PNG/JPG)`);
  console.log(`  • Avoid GIF if possible (large file sizes)`);
  console.log(`  • Consider Lottie for complex animations\n`);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const shouldOptimize = args.includes('--optimize');
  
  console.log(`${colors.bright}${colors.green}Splash Screen Asset Optimizer${colors.reset}`);
  console.log(`${colors.cyan}Requirements: 6.5, 7.5${colors.reset}`);
  
  // Analyze current assets
  const assetInfo = analyzeAssets();
  
  if (assetInfo.assets.length === 0) {
    return;
  }
  
  // Optimize if requested
  if (shouldOptimize) {
    console.log(`\n${colors.bright}${colors.blue}=== Optimizing Assets ===${colors.reset}\n`);
    
    if (!isSvgoInstalled()) {
      console.log(`${colors.yellow}SVGO not found. Installing...${colors.reset}`);
      try {
        execSync('npm install -g svgo', { stdio: 'inherit' });
      } catch (error) {
        console.error(`${colors.red}Failed to install SVGO. Please install manually: npm install -g svgo${colors.reset}`);
        process.exit(1);
      }
    }
    
    const svgAssets = assetInfo.assets.filter(a => a.name.endsWith('.svg'));
    
    if (svgAssets.length === 0) {
      console.log(`${colors.yellow}No SVG files to optimize${colors.reset}`);
    } else {
      let totalSavings = 0;
      
      svgAssets.forEach(asset => {
        const result = optimizeSvg(asset.path);
        if (result) {
          totalSavings += result.savings;
        }
      });
      
      console.log(`\n${colors.green}${colors.bright}Total savings: ${formatBytes(totalSavings)}${colors.reset}\n`);
    }
    
    // Re-analyze after optimization
    console.log(`\n${colors.bright}After Optimization:${colors.reset}`);
    analyzeAssets();
  } else {
    // Provide recommendations
    provideRecommendations(assetInfo);
  }
  
  console.log(`\n${colors.bright}Done!${colors.reset}\n`);
}

// Run main function
main();
