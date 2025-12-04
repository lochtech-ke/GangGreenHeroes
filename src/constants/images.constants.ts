/**
 * Image Constants
 * 
 * Centralized image paths for the Gang Green platform.
 * All images are optimized for web with WebP format and JPEG fallbacks.
 */

export const IMAGES = {
  // Hero Section Images - Kenyan Forest Landscapes
  hero: {
    // Primary hero images showcasing African forests
    kakamegaForest: '/assets/images/hero/kakamega-forest.jpg',
    karuraForest: '/assets/images/hero/karura-forest.jpg',
    mauForest: '/assets/images/hero/mau-forest.jpg',
    
    // Fallback to Unsplash for now (will be replaced with local images)
    defaultHero: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop',
    alternateHero1: 'https://images.unsplash.com/photo-1596727362302-b8d891c42ab8?q=80&w=2070&auto=format&fit=crop',
    alternateHero2: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2127&auto=format&fit=crop',
  },

  // Community and Tree Planting Images
  community: {
    smilingFaces: '/assets/images/community/smiling-faces.jpg',
    treePlanting1: '/assets/images/community/tree-planting-1.jpg',
    treePlanting2: '/assets/images/community/tree-planting-2.jpg',
    communityAction: '/assets/images/community/community-action.jpg',
    groupPlanting: '/assets/images/community/group-planting.jpg',
  },

  // People and Leaders
  people: {
    wangariMaathai: '/assets/images/people/wangari-maathai.jpg',
  },

  // Forest Backgrounds for Sections
  backgrounds: {
    kakamega: '/assets/images/backgrounds/kakamega-bg.jpg',
    karura: '/assets/images/backgrounds/karura-bg.jpg',
    mau: '/assets/images/backgrounds/mau-bg.jpg',
    forestCanopy: '/assets/images/backgrounds/forest-canopy.jpg',
    treeSeedling: '/assets/images/backgrounds/tree-seedling.jpg',
  },

  // Placeholder images for development
  placeholders: {
    forest: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=400&auto=format&fit=crop',
    community: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=400&auto=format&fit=crop',
    trees: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=400&auto=format&fit=crop',
  },
} as const;

/**
 * Image Attribution
 * 
 * Provides attribution information for images used in the platform.
 */
export const IMAGE_ATTRIBUTION = {
  greenBeltMovement: {
    name: 'The Green Belt Movement',
    url: 'https://www.greenbeltmovement.org/',
    credit: '© The Green Belt Movement',
    description: 'Community tree-planting and conservation images',
  },
  unsplash: {
    name: 'Unsplash',
    url: 'https://unsplash.com',
    credit: 'Various photographers on Unsplash',
    description: 'High-quality forest and nature photography',
  },
} as const;

/**
 * Responsive Image Sizes
 * 
 * Defines srcset sizes for responsive images.
 */
export const IMAGE_SIZES = {
  hero: {
    mobile: '640w',
    tablet: '1024w',
    desktop: '1920w',
    ultrawide: '2560w',
  },
  card: {
    small: '200w',
    medium: '400w',
    large: '800w',
  },
  thumbnail: {
    small: '100w',
    medium: '200w',
  },
} as const;

/**
 * Image Alt Text Templates
 * 
 * Provides accessible alt text for common image types.
 */
export const IMAGE_ALT_TEXT = {
  hero: {
    kakamega: 'Lush Kakamega Forest in Western Kenya, showcasing dense tropical rainforest canopy',
    karura: 'Karura Forest urban sanctuary in Nairobi with walking trails and diverse wildlife',
    mau: 'Mau Forest complex, Kenya\'s largest indigenous montane forest and critical water tower',
    default: 'African forest landscape with rich biodiversity and conservation activities',
  },
  community: {
    treePlanting: 'Community members planting trees in Kenyan forest conservation initiative',
    groupAction: 'Diverse group of African people engaged in environmental conservation activity',
    celebration: 'Community celebrating successful tree planting and conservation milestone',
  },
  people: {
    wangariMaathai: 'Prof. Wangari Maathai, Nobel Peace Prize laureate and founder of The Green Belt Movement',
  },
} as const;

/**
 * Helper function to get image with fallback
 */
export const getImageWithFallback = (
  primaryPath: string,
  fallbackPath: string = IMAGES.placeholders.forest
): string => {
  return primaryPath || fallbackPath;
};

/**
 * Helper function to generate srcset for responsive images
 */
export const generateSrcSet = (basePath: string, sizes: string[]): string => {
  return sizes.map(size => `${basePath}?w=${size} ${size}`).join(', ');
};
