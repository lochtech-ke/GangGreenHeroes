/**
 * Dynamic SVG Badge Generator
 * Creates geometric/low-poly style badges for NFT rewards
 */

export interface BadgeConfig {
  type: 'tree-planter' | 'forest-guardian' | 'carbon-champion' | 'eco-warrior' | 'green-pioneer';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  name: string;
  value?: number; // trees planted, carbon offset, etc.
}

interface ColorScheme {
  primary: string[];
  secondary: string[];
  accent: string[];
  background: string;
}

const COLOR_SCHEMES: Record<BadgeConfig['tier'], ColorScheme> = {
  bronze: {
    primary: ['#CD7F32', '#B87333', '#A0522D'],
    secondary: ['#8B4513', '#D2691E', '#C19A6B'],
    accent: ['#FFD700', '#FFA500', '#FF8C00'],
    background: '#F5F5DC'
  },
  silver: {
    primary: ['#C0C0C0', '#A8A8A8', '#909090'],
    secondary: ['#D3D3D3', '#B8B8B8', '#A0A0A0'],
    accent: ['#E8E8E8', '#F0F0F0', '#FFFFFF'],
    background: '#F8F8FF'
  },
  gold: {
    primary: ['#FFD700', '#FFC700', '#FFB700'],
    secondary: ['#FFED4E', '#FFE135', '#FFD700'],
    accent: ['#FFA500', '#FF8C00', '#FF7F00'],
    background: '#FFFACD'
  },
  platinum: {
    primary: ['#E5E4E2', '#D1D0CE', '#BCC6CC'],
    secondary: ['#C9C0BB', '#B4B4B4', '#A8A8A8'],
    accent: ['#00CED1', '#20B2AA', '#48D1CC'],
    background: '#F0F8FF'
  },
  diamond: {
    primary: ['#B9F2FF', '#00CED1', '#4169E1'],
    secondary: ['#1E90FF', '#4682B4', '#5F9EA0'],
    accent: ['#FF1493', '#FF69B4', '#FFB6C1'],
    background: '#E0FFFF'
  }
};

const BADGE_ICONS: Record<BadgeConfig['type'], string> = {
  'tree-planter': 'tree',
  'forest-guardian': 'shield',
  'carbon-champion': 'leaf',
  'eco-warrior': 'star',
  'green-pioneer': 'mountain'
};

/**
 * Generate geometric tree shape
 */
function generateTreeGeometry(colors: string[]): string {
  return `
    <!-- Tree Crown - Geometric Triangles -->
    <polygon points="200,80 160,140 240,140" fill="${colors[0]}" opacity="0.9"/>
    <polygon points="200,100 150,160 250,160" fill="${colors[1]}" opacity="0.85"/>
    <polygon points="200,120 140,180 260,180" fill="${colors[2]}" opacity="0.8"/>
    <polygon points="160,140 180,160 200,140" fill="${colors[0]}" opacity="0.95"/>
    <polygon points="200,140 220,160 240,140" fill="${colors[1]}" opacity="0.95"/>
    
    <!-- Tree Trunk - Geometric Rectangles -->
    <polygon points="190,180 210,180 215,260 185,260" fill="#8B4513" opacity="0.9"/>
    <polygon points="195,200 205,200 208,240 192,240" fill="#A0522D" opacity="0.85"/>
  `;
}

/**
 * Generate geometric shield shape
 */
function generateShieldGeometry(colors: string[]): string {
  return `
    <!-- Shield Outline -->
    <path d="M 200,60 L 280,100 L 280,200 Q 280,260 200,300 Q 120,260 120,200 L 120,100 Z" 
          fill="${colors[0]}" opacity="0.9"/>
    
    <!-- Shield Facets -->
    <polygon points="200,60 240,80 200,120 160,80" fill="${colors[1]}" opacity="0.95"/>
    <polygon points="160,80 200,120 200,180 140,140" fill="${colors[2]}" opacity="0.85"/>
    <polygon points="240,80 260,140 200,180 200,120" fill="${colors[1]}" opacity="0.85"/>
    <polygon points="140,140 200,180 200,240 130,200" fill="${colors[0]}" opacity="0.8"/>
    <polygon points="260,140 270,200 200,240 200,180" fill="${colors[2]}" opacity="0.8"/>
    <polygon points="200,180 200,240 160,270 140,220" fill="${colors[1]}" opacity="0.75"/>
    <polygon points="200,180 240,220 240,270 200,240" fill="${colors[0]}" opacity="0.75"/>
  `;
}

/**
 * Generate geometric leaf shape
 */
function generateLeafGeometry(colors: string[]): string {
  return `
    <!-- Leaf Body - Geometric Facets -->
    <path d="M 200,80 Q 260,120 280,200 Q 260,260 200,280 Q 180,260 180,200 Q 180,120 200,80 Z" 
          fill="${colors[0]}" opacity="0.9"/>
    
    <!-- Leaf Veins and Facets -->
    <polygon points="200,80 220,120 200,160 180,120" fill="${colors[1]}" opacity="0.95"/>
    <polygon points="200,160 230,180 240,220 200,240" fill="${colors[2]}" opacity="0.85"/>
    <polygon points="200,160 170,180 160,220 200,240" fill="${colors[1]}" opacity="0.85"/>
    <polygon points="200,240 220,260 200,280 180,260" fill="${colors[0]}" opacity="0.8"/>
    
    <!-- Stem -->
    <line x1="200" y1="280" x2="200" y2="320" stroke="${colors[2]}" stroke-width="4" opacity="0.9"/>
  `;
}

/**
 * Generate geometric star shape
 */
function generateStarGeometry(colors: string[]): string {
  return `
    <!-- Star Points - Geometric -->
    <polygon points="200,60 220,140 280,140 230,180 250,260 200,220 150,260 170,180 120,140 180,140" 
             fill="${colors[0]}" opacity="0.9"/>
    
    <!-- Inner Facets -->
    <polygon points="200,60 210,100 200,140 190,100" fill="${colors[1]}" opacity="0.95"/>
    <polygon points="200,140 230,160 220,180 200,170" fill="${colors[2]}" opacity="0.9"/>
    <polygon points="200,140 170,160 180,180 200,170" fill="${colors[1]}" opacity="0.9"/>
    <polygon points="200,170 220,180 210,220 200,200" fill="${colors[0]}" opacity="0.85"/>
    <polygon points="200,170 180,180 190,220 200,200" fill="${colors[2]}" opacity="0.85"/>
  `;
}

/**
 * Generate geometric mountain shape
 */
function generateMountainGeometry(colors: string[]): string {
  return `
    <!-- Mountain Peaks - Geometric Triangles -->
    <polygon points="200,80 280,260 120,260" fill="${colors[0]}" opacity="0.9"/>
    <polygon points="200,80 240,180 200,200" fill="${colors[1]}" opacity="0.95"/>
    <polygon points="200,80 160,180 200,200" fill="${colors[2]}" opacity="0.95"/>
    <polygon points="160,180 200,200 120,260" fill="${colors[1]}" opacity="0.85"/>
    <polygon points="240,180 280,260 200,200" fill="${colors[0]}" opacity="0.85"/>
    
    <!-- Snow Cap -->
    <polygon points="200,80 210,100 190,100" fill="#FFFFFF" opacity="0.9"/>
    <polygon points="190,100 210,100 205,120 195,120" fill="#E0E0E0" opacity="0.85"/>
  `;
}

/**
 * Generate background geometric pattern
 */
function generateBackgroundPattern(bgColor: string, accentColors: string[]): string {
  return `
    <defs>
      <pattern id="bgPattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <polygon points="0,0 40,20 0,40" fill="${accentColors[0]}" opacity="0.1"/>
        <polygon points="40,20 80,0 80,40" fill="${accentColors[1]}" opacity="0.1"/>
        <polygon points="0,40 40,60 0,80" fill="${accentColors[2]}" opacity="0.1"/>
        <polygon points="40,60 80,40 80,80" fill="${accentColors[0]}" opacity="0.1"/>
      </pattern>
    </defs>
    <rect width="400" height="400" fill="${bgColor}"/>
    <rect width="400" height="400" fill="url(#bgPattern)"/>
  `;
}

/**
 * Generate decorative border
 */
function generateBorder(colors: string[]): string {
  return `
    <rect x="10" y="10" width="380" height="380" 
          fill="none" stroke="${colors[0]}" stroke-width="3" opacity="0.6"/>
    <rect x="15" y="15" width="370" height="370" 
          fill="none" stroke="${colors[1]}" stroke-width="2" opacity="0.4"/>
  `;
}

/**
 * Generate badge text
 */
function generateText(config: BadgeConfig, colors: string[]): string {
  const tierText = config.tier.toUpperCase();
  const nameText = config.name;
  const valueText = config.value ? `${config.value.toLocaleString()}` : '';
  
  return `
    <!-- Tier Badge -->
    <rect x="150" y="330" width="100" height="30" rx="15" 
          fill="${colors[0]}" opacity="0.9"/>
    <text x="200" y="350" font-family="Arial, sans-serif" font-size="14" 
          font-weight="bold" fill="#FFFFFF" text-anchor="middle">
      ${tierText}
    </text>
    
    <!-- Badge Name -->
    <text x="200" y="375" font-family="Arial, sans-serif" font-size="12" 
          fill="${colors[1]}" text-anchor="middle" opacity="0.8">
      ${nameText}
    </text>
    
    ${valueText ? `
    <!-- Value Display -->
    <text x="200" y="390" font-family="Arial, sans-serif" font-size="16" 
          font-weight="bold" fill="${colors[0]}" text-anchor="middle">
      ${valueText}
    </text>
    ` : ''}
  `;
}

/**
 * Main badge generation function
 */
export function generateBadgeSVG(config: BadgeConfig): string {
  const colorScheme = COLOR_SCHEMES[config.tier];
  
  let iconGeometry = '';
  switch (config.type) {
    case 'tree-planter':
      iconGeometry = generateTreeGeometry(colorScheme.primary);
      break;
    case 'forest-guardian':
      iconGeometry = generateShieldGeometry(colorScheme.primary);
      break;
    case 'carbon-champion':
      iconGeometry = generateLeafGeometry(colorScheme.primary);
      break;
    case 'eco-warrior':
      iconGeometry = generateStarGeometry(colorScheme.primary);
      break;
    case 'green-pioneer':
      iconGeometry = generateMountainGeometry(colorScheme.primary);
      break;
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  ${generateBackgroundPattern(colorScheme.background, colorScheme.accent)}
  ${generateBorder(colorScheme.secondary)}
  ${iconGeometry}
  ${generateText(config, colorScheme.primary)}
</svg>`;
}

/**
 * Generate badge as data URL for immediate use
 */
export function generateBadgeDataURL(config: BadgeConfig): string {
  const svg = generateBadgeSVG(config);
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Get all available badge types
 */
export function getBadgeTypes(): BadgeConfig['type'][] {
  return ['tree-planter', 'forest-guardian', 'carbon-champion', 'eco-warrior', 'green-pioneer'];
}

/**
 * Get all available tiers
 */
export function getBadgeTiers(): BadgeConfig['tier'][] {
  return ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
}
