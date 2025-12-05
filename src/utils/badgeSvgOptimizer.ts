/**
 * Badge SVG Optimizer
 * Ensures all badge SVGs have correct viewBox, dimensions, and rendering properties
 */

import { BADGE_VIEWBOX, BADGE_SIZE } from '../assets/badges';

export interface SVGOptimizationOptions {
  viewBox?: string;
  width?: string;
  height?: string;
  preserveAspectRatio?: string;
  addRenderingOptimizations?: boolean;
}

/**
 * Default optimization options for badge SVGs
 */
export const DEFAULT_BADGE_SVG_OPTIONS: SVGOptimizationOptions = {
  viewBox: BADGE_VIEWBOX, // "0 0 400 400"
  width: '100%',
  height: '100%',
  preserveAspectRatio: 'xMidYMid meet',
  addRenderingOptimizations: true,
};

/**
 * Optimize badge SVG for correct display
 * Ensures proper viewBox, dimensions, and rendering quality
 */
export function optimizeBadgeSVG(
  svgString: string,
  options: SVGOptimizationOptions = DEFAULT_BADGE_SVG_OPTIONS
): string {
  const opts = { ...DEFAULT_BADGE_SVG_OPTIONS, ...options };
  
  // Parse SVG string to check if it's valid
  if (!svgString || !svgString.includes('<svg')) {
    console.error('[BadgeSVGOptimizer] Invalid SVG string provided');
    return svgString;
  }

  let optimized = svgString;

  // 1. Fix viewBox
  if (opts.viewBox) {
    // Remove existing viewBox if present
    optimized = optimized.replace(/viewBox="[^"]*"/g, '');
    // Add correct viewBox right after <svg
    optimized = optimized.replace(
      /<svg/,
      `<svg viewBox="${opts.viewBox}"`
    );
  }

  // 2. Set width and height
  if (opts.width && opts.height) {
    // Remove existing width/height attributes
    optimized = optimized.replace(/\s+width="[^"]*"/g, '');
    optimized = optimized.replace(/\s+height="[^"]*"/g, '');
    
    // Add width and height after viewBox
    optimized = optimized.replace(
      /viewBox="[^"]*"/,
      `$& width="${opts.width}" height="${opts.height}"`
    );
  }

  // 3. Add preserveAspectRatio
  if (opts.preserveAspectRatio) {
    // Remove existing preserveAspectRatio if present
    optimized = optimized.replace(/\s+preserveAspectRatio="[^"]*"/g, '');
    
    // Add preserveAspectRatio
    optimized = optimized.replace(
      /height="[^"]*"/,
      `$& preserveAspectRatio="${opts.preserveAspectRatio}"`
    );
  }

  // 4. Add rendering optimizations
  if (opts.addRenderingOptimizations) {
    optimized = addRenderingOptimizations(optimized);
  }

  return optimized;
}

/**
 * Add CSS properties for optimal rendering quality
 * Implements anti-aliasing and rendering optimizations for geometric badges
 */
function addRenderingOptimizations(svgString: string): string {
  // Check if style attribute already exists
  const hasStyle = svgString.includes('style=');
  
  // Comprehensive rendering optimizations for geometric precision and edge sharpness
  const renderingStyles = [
    'shape-rendering: geometricPrecision',  // Precise geometric rendering
    'text-rendering: optimizeLegibility',   // Optimized text rendering
    'image-rendering: crisp-edges',         // Sharp edges for images
    'transform: translateZ(0)',             // GPU acceleration, prevents blur
    'backface-visibility: hidden',          // Prevents flickering during animations
  ].join('; ');

  if (hasStyle) {
    // Append to existing style
    return svgString.replace(
      /style="([^"]*)"/,
      `style="$1; ${renderingStyles}"`
    );
  } else {
    // Add new style attribute
    return svgString.replace(
      /<svg([^>]*)>/,
      `<svg$1 style="${renderingStyles}">`
    );
  }
}

/**
 * Validate badge SVG has correct dimensions
 */
export function validateBadgeSVG(svgString: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for viewBox
  const viewBoxMatch = svgString.match(/viewBox="([^"]*)"/);
  if (!viewBoxMatch) {
    issues.push('Missing viewBox attribute');
  } else if (viewBoxMatch[1] !== BADGE_VIEWBOX) {
    issues.push(`Incorrect viewBox: expected "${BADGE_VIEWBOX}", got "${viewBoxMatch[1]}"`);
  }

  // Check for width and height
  if (!svgString.includes('width=')) {
    issues.push('Missing width attribute');
  }
  if (!svgString.includes('height=')) {
    issues.push('Missing height attribute');
  }

  // Check for preserveAspectRatio
  if (!svgString.includes('preserveAspectRatio=')) {
    issues.push('Missing preserveAspectRatio attribute');
  }

  // Check aspect ratio is 1:1 (square)
  const widthMatch = svgString.match(/width="([^"]*)"/);
  const heightMatch = svgString.match(/height="([^"]*)"/);
  if (widthMatch && heightMatch && widthMatch[1] !== heightMatch[1]) {
    // Only warn if they're not both percentage or both the same value
    if (!widthMatch[1].includes('%') || !heightMatch[1].includes('%')) {
      issues.push('Width and height should be equal for 1:1 aspect ratio');
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Get responsive badge sizes for different breakpoints
 */
export function getResponsiveBadgeSize(breakpoint: 'mobile' | 'tablet' | 'desktop'): number {
  switch (breakpoint) {
    case 'mobile':
      return 128; // w-32 h-32
    case 'tablet':
      return 160; // w-40 h-40
    case 'desktop':
      return 192; // w-48 h-48
    default:
      return 192;
  }
}

/**
 * Get CSS classes for responsive badge sizing
 */
export function getResponsiveBadgeClasses(): string {
  return 'w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48';
}

/**
 * Ensure badge maintains 1:1 aspect ratio
 */
export function ensureSquareAspectRatio(svgString: string): string {
  // Extract viewBox values
  const viewBoxMatch = svgString.match(/viewBox="([^"]*)"/);
  if (!viewBoxMatch) {
    return svgString;
  }

  const [minX, minY, width, height] = viewBoxMatch[1].split(' ').map(Number);
  
  // If not square, make it square by using the larger dimension
  if (width !== height) {
    const size = Math.max(width, height);
    const newViewBox = `${minX} ${minY} ${size} ${size}`;
    
    console.warn('[BadgeSVGOptimizer] Correcting non-square viewBox:', {
      original: viewBoxMatch[1],
      corrected: newViewBox,
    });
    
    return svgString.replace(
      /viewBox="[^"]*"/,
      `viewBox="${newViewBox}"`
    );
  }

  return svgString;
}

/**
 * Batch optimize multiple badge SVGs
 */
export function batchOptimizeBadges(
  badges: Array<{ id: string; svg: string }>,
  options?: SVGOptimizationOptions
): Array<{ id: string; svg: string; validation: ReturnType<typeof validateBadgeSVG> }> {
  return badges.map(badge => {
    const optimized = optimizeBadgeSVG(badge.svg, options);
    const validation = validateBadgeSVG(optimized);
    
    if (!validation.valid) {
      console.warn(`[BadgeSVGOptimizer] Badge ${badge.id} has issues:`, validation.issues);
    }
    
    return {
      id: badge.id,
      svg: optimized,
      validation,
    };
  });
}

/**
 * Create a wrapper div with proper aspect ratio container
 */
export function createBadgeContainer(
  badgeId: string,
  className: string = ''
): string {
  return `
    <div 
      class="badge-container aspect-square ${className}" 
      data-badge-id="${badgeId}"
      style="position: relative; width: 100%; padding-bottom: 100%;"
    >
      <div style="position: absolute; inset: 0;">
        <!-- Badge SVG goes here -->
      </div>
    </div>
  `;
}

/**
 * Comprehensive SVG file size optimization
 * Targets < 50KB per badge by removing metadata, minifying paths, and reducing precision
 */
export interface SVGFileSizeOptimizationOptions {
  removeComments?: boolean;
  removeMetadata?: boolean;
  minifyPaths?: boolean;
  reducePrecision?: number; // Decimal places (default: 2)
  mergeRedundantPaths?: boolean;
  removeEmptyGroups?: boolean;
  removeUnusedDefs?: boolean;
  minifyStyles?: boolean;
  removeWhitespace?: boolean;
}

export const DEFAULT_FILE_SIZE_OPTIONS: SVGFileSizeOptimizationOptions = {
  removeComments: true,
  removeMetadata: true,
  minifyPaths: true,
  reducePrecision: 2,
  mergeRedundantPaths: true,
  removeEmptyGroups: true,
  removeUnusedDefs: true,
  minifyStyles: true,
  removeWhitespace: true,
};

/**
 * Ensure critical aspect ratio attributes are present
 * This function validates and restores width, height, preserveAspectRatio, and viewBox
 * if they were accidentally removed during optimization
 */
function ensureCriticalAttributes(svgString: string): string {
  let result = svgString;
  
  // Check if SVG tag exists
  if (!result.includes('<svg')) {
    return result;
  }

  // Ensure viewBox is present
  if (!result.includes('viewBox=')) {
    result = result.replace(
      /<svg/,
      `<svg viewBox="${BADGE_VIEWBOX}"`
    );
  }

  // Ensure width is present
  if (!result.includes('width=')) {
    result = result.replace(
      /viewBox="[^"]*"/,
      `$& width="100%"`
    );
  }

  // Ensure height is present
  if (!result.includes('height=')) {
    result = result.replace(
      /width="[^"]*"/,
      `$& height="100%"`
    );
  }

  // Ensure preserveAspectRatio is present
  if (!result.includes('preserveAspectRatio=')) {
    result = result.replace(
      /height="[^"]*"/,
      `$& preserveAspectRatio="xMidYMid meet"`
    );
  }

  return result;
}

/**
 * Optimize SVG for minimal file size
 */
export function optimizeSVGFileSize(
  svgString: string,
  options: SVGFileSizeOptimizationOptions = DEFAULT_FILE_SIZE_OPTIONS
): string {
  const opts = { ...DEFAULT_FILE_SIZE_OPTIONS, ...options };
  let optimized = svgString;

  // 1. Remove XML comments
  if (opts.removeComments) {
    optimized = removeComments(optimized);
  }

  // 2. Remove unnecessary metadata (but keep essential badge metadata)
  if (opts.removeMetadata) {
    optimized = removeUnnecessaryMetadata(optimized);
  }

  // 3. Reduce decimal precision in paths and numbers
  if (opts.minifyPaths && opts.reducePrecision !== undefined) {
    optimized = reducePrecision(optimized, opts.reducePrecision);
  }

  // 4. Minify path data
  if (opts.minifyPaths) {
    optimized = minifyPathData(optimized);
  }

  // 5. Remove empty groups
  if (opts.removeEmptyGroups) {
    optimized = removeEmptyGroups(optimized);
  }

  // 6. Remove unused defs
  if (opts.removeUnusedDefs) {
    optimized = removeUnusedDefs(optimized);
  }

  // 7. Minify inline styles
  if (opts.minifyStyles) {
    optimized = minifyStyles(optimized);
  }

  // 8. Remove unnecessary whitespace (do this last)
  if (opts.removeWhitespace) {
    optimized = removeWhitespace(optimized);
  }

  // 9. Validate and restore critical attributes if they were removed
  optimized = ensureCriticalAttributes(optimized);

  return optimized;
}

/**
 * Remove XML/HTML comments from SVG
 */
function removeComments(svg: string): string {
  return svg.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * Remove unnecessary metadata while preserving essential badge information
 * IMPORTANT: This function preserves critical SVG attributes (viewBox, width, height, preserveAspectRatio)
 */
function removeUnnecessaryMetadata(svg: string): string {
  // Remove RDF metadata (verbose and not needed for display)
  let result = svg.replace(/<rdf:RDF[\s\S]*?<\/rdf:RDF>/g, '');
  
  // Remove XML processing instructions
  result = result.replace(/<\?xml[^?]*\?>/g, '');
  
  // Remove DOCTYPE declarations
  result = result.replace(/<!DOCTYPE[^>]*>/g, '');
  
  // Remove xmlns declarations we don't need (keep main SVG namespace)
  result = result.replace(/xmlns:rdf="[^"]*"\s*/g, '');
  result = result.replace(/xmlns:dc="[^"]*"\s*/g, '');
  result = result.replace(/xmlns:cc="[^"]*"\s*/g, '');
  result = result.replace(/xmlns:svg="[^"]*"\s*/g, '');
  
  // Remove editor metadata (Inkscape, Illustrator, etc.)
  result = result.replace(/sodipodi:[^=]*="[^"]*"\s*/g, '');
  result = result.replace(/inkscape:[^=]*="[^"]*"\s*/g, '');
  result = result.replace(/xmlns:sodipodi="[^"]*"\s*/g, '');
  result = result.replace(/xmlns:inkscape="[^"]*"\s*/g, '');
  
  return result;
}

/**
 * Reduce decimal precision in all numbers
 */
function reducePrecision(svg: string, precision: number): string {
  // Match numbers with decimals (including scientific notation)
  return svg.replace(/(\d+\.\d+)/g, (match) => {
    const num = parseFloat(match);
    return num.toFixed(precision);
  });
}

/**
 * Minify SVG path data
 */
function minifyPathData(svg: string): string {
  // Find all path d attributes
  return svg.replace(/d="([^"]*)"/g, (match, pathData) => {
    let minified = pathData;
    
    // Remove unnecessary spaces around commands
    minified = minified.replace(/\s*([MLHVCSQTAZ])\s*/gi, '$1');
    
    // Remove spaces before negative numbers
    minified = minified.replace(/\s+-/g, '-');
    
    // Remove leading zeros
    minified = minified.replace(/(\s|^)0+(\d)/g, '$1$2');
    
    // Convert absolute commands to relative where beneficial
    // (This is a simple optimization; full conversion would be more complex)
    
    return `d="${minified}"`;
  });
}

/**
 * Remove empty groups
 */
function removeEmptyGroups(svg: string): string {
  // Remove groups with no content or only whitespace
  let result = svg;
  let prevResult = '';
  
  // Keep removing until no more empty groups found (handles nested empty groups)
  while (result !== prevResult) {
    prevResult = result;
    result = result.replace(/<g[^>]*>\s*<\/g>/g, '');
  }
  
  return result;
}

/**
 * Remove unused definitions from <defs>
 */
function removeUnusedDefs(svg: string): string {
  // Extract all IDs defined in <defs>
  const defsMatch = svg.match(/<defs>([\s\S]*?)<\/defs>/);
  if (!defsMatch) return svg;
  
  const defsContent = defsMatch[1];
  const definedIds: string[] = [];
  
  // Find all id attributes in defs
  const idMatches = defsContent.matchAll(/id="([^"]*)"/g);
  for (const match of idMatches) {
    definedIds.push(match[1]);
  }
  
  // Check which IDs are actually used outside of defs
  const usedIds = new Set<string>();
  const svgWithoutDefs = svg.replace(/<defs>[\s\S]*?<\/defs>/, '');
  
  for (const id of definedIds) {
    // Check for url(#id), href="#id", or fill="url(#id)" references
    const urlPattern = new RegExp(`url\\(#${id}\\)|href="#${id}"|fill="url\\(#${id}\\)"|stroke="url\\(#${id}\\)"|filter="url\\(#${id}\\)"`, 'g');
    if (urlPattern.test(svgWithoutDefs)) {
      usedIds.add(id);
    }
  }
  
  // Rebuild defs with only used definitions
  let newDefsContent = defsContent;
  for (const id of definedIds) {
    if (!usedIds.has(id)) {
      // Remove this definition (gradient, filter, pattern, etc.)
      // This is a simple removal; more sophisticated parsing would be better
      const defPattern = new RegExp(`<[^>]*id="${id}"[^>]*>([\\s\\S]*?)</[^>]*>`, 'g');
      newDefsContent = newDefsContent.replace(defPattern, '');
    }
  }
  
  // Replace old defs with new defs
  return svg.replace(/<defs>[\s\S]*?<\/defs>/, `<defs>${newDefsContent}</defs>`);
}

/**
 * Minify inline CSS styles
 */
function minifyStyles(svg: string): string {
  // Minify style attributes
  return svg.replace(/style="([^"]*)"/g, (match, styleContent) => {
    let minified = styleContent;
    
    // Remove spaces around colons (but keep one space after for readability of rendering optimizations)
    minified = minified.replace(/\s*:\s*/g, ': ');
    
    // Remove spaces around semicolons
    minified = minified.replace(/\s*;\s*/g, '; ');
    
    // Remove trailing semicolon and space
    minified = minified.replace(/;\s*$/, '');
    
    // Remove spaces around commas
    minified = minified.replace(/\s*,\s*/g, ',');
    
    // Clean up any double spaces
    minified = minified.replace(/\s+/g, ' ');
    
    return `style="${minified}"`;
  });
}

/**
 * Remove unnecessary whitespace while preserving attribute spacing
 * IMPORTANT: Preserves spaces between attributes to maintain valid SVG structure
 */
function removeWhitespace(svg: string): string {
  let result = svg;
  
  // Remove whitespace between tags (but not within tags)
  result = result.replace(/>\s+</g, '><');
  
  // Remove leading/trailing whitespace
  result = result.trim();
  
  // Collapse multiple spaces within tags to single space (preserves attribute separation)
  result = result.replace(/<([^>]+)>/g, (match, content) => {
    // Collapse multiple spaces to single space within tag
    const normalized = content.replace(/\s+/g, ' ').trim();
    return `<${normalized}>`;
  });
  
  return result;
}

/**
 * Get SVG file size in bytes
 */
export function getSVGFileSize(svgString: string): number {
  return new Blob([svgString]).size;
}

/**
 * Get SVG file size in KB
 */
export function getSVGFileSizeKB(svgString: string): number {
  return getSVGFileSize(svgString) / 1024;
}

/**
 * Check if SVG meets file size target
 */
export function checkFileSizeTarget(svgString: string, targetKB: number = 50): {
  passes: boolean;
  actualKB: number;
  targetKB: number;
  percentOfTarget: number;
} {
  const actualKB = getSVGFileSizeKB(svgString);
  const passes = actualKB <= targetKB;
  const percentOfTarget = (actualKB / targetKB) * 100;
  
  return {
    passes,
    actualKB: Math.round(actualKB * 100) / 100,
    targetKB,
    percentOfTarget: Math.round(percentOfTarget * 100) / 100,
  };
}

/**
 * Optimize badge SVG with both rendering quality and file size optimizations
 */
export function optimizeBadgeComplete(
  svgString: string,
  options: {
    renderingOptions?: SVGOptimizationOptions;
    fileSizeOptions?: SVGFileSizeOptimizationOptions;
  } = {}
): {
  svg: string;
  fileSize: ReturnType<typeof checkFileSizeTarget>;
  validation: ReturnType<typeof validateBadgeSVG>;
} {
  // First apply rendering optimizations
  let optimized = optimizeBadgeSVG(svgString, options.renderingOptions);
  
  // Then apply file size optimizations
  optimized = optimizeSVGFileSize(optimized, options.fileSizeOptions);
  
  // Get file size info
  const fileSize = checkFileSizeTarget(optimized);
  
  // Validate the result
  const validation = validateBadgeSVG(optimized);
  
  return {
    svg: optimized,
    fileSize,
    validation,
  };
}
