import { generateBadgeSVG, type BadgeConfig } from './badgeGenerator';

/**
 * Download badge as SVG file
 */
export function downloadBadgeSVG(config: BadgeConfig): void {
  const svg = generateBadgeSVG(config);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `badge-${config.type}-${config.tier}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert SVG to PNG using canvas
 */
export async function convertSVGtoPNG(
  config: BadgeConfig,
  size: number = 1024
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const svg = generateBadgeSVG(config);
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert to PNG'));
        }
      }, 'image/png');
    };

    img.onerror = () => reject(new Error('Failed to load SVG'));
    
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
    img.src = URL.createObjectURL(svgBlob);
  });
}

/**
 * Download badge as PNG file
 */
export async function downloadBadgePNG(
  config: BadgeConfig,
  size: number = 1024
): Promise<void> {
  try {
    const blob = await convertSVGtoPNG(config, size);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `badge-${config.type}-${config.tier}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PNG:', error);
    throw error;
  }
}

/**
 * Copy badge SVG to clipboard
 */
export async function copyBadgeToClipboard(config: BadgeConfig): Promise<void> {
  try {
    const svg = generateBadgeSVG(config);
    await navigator.clipboard.writeText(svg);
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    throw error;
  }
}

/**
 * Generate badge for IPFS upload (returns blob and metadata)
 */
export async function prepareBadgeForIPFS(config: BadgeConfig): Promise<{
  imageBlob: Blob;
  metadata: any;
}> {
  const svg = generateBadgeSVG(config);
  const imageBlob = new Blob([svg], { type: 'image/svg+xml' });

  const metadata = {
    name: `${config.tier.charAt(0).toUpperCase() + config.tier.slice(1)} ${config.name}`,
    description: `#GangGreen NFT Badge - ${config.name}`,
    image: '', // Will be filled with IPFS hash
    attributes: [
      { trait_type: 'Type', value: config.name },
      { trait_type: 'Tier', value: config.tier },
      { trait_type: 'Value', value: config.value || 0 }
    ]
  };

  return { imageBlob, metadata };
}

/**
 * Batch generate all badge variations
 */
export function generateAllBadgeVariations(): Array<{
  config: BadgeConfig;
  svg: string;
}> {
  const types: BadgeConfig['type'][] = [
    'tree-planter',
    'forest-guardian',
    'carbon-champion',
    'eco-warrior',
    'green-pioneer'
  ];
  
  const tiers: BadgeConfig['tier'][] = [
    'bronze',
    'silver',
    'gold',
    'platinum',
    'diamond'
  ];

  const badges: Array<{ config: BadgeConfig; svg: string }> = [];

  types.forEach(type => {
    tiers.forEach(tier => {
      const config: BadgeConfig = {
        type,
        tier,
        name: type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        value: 100
      };
      
      badges.push({
        config,
        svg: generateBadgeSVG(config)
      });
    });
  });

  return badges;
}

/**
 * Download all badges as a ZIP (requires JSZip library)
 */
export async function downloadAllBadgesAsZip(): Promise<void> {
  // This would require JSZip library
  // For now, just download individually
  const badges = generateAllBadgeVariations();
  
  for (const { config } of badges) {
    downloadBadgeSVG(config);
    // Add delay to prevent browser blocking
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
