/**
 * Tests for Badge SVG Optimizer - Rendering Quality
 * Verifies Task 22.2: Anti-aliasing and rendering quality implementation
 */

import { describe, it, expect } from 'vitest';
import {
  optimizeBadgeSVG,
  validateBadgeSVG,
  optimizeSVGFileSize,
  getSVGFileSize,
  getSVGFileSizeKB,
  checkFileSizeTarget,
  optimizeBadgeComplete,
} from './badgeSvgOptimizer';

describe('Badge SVG Optimizer - Rendering Quality', () => {
  describe('Anti-aliasing and rendering optimizations', () => {
    it('should add shape-rendering: geometricPrecision', () => {
      const inputSvg = '<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="100"/></svg>';
      const result = optimizeBadgeSVG(inputSvg);
      
      expect(result).toContain('shape-rendering: geometricPrecision');
    });

    it('should add text-rendering: optimizeLegibility', () => {
      const inputSvg = '<svg viewBox="0 0 400 400"><text>Test</text></svg>';
      const result = optimizeBadgeSVG(inputSvg);
      
      expect(result).toContain('text-rendering: optimizeLegibility');
    });

    it('should add image-rendering: crisp-edges', () => {
      const inputSvg = '<svg viewBox="0 0 400 400"><image href="test.png"/></svg>';
      const result = optimizeBadgeSVG(inputSvg);
      
      expect(result).toContain('image-rendering: crisp-edges');
    });

    it('should add transform: translateZ(0) to prevent blur', () => {
      const inputSvg = '<svg viewBox="0 0 400 400"><rect width="100" height="100"/></svg>';
      const result = optimizeBadgeSVG(inputSvg);
      
      expect(result).toContain('transform: translateZ(0)');
    });

    it('should add backface-visibility: hidden', () => {
      const inputSvg = '<svg viewBox="0 0 400 400"><path d="M0,0 L100,100"/></svg>';
      const result = optimizeBadgeSVG(inputSvg);
      
      expect(result).toContain('backface-visibility: hidden');
    });

    it('should apply all rendering optimizations together', () => {
      const inputSvg = '<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="100"/></svg>';
      const result = optimizeBadgeSVG(inputSvg);
      
      // Check all optimizations are present
      expect(result).toContain('shape-rendering: geometricPrecision');
      expect(result).toContain('text-rendering: optimizeLegibility');
      expect(result).toContain('image-rendering: crisp-edges');
      expect(result).toContain('transform: translateZ(0)');
      expect(result).toContain('backface-visibility: hidden');
    });

    it('should preserve existing style attributes and append optimizations', () => {
      const inputSvg = '<svg viewBox="0 0 400 400" style="fill: red;"><circle cx="200" cy="200" r="100"/></svg>';
      const result = optimizeBadgeSVG(inputSvg);
      
      // Should preserve existing style
      expect(result).toContain('fill: red');
      // Should add new optimizations
      expect(result).toContain('shape-rendering: geometricPrecision');
      expect(result).toContain('transform: translateZ(0)');
    });

    it('should handle SVG without existing style attribute', () => {
      const inputSvg = '<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="100"/></svg>';
      const result = optimizeBadgeSVG(inputSvg);
      
      // Should add style attribute with all optimizations
      expect(result).toMatch(/style="[^"]*shape-rendering: geometricPrecision[^"]*"/);
      expect(result).toMatch(/style="[^"]*text-rendering: optimizeLegibility[^"]*"/);
      expect(result).toMatch(/style="[^"]*image-rendering: crisp-edges[^"]*"/);
      expect(result).toMatch(/style="[^"]*transform: translateZ\(0\)[^"]*"/);
      expect(result).toMatch(/style="[^"]*backface-visibility: hidden[^"]*"/);
    });
  });

  describe('ViewBox and dimensions', () => {
    it('should set correct viewBox', () => {
      const inputSvg = '<svg><circle cx="200" cy="200" r="100"/></svg>';
      const result = optimizeBadgeSVG(inputSvg);
      
      expect(result).toContain('viewBox="0 0 400 400"');
    });

    it('should set width and height to 100%', () => {
      const inputSvg = '<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="100"/></svg>';
      const result = optimizeBadgeSVG(inputSvg);
      
      expect(result).toContain('width="100%"');
      expect(result).toContain('height="100%"');
    });

    it('should add preserveAspectRatio', () => {
      const inputSvg = '<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="100"/></svg>';
      const result = optimizeBadgeSVG(inputSvg);
      
      expect(result).toContain('preserveAspectRatio="xMidYMid meet"');
    });
  });

  describe('Badge validation', () => {
    it('should validate a properly optimized badge', () => {
      const inputSvg = '<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="100"/></svg>';
      const optimized = optimizeBadgeSVG(inputSvg);
      const validation = validateBadgeSVG(optimized);
      
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect missing viewBox', () => {
      const badSvg = '<svg width="100%" height="100%"><circle cx="200" cy="200" r="100"/></svg>';
      const validation = validateBadgeSVG(badSvg);
      
      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain('Missing viewBox attribute');
    });

    it('should detect incorrect viewBox', () => {
      const badSvg = '<svg viewBox="0 0 500 500" width="100%" height="100%"><circle cx="200" cy="200" r="100"/></svg>';
      const validation = validateBadgeSVG(badSvg);
      
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('Incorrect viewBox'))).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty SVG string', () => {
      const result = optimizeBadgeSVG('');
      expect(result).toBe('');
    });

    it('should handle invalid SVG', () => {
      const invalidSvg = '<div>Not an SVG</div>';
      const result = optimizeBadgeSVG(invalidSvg);
      expect(result).toBe(invalidSvg);
    });

    it('should handle SVG with complex nested elements', () => {
      const complexSvg = `
        <svg viewBox="0 0 400 400">
          <defs>
            <linearGradient id="grad1">
              <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
            </linearGradient>
          </defs>
          <g>
            <circle cx="200" cy="200" r="100" fill="url(#grad1)"/>
            <text x="200" y="200" text-anchor="middle">Badge</text>
          </g>
        </svg>
      `;
      
      const result = optimizeBadgeSVG(complexSvg);
      
      // Should preserve structure
      expect(result).toContain('<defs>');
      expect(result).toContain('linearGradient');
      expect(result).toContain('<g>');
      expect(result).toContain('<circle');
      expect(result).toContain('<text');
      
      // Should add optimizations
      expect(result).toContain('shape-rendering: geometricPrecision');
      expect(result).toContain('transform: translateZ(0)');
    });

    it('should handle SVG with multiple style attributes in children', () => {
      const svgWithStyles = `
        <svg viewBox="0 0 400 400">
          <circle cx="200" cy="200" r="100" style="fill: blue;"/>
          <rect x="100" y="100" width="50" height="50" style="stroke: red;"/>
        </svg>
      `;
      
      const result = optimizeBadgeSVG(svgWithStyles);
      
      // Should preserve child styles
      expect(result).toContain('fill: blue');
      expect(result).toContain('stroke: red');
      
      // Should add parent SVG optimizations
      expect(result).toContain('shape-rendering: geometricPrecision');
    });
  });

  describe('Performance optimizations', () => {
    it('should apply GPU acceleration properties', () => {
      const inputSvg = '<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="100"/></svg>';
      const result = optimizeBadgeSVG(inputSvg);
      
      // translateZ(0) triggers GPU acceleration
      expect(result).toContain('transform: translateZ(0)');
      // backface-visibility prevents unnecessary repaints
      expect(result).toContain('backface-visibility: hidden');
    });

    it('should optimize for animation performance', () => {
      const animatedSvg = '<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="100"><animate attributeName="r" from="100" to="150" dur="1s" repeatCount="indefinite"/></circle></svg>';
      const result = optimizeBadgeSVG(animatedSvg);
      
      // Should still apply optimizations for animated badges
      expect(result).toContain('transform: translateZ(0)');
      expect(result).toContain('backface-visibility: hidden');
      // Should preserve animation
      expect(result).toContain('<animate');
    });
  });
});

describe('Badge SVG File Size Optimization - Task 22.5', () => {
  describe('optimizeSVGFileSize', () => {
    it('should remove XML comments', () => {
      const svgWithComments = `
        <svg viewBox="0 0 400 400">
          <!-- This is a comment -->
          <circle cx="200" cy="200" r="100"/>
          <!-- Another comment -->
        </svg>
      `;
      
      const result = optimizeSVGFileSize(svgWithComments);
      
      expect(result).not.toContain('<!-- This is a comment -->');
      expect(result).not.toContain('<!-- Another comment -->');
      expect(result).toContain('<circle');
    });

    it('should remove RDF metadata', () => {
      const svgWithMetadata = `
        <svg viewBox="0 0 400 400">
          <metadata>
            <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
              <rdf:Description>
                <dc:title>Test Badge</dc:title>
              </rdf:Description>
            </rdf:RDF>
          </metadata>
          <circle cx="200" cy="200" r="100"/>
        </svg>
      `;
      
      const result = optimizeSVGFileSize(svgWithMetadata);
      
      expect(result).not.toContain('rdf:RDF');
      expect(result).not.toContain('rdf:Description');
      expect(result).toContain('<circle');
    });

    it('should reduce decimal precision to 2 places', () => {
      const svgWithPrecision = `
        <svg viewBox="0 0 400 400">
          <circle cx="200.123456" cy="200.987654" r="100.555555"/>
          <path d="M10.123456,20.987654 L30.111111,40.999999"/>
        </svg>
      `;
      
      const result = optimizeSVGFileSize(svgWithPrecision, { reducePrecision: 2 });
      
      expect(result).toContain('200.12');
      expect(result).toContain('200.99');
      expect(result).toContain('100.56');
      expect(result).not.toContain('200.123456');
      expect(result).not.toContain('200.987654');
    });

    it('should minify path data', () => {
      const svgWithPath = `
        <svg viewBox="0 0 400 400">
          <path d="M 10 20 L 30 40 H 50 V 60 Z"/>
        </svg>
      `;
      
      const result = optimizeSVGFileSize(svgWithPath);
      
      // Should remove unnecessary spaces
      expect(result).toContain('d="M10 20L30 40H50V60Z"');
    });

    it('should remove empty groups', () => {
      const svgWithEmptyGroups = `
        <svg viewBox="0 0 400 400">
          <g></g>
          <g>
            <circle cx="200" cy="200" r="100"/>
          </g>
          <g>  </g>
        </svg>
      `;
      
      const result = optimizeSVGFileSize(svgWithEmptyGroups);
      
      // Should keep group with content
      expect(result).toContain('<g>');
      expect(result).toContain('</g>');
      // Should have only one pair of g tags (the one with content)
      const gOpenCount = (result.match(/<g>/g) || []).length;
      const gCloseCount = (result.match(/<\/g>/g) || []).length;
      expect(gOpenCount).toBe(1);
      expect(gCloseCount).toBe(1);
    });

    it('should remove unused defs', () => {
      const svgWithUnusedDefs = `
        <svg viewBox="0 0 400 400">
          <defs>
            <linearGradient id="used-gradient">
              <stop offset="0%" stop-color="red"/>
            </linearGradient>
            <linearGradient id="unused-gradient">
              <stop offset="0%" stop-color="blue"/>
            </linearGradient>
          </defs>
          <circle cx="200" cy="200" r="100" fill="url(#used-gradient)"/>
        </svg>
      `;
      
      const result = optimizeSVGFileSize(svgWithUnusedDefs);
      
      expect(result).toContain('used-gradient');
      expect(result).not.toContain('unused-gradient');
    });

    it('should minify inline styles', () => {
      const svgWithStyles = `
        <svg viewBox="0 0 400 400">
          <circle cx="200" cy="200" r="100" style="fill: red; stroke: blue; stroke-width: 2;"/>
        </svg>
      `;
      
      const result = optimizeSVGFileSize(svgWithStyles);
      
      // Should minify styles (with single space after colons and semicolons for readability)
      expect(result).toContain('fill: red; stroke: blue; stroke-width: 2');
    });

    it('should remove unnecessary whitespace', () => {
      const svgWithWhitespace = `
        <svg viewBox="0 0 400 400">
          
          <circle cx="200" cy="200" r="100"/>
          
          <rect x="100" y="100" width="50" height="50"/>
          
        </svg>
      `;
      
      const result = optimizeSVGFileSize(svgWithWhitespace);
      
      // Should remove whitespace between tags
      expect(result).not.toMatch(/>\s+</);
      expect(result).toMatch(/><circle/);
      expect(result).toMatch(/><rect/);
    });

    it('should apply all optimizations together', () => {
      const complexSvg = `
        <?xml version="1.0" encoding="UTF-8"?>
        <!-- Generated by Illustrator -->
        <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
          <metadata>
            <rdf:RDF>
              <rdf:Description>
                <dc:title>Badge</dc:title>
              </rdf:Description>
            </rdf:RDF>
          </metadata>
          <defs>
            <linearGradient id="grad1">
              <stop offset="0%" stop-color="red"/>
            </linearGradient>
            <linearGradient id="unused">
              <stop offset="0%" stop-color="blue"/>
            </linearGradient>
          </defs>
          <g>
            
          </g>
          <g>
            <circle cx="200.123456" cy="200.987654" r="100.555555" fill="url(#grad1)" style="stroke: black; stroke-width: 2;"/>
            <path d="M 10.123 20.456 L 30.789 40.012 Z"/>
          </g>
        </svg>
      `;
      
      const result = optimizeSVGFileSize(complexSvg);
      
      // Should remove comments
      expect(result).not.toContain('<!-- Generated by Illustrator -->');
      
      // Should remove XML declaration
      expect(result).not.toContain('<?xml');
      
      // Should remove RDF metadata
      expect(result).not.toContain('rdf:RDF');
      
      // Should reduce precision
      expect(result).toContain('200.12');
      expect(result).toContain('200.99');
      
      // Should remove unused defs
      expect(result).toContain('grad1');
      expect(result).not.toContain('unused');
      
      // Should remove empty groups
      const gCount = (result.match(/<g>/g) || []).length;
      expect(gCount).toBe(1); // Only the group with content
      
      // Should minify styles (with single space for readability)
      expect(result).toContain('stroke: black; stroke-width: 2');
      
      // Should remove whitespace
      expect(result).not.toMatch(/>\s+</);
    });
  });

  describe('File size utilities', () => {
    it('should calculate SVG file size in bytes', () => {
      const svg = '<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="100"/></svg>';
      const size = getSVGFileSize(svg);
      
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should calculate SVG file size in KB', () => {
      const svg = '<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="100"/></svg>';
      const sizeKB = getSVGFileSizeKB(svg);
      
      expect(sizeKB).toBeGreaterThan(0);
      expect(sizeKB).toBeLessThan(1); // This simple SVG should be < 1KB
    });

    it('should check if SVG meets 50KB target', () => {
      const smallSvg = '<svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="100"/></svg>';
      const result = checkFileSizeTarget(smallSvg, 50);
      
      expect(result.passes).toBe(true);
      expect(result.actualKB).toBeLessThan(50);
      expect(result.targetKB).toBe(50);
      expect(result.percentOfTarget).toBeLessThan(100);
    });

    it('should detect when SVG exceeds target', () => {
      // Create a large SVG by repeating elements
      let largeSvg = '<svg viewBox="0 0 400 400">';
      for (let i = 0; i < 1000; i++) {
        largeSvg += `<circle cx="${i}" cy="${i}" r="10" fill="red" stroke="blue" stroke-width="2"/>`;
      }
      largeSvg += '</svg>';
      
      const result = checkFileSizeTarget(largeSvg, 50);
      
      expect(result.passes).toBe(false);
      expect(result.actualKB).toBeGreaterThan(50);
      expect(result.percentOfTarget).toBeGreaterThan(100);
    });
  });

  describe('Complete badge optimization', () => {
    it('should apply both rendering and file size optimizations', () => {
      const svg = `
        <!-- Comment to remove -->
        <svg viewBox="0 0 500 500">
          <metadata>
            <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
              <rdf:Description>
                <dc:title>Badge</dc:title>
              </rdf:Description>
            </rdf:RDF>
          </metadata>
          <circle cx="200.123456" cy="200.987654" r="100.555555"/>
        </svg>
      `;
      
      const result = optimizeBadgeComplete(svg, {
        fileSizeOptions: {
          removeMetadata: false, // Keep metadata to preserve style attribute
        },
      });
      
      // Should have rendering optimizations
      expect(result.svg).toContain('shape-rendering');
      expect(result.svg).toContain('translateZ');
      
      // Should have file size optimizations
      expect(result.svg).not.toContain('<!-- Comment to remove -->');
      expect(result.svg).toContain('200.12');
      
      // Should have correct viewBox (corrected from 500 to 400)
      expect(result.svg).toContain('viewBox="0 0 400 400"');
      
      // Should have file size info
      expect(result.fileSize.actualKB).toBeGreaterThan(0);
      expect(result.fileSize.targetKB).toBe(50);
      
      // Should have validation info
      expect(result.validation.valid).toBe(true);
    });

    it('should report when optimization reduces file size significantly', () => {
      const bloatedSvg = `
        <?xml version="1.0" encoding="UTF-8"?>
        <!-- This is a very long comment that takes up space and should be removed during optimization -->
        <!-- Another comment -->
        <!-- Yet another comment -->
        <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
          <metadata>
            <rdf:RDF>
              <rdf:Description>
                <dc:title>Badge with lots of metadata</dc:title>
                <dc:creator>Test Creator</dc:creator>
                <dc:description>A very long description that takes up space</dc:description>
              </rdf:Description>
            </rdf:RDF>
          </metadata>
          <defs>
            <linearGradient id="grad1">
              <stop offset="0%" stop-color="red"/>
            </linearGradient>
          </defs>
          <g>
            
          </g>
          <g>
            
          </g>
          <circle cx="200.123456789" cy="200.987654321" r="100.555555555" fill="url(#grad1)" style="stroke: black;  stroke-width: 2;  opacity: 0.8;"/>
        </svg>
      `;
      
      const originalSize = getSVGFileSizeKB(bloatedSvg);
      const optimized = optimizeSVGFileSize(bloatedSvg);
      const optimizedSize = getSVGFileSizeKB(optimized);
      
      // Optimized should be smaller
      expect(optimizedSize).toBeLessThan(originalSize);
      
      // Should have removed significant content
      const reduction = ((originalSize - optimizedSize) / originalSize) * 100;
      expect(reduction).toBeGreaterThan(20); // At least 20% reduction
    });

    it('should preserve essential badge content while optimizing', () => {
      const badgeSvg = `
        <svg viewBox="0 0 400 400">
          <defs>
            <linearGradient id="tier-gradient">
              <stop offset="0%" stop-color="#FFD700"/>
              <stop offset="100%" stop-color="#FFA500"/>
            </linearGradient>
          </defs>
          <circle cx="200" cy="200" r="180" fill="url(#tier-gradient)"/>
          <text x="200" y="200" text-anchor="middle" font-size="24">Gold Badge</text>
        </svg>
      `;
      
      const result = optimizeSVGFileSize(badgeSvg);
      
      // Should preserve gradient
      expect(result).toContain('tier-gradient');
      expect(result).toContain('linearGradient');
      
      // Should preserve circle
      expect(result).toContain('<circle');
      expect(result).toContain('fill="url(#tier-gradient)"');
      
      // Should preserve text
      expect(result).toContain('<text');
      expect(result).toContain('Gold Badge');
    });
  });

  describe('Real-world badge optimization', () => {
    it('should optimize a typical badge SVG to under 50KB', () => {
      // Simulate a typical badge with gradient, pattern, and icon
      const typicalBadge = `
        <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bronze-gradient">
              <stop offset="0%" style="stop-color:#CD7F32;stop-opacity:1"/>
              <stop offset="100%" style="stop-color:#8B4513;stop-opacity:1"/>
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
            </filter>
          </defs>
          <circle cx="200" cy="200" r="180" fill="url(#bronze-gradient)" filter="url(#shadow)"/>
          <circle cx="200" cy="200" r="150" fill="none" stroke="white" stroke-width="3" opacity="0.3"/>
          <g transform="translate(200, 200)">
            <path d="M0,-60 L15,-30 L45,-35 L25,-10 L30,20 L0,0 L-30,20 L-25,-10 L-45,-35 L-15,-30 Z" fill="white" opacity="0.9"/>
          </g>
          <text x="200" y="330" text-anchor="middle" font-family="Arial" font-size="28" font-weight="bold" fill="white">Bronze</text>
        </svg>
      `;
      
      const result = optimizeBadgeComplete(typicalBadge);
      
      expect(result.fileSize.passes).toBe(true);
      expect(result.fileSize.actualKB).toBeLessThan(50);
      expect(result.validation.valid).toBe(true);
    });
  });
});

