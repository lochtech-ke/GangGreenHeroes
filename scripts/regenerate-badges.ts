/**
 * Badge Regeneration Script
 * Generates all 25 badge variations (5 types × 5 tiers) and saves them
 */

import { generateBadgeSVG, getBadgeTypes, getBadgeTiers, type BadgeConfig } from '../src/utils/badgeGenerator';
import * as fs from 'fs';
import * as path from 'path';

// Badge type display names
const BADGE_NAMES: Record<BadgeConfig['type'], string> = {
  'tree-planter': 'Tree Planter',
  'forest-guardian': 'Forest Guardian',
  'carbon-champion': 'Carbon Champion',
  'eco-warrior': 'Eco Warrior',
  'green-pioneer': 'Green Pioneer'
};

// Sample values for each tier
const TIER_VALUES: Record<BadgeConfig['tier'], Record<BadgeConfig['type'], number>> = {
  bronze: {
    'tree-planter': 10,
    'forest-guardian': 1,
    'carbon-champion': 100,
    'eco-warrior': 1000,
    'green-pioneer': 5
  },
  silver: {
    'tree-planter': 50,
    'forest-guardian': 3,
    'carbon-champion': 500,
    'eco-warrior': 5000,
    'green-pioneer': 10
  },
  gold: {
    'tree-planter': 100,
    'forest-guardian': 5,
    'carbon-champion': 1000,
    'eco-warrior': 10000,
    'green-pioneer': 20
  },
  platinum: {
    'tree-planter': 500,
    'forest-guardian': 10,
    'carbon-champion': 5000,
    'eco-warrior': 25000,
    'green-pioneer': 30
  },
  diamond: {
    'tree-planter': 1000,
    'forest-guardian': 20,
    'carbon-champion': 10000,
    'eco-warrior': 50000,
    'green-pioneer': 50
  }
};

async function regenerateAllBadges() {
  console.log('🎨 Starting badge regeneration...\n');

  const types = getBadgeTypes();
  const tiers = getBadgeTiers();
  
  // Create output directory
  const outputDir = path.join(process.cwd(), 'public', 'badges');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let totalGenerated = 0;
  const manifest: Array<{
    type: string;
    tier: string;
    name: string;
    filename: string;
    value: number;
  }> = [];

  // Generate all combinations
  for (const type of types) {
    console.log(`\n📦 Generating ${BADGE_NAMES[type]} badges...`);
    
    for (const tier of tiers) {
      const config: BadgeConfig = {
        type,
        tier,
        name: BADGE_NAMES[type],
        value: TIER_VALUES[tier][type]
      };

      try {
        // Generate SVG
        const svg = generateBadgeSVG(config);
        
        // Save to file
        const filename = `badge-${type}-${tier}.svg`;
        const filepath = path.join(outputDir, filename);
        fs.writeFileSync(filepath, svg, 'utf-8');
        
        // Add to manifest
        manifest.push({
          type,
          tier,
          name: BADGE_NAMES[type],
          filename,
          value: config.value || 0
        });

        totalGenerated++;
        console.log(`  ✅ ${tier.toUpperCase()} - ${filename}`);
      } catch (error) {
        console.error(`  ❌ Failed to generate ${tier} ${type}:`, error);
      }
    }
  }

  // Save manifest
  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\n📋 Manifest saved to ${manifestPath}`);

  // Generate index HTML for preview
  const indexHtml = generatePreviewHTML(manifest);
  const indexPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(indexPath, indexHtml, 'utf-8');
  console.log(`📄 Preview page saved to ${indexPath}`);

  console.log(`\n✨ Successfully generated ${totalGenerated} badges!`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`\n🌐 View badges at: http://localhost:5173/badges/index.html`);
}

function generatePreviewHTML(manifest: any[]): string {
  const badgesByType = manifest.reduce((acc, badge) => {
    if (!acc[badge.type]) acc[badge.type] = [];
    acc[badge.type].push(badge);
    return acc;
  }, {} as Record<string, any[]>);

  const sections = Object.entries(badgesByType).map(([type, badges]) => {
    const badgeCards = badges.map(badge => `
      <div class="badge-card">
        <img src="${badge.filename}" alt="${badge.name} - ${badge.tier}" />
        <div class="badge-info">
          <h3>${badge.tier.toUpperCase()}</h3>
          <p>${badge.name}</p>
          <span class="badge-value">${badge.value.toLocaleString()}</span>
        </div>
      </div>
    `).join('');

    return `
      <section class="badge-section">
        <h2>${badges[0].name}</h2>
        <div class="badge-grid">
          ${badgeCards}
        </div>
      </section>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>#GangGreen NFT Badges - Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 2rem;
      min-height: 100vh;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 3rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 3px solid #667eea;
    }

    h1 {
      font-size: 3rem;
      color: #667eea;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      font-size: 1.2rem;
      color: #666;
    }

    .badge-section {
      margin-bottom: 4rem;
    }

    .badge-section h2 {
      font-size: 2rem;
      color: #764ba2;
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #eee;
    }

    .badge-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 2rem;
    }

    .badge-card {
      background: #f8f9fa;
      border-radius: 15px;
      padding: 1.5rem;
      text-align: center;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      border: 2px solid transparent;
    }

    .badge-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      border-color: #667eea;
    }

    .badge-card img {
      width: 100%;
      height: auto;
      border-radius: 10px;
      margin-bottom: 1rem;
    }

    .badge-info h3 {
      font-size: 1.1rem;
      color: #667eea;
      margin-bottom: 0.25rem;
    }

    .badge-info p {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .badge-value {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: bold;
    }

    .stats {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 15px;
      margin-bottom: 3rem;
      text-align: center;
    }

    .stats h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .stat-item {
      background: rgba(255, 255, 255, 0.2);
      padding: 1rem;
      border-radius: 10px;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      display: block;
    }

    .stat-label {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 2px solid #eee;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🌳 #GangGreen NFT Badges</h1>
      <p class="subtitle">Dynamic Geometric Badge Collection</p>
    </header>

    <div class="stats">
      <h3>📊 Collection Stats</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">${manifest.length}</span>
          <span class="stat-label">Total Badges</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${Object.keys(badgesByType).length}</span>
          <span class="stat-label">Badge Types</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">5</span>
          <span class="stat-label">Tier Levels</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">SVG</span>
          <span class="stat-label">Format</span>
        </div>
      </div>
    </div>

    ${sections}

    <footer>
      <p><strong>#GangGreen Platform</strong> - Carbon-Negative Africa Initiative</p>
      <p>MIT License © 2025 Loch Tech Solutions</p>
    </footer>
  </div>
</body>
</html>`;
}

// Run the script
regenerateAllBadges().catch(console.error);
