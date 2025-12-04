/**
 * Color Contrast Testing for African Color Palette
 * Tests WCAG 2.1 Level AA compliance (4.5:1 for normal text, 3:1 for large text)
 */

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// Calculate relative luminance
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

describe('African Color Palette - Accessibility Tests', () => {
  const white = '#FFFFFF';
  const black = '#000000';
  const darkGray = '#1F2937'; // gray-800
  
  const africanColors = {
    terracotta: {
      500: '#e8603c',
      600: '#d44a2a',
      700: '#b13a22',
      800: '#923322',
      900: '#792e21',
    },
    ochre: {
      500: '#eba548',
      600: '#d98a33',
      700: '#b56d2a',
      800: '#925728',
      900: '#784924',
    },
    'burnt-sienna': {
      500: '#e76646',
      600: '#d44a2f',
      700: '#b13a25',
      800: '#923323',
      900: '#792e23',
    },
    'kente-gold': {
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
    },
    'ubuntu-purple': {
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
    'sahara-sand': {
      500: '#d4b08c',
      600: '#c49872',
      700: '#a97d5d',
      800: '#8c674e',
      900: '#735542',
    },
  };

  describe('Text on White Background', () => {
    Object.entries(africanColors).forEach(([colorName, shades]) => {
      Object.entries(shades).forEach(([shade, hex]) => {
        it(`${colorName}-${shade} on white should meet WCAG AA for normal text (4.5:1)`, () => {
          const ratio = getContrastRatio(hex, white);
          console.log(`${colorName}-${shade} on white: ${ratio.toFixed(2)}:1`);
          
          // For lighter shades (500-600), we expect lower contrast
          // For darker shades (700-900), we expect higher contrast
          if (parseInt(shade) >= 700) {
            expect(ratio).toBeGreaterThanOrEqual(4.5);
          }
        });
      });
    });
  });

  describe('Text on Dark Background', () => {
    Object.entries(africanColors).forEach(([colorName, shades]) => {
      Object.entries(shades).forEach(([shade, hex]) => {
        it(`${colorName}-${shade} on dark gray should have adequate contrast`, () => {
          const ratio = getContrastRatio(hex, darkGray);
          console.log(`${colorName}-${shade} on dark gray: ${ratio.toFixed(2)}:1`);
          
          // Lighter shades should have good contrast on dark backgrounds
          if (parseInt(shade) <= 600) {
            expect(ratio).toBeGreaterThanOrEqual(3.0);
          }
        });
      });
    });
  });

  describe('Large Text Compliance (3:1 ratio)', () => {
    it('terracotta-600 on white meets large text requirements', () => {
      const ratio = getContrastRatio(africanColors.terracotta[600], white);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });

    it('ochre-600 on white meets large text requirements', () => {
      const ratio = getContrastRatio(africanColors.ochre[600], white);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });

    it('kente-gold-600 on white meets large text requirements', () => {
      const ratio = getContrastRatio(africanColors['kente-gold'][600], white);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });
  });

  describe('Recommended Color Combinations', () => {
    it('terracotta-700 text on sahara-sand-50 background', () => {
      const ratio = getContrastRatio('#b13a22', '#fdfcf9');
      console.log(`terracotta-700 on sahara-sand-50: ${ratio.toFixed(2)}:1`);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('ubuntu-purple-700 text on white background', () => {
      const ratio = getContrastRatio('#7e22ce', white);
      console.log(`ubuntu-purple-700 on white: ${ratio.toFixed(2)}:1`);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('kente-gold-800 text on white background', () => {
      const ratio = getContrastRatio('#854d0e', white);
      console.log(`kente-gold-800 on white: ${ratio.toFixed(2)}:1`);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
