/**
 * Pilot Forests Data with Cultural and Ecological Context
 * 
 * These three Kenyan forests are the pilot sites for the #GangGreen platform,
 * each with rich cultural significance and critical ecological importance.
 */

export interface ForestCulturalContext {
  id: string;
  name: string;
  localName?: string; // Traditional/local name
  coordinates: [number, number]; // [latitude, longitude]
  description: string;
  culturalSignificance: string;
  ecologicalImportance: string;
  communityInvolvement: string;
  traditionalUses: string[];
  conservationChallenges: string[];
  successStories: string[];
  area: string;
  treesPlanted: number;
  activeInitiatives: number;
  color: string;
  imageUrl: string;
  facts: {
    label: string;
    value: string;
  }[];
}

export const PILOT_FORESTS: ForestCulturalContext[] = [
  {
    id: 'kakamega',
    name: 'Kakamega Forest',
    localName: 'Msitu wa Kakamega', // Swahili: Forest of Kakamega
    coordinates: [0.2827, 34.8597],
    description: 'Kenya\'s last remaining tropical rainforest, a biodiversity hotspot and sacred ancestral land of the Luhya people.',
    culturalSignificance: 'For generations, the Luhya community has revered Kakamega Forest as sacred ground. Traditional healers gather medicinal plants here, and the forest features in countless oral histories and creation stories. The forest is known as "Likhanda" in Luhya, meaning "the place of many trees," and has been a source of spiritual connection and traditional knowledge for centuries.',
    ecologicalImportance: 'Kakamega Forest is Kenya\'s only tropical rainforest and the easternmost remnant of the Guineo-Congolian rainforest that once stretched across Africa. It harbors over 400 species of birds, 400 species of butterflies, and 7 species of primates. The forest acts as a critical water catchment area, feeding rivers that sustain millions of people downstream.',
    communityInvolvement: 'Local communities have formed over 50 Community Forest Associations (CFAs) that actively participate in forest conservation. Women\'s groups harvest sustainable forest products like honey and medicinal plants, creating income while protecting the ecosystem. Youth groups conduct regular tree planting and forest patrols, embodying the Ubuntu spirit of collective responsibility.',
    traditionalUses: [
      'Medicinal plant harvesting by traditional healers',
      'Sacred sites for spiritual ceremonies and rituals',
      'Sustainable honey production from indigenous bees',
      'Collection of traditional craft materials',
      'Cultural education and storytelling grounds',
    ],
    conservationChallenges: [
      'Encroachment from surrounding agricultural expansion',
      'Illegal logging and charcoal production',
      'Human-wildlife conflict at forest edges',
      'Climate change affecting rainfall patterns',
      'Limited resources for forest rangers',
    ],
    successStories: [
      'Community-led reforestation has restored 500+ hectares since 2015',
      'Eco-tourism initiatives provide income for 200+ families',
      'Traditional knowledge documentation project preserves indigenous wisdom',
      'Youth tree-planting clubs have engaged 5,000+ students',
      'Butterfly farming provides sustainable livelihoods for 50+ households',
    ],
    area: '45,000 hectares',
    treesPlanted: 125000,
    activeInitiatives: 28,
    color: '#10B981', // Emerald green
    imageUrl: '/assets/images/forests/kakamega-forest.jpg',
    facts: [
      { label: 'Biodiversity', value: '400+ bird species' },
      { label: 'Age', value: 'Over 10,000 years old' },
      { label: 'Communities', value: '50+ CFAs active' },
      { label: 'Water Source', value: 'Feeds 5 major rivers' },
    ],
  },
  {
    id: 'karura',
    name: 'Karura Forest',
    localName: 'Msitu wa Karura',
    coordinates: [-1.2571, 36.8506],
    description: 'An urban oasis in Nairobi, Karura Forest demonstrates how nature and city life can thrive together, serving as the "lungs of Nairobi."',
    culturalSignificance: 'Karura Forest holds a special place in Kenya\'s democratic history. In the 1990s, environmental activists led by Wangari Maathai fought to save the forest from development, making it a symbol of environmental justice and people power. The forest\'s preservation represents the triumph of community activism and the Ubuntu principle that "I am because we are."',
    ecologicalImportance: 'As Nairobi\'s largest urban forest, Karura provides critical ecosystem services to over 4 million city residents. It purifies air, regulates temperature, prevents flooding, and offers a biodiversity refuge with over 200 bird species and numerous mammals. The forest\'s three rivers and waterfalls are vital water sources, and its 50+ km of trails provide essential green space for mental and physical health.',
    communityInvolvement: 'The Friends of Karura Forest (FKF), founded by local residents, manages the forest in partnership with Kenya Forest Service. Over 10,000 volunteers participate in monthly tree planting events. Schools bring students for environmental education, and the forest hosts community events that celebrate both nature and culture. Urban youth groups use the forest for mentorship and leadership programs.',
    traditionalUses: [
      'Urban sanctuary for meditation and spiritual reflection',
      'Environmental education for city schools',
      'Community gathering space for cultural events',
      'Traditional Kikuyu sacred sites preserved within',
      'Recreational trails for health and wellness',
    ],
    conservationChallenges: [
      'Urban development pressure on forest boundaries',
      'Waste dumping from surrounding neighborhoods',
      'Invasive plant species management',
      'Balancing public access with conservation needs',
      'Maintaining water quality in forest streams',
    ],
    successStories: [
      'Saved from development through community activism in 1998',
      'Over 1 million trees planted since 2009',
      'Eco-tourism generates funds for forest maintenance',
      '500,000+ annual visitors enjoy the forest sustainably',
      'Model for urban forest management across Africa',
      'Youth employment through eco-guides and forest rangers',
    ],
    area: '1,041 hectares',
    treesPlanted: 89000,
    activeInitiatives: 22,
    color: '#059669', // Forest green
    imageUrl: '/assets/images/forests/karura-forest.jpg',
    facts: [
      { label: 'Location', value: 'Heart of Nairobi' },
      { label: 'Visitors', value: '500,000+ annually' },
      { label: 'Trails', value: '50+ km of paths' },
      { label: 'Impact', value: 'Lungs of 4M+ people' },
    ],
  },
  {
    id: 'mau',
    name: 'Mau Forest Complex',
    localName: 'Msitu wa Mau',
    coordinates: [-0.5000, 35.5000],
    description: 'East Africa\'s largest water tower, the Mau Forest is the source of life for millions, feeding 12 rivers including those that sustain the Maasai Mara and Lake Victoria.',
    culturalSignificance: 'The Mau Forest is sacred to the Ogiek people, Kenya\'s indigenous forest-dwelling community who have lived in harmony with the forest for centuries. Known as "Embobut" in the Ogiek language, the forest is central to their identity, spirituality, and traditional way of life. The Ogiek\'s deep ecological knowledge and sustainable forest practices offer invaluable lessons in conservation.',
    ecologicalImportance: 'The Mau Forest Complex is Kenya\'s largest indigenous montane forest and East Africa\'s most important water catchment area. It feeds 12 major rivers that supply water to over 5 million people and support critical ecosystems including the Maasai Mara, Lake Nakuru, and Lake Victoria. The forest regulates regional climate, stores massive amounts of carbon, and harbors unique highland biodiversity including endangered species like the bongo antelope.',
    communityInvolvement: 'The Ogiek community, alongside other local groups, has formed conservation partnerships that blend traditional knowledge with modern science. Community scouts monitor forest health, women\'s groups cultivate indigenous tree nurseries, and youth participate in restoration projects. The Mau Forest Trust brings together diverse communities in a shared commitment to protect this vital ecosystem for future generations.',
    traditionalUses: [
      'Ogiek traditional honey harvesting from forest bees',
      'Sacred sites for Ogiek spiritual ceremonies',
      'Traditional medicine collection by indigenous healers',
      'Sustainable hunting grounds (historically)',
      'Cultural heritage sites and ancestral burial grounds',
    ],
    conservationChallenges: [
      'Historical deforestation and illegal settlements',
      'Complex land tenure and ownership disputes',
      'Climate change affecting water flow patterns',
      'Balancing conservation with community livelihoods',
      'Coordinating restoration across multiple forest blocks',
    ],
    successStories: [
      'Government-led restoration program has reclaimed 60,000+ hectares',
      'Ogiek community rights recognized by African Court on Human Rights',
      'Community-based tree nurseries produce 5M+ seedlings annually',
      'Water flow to downstream rivers increased by 30% since 2019',
      'Indigenous knowledge documentation preserves Ogiek forest wisdom',
      'Eco-tourism provides alternative livelihoods for 1,000+ families',
    ],
    area: '400,000 hectares',
    treesPlanted: 156000,
    activeInitiatives: 35,
    color: '#047857', // Deep green
    imageUrl: '/assets/images/forests/mau-forest.jpg',
    facts: [
      { label: 'Water Tower', value: 'Feeds 12 rivers' },
      { label: 'People Served', value: '5M+ depend on it' },
      { label: 'Indigenous', value: 'Ogiek ancestral land' },
      { label: 'Restoration', value: '60,000+ hectares' },
    ],
  },
];

/**
 * Get forest by ID
 */
export const getForestById = (id: string): ForestCulturalContext | undefined => {
  return PILOT_FORESTS.find(forest => forest.id === id);
};

/**
 * Get all forest names for quick reference
 */
export const getForestNames = (): string[] => {
  return PILOT_FORESTS.map(forest => forest.name);
};

/**
 * Get forest statistics summary
 */
export const getForestStatistics = () => {
  return {
    totalArea: PILOT_FORESTS.reduce((sum, forest) => {
      const hectares = parseInt(forest.area.replace(/,/g, ''));
      return sum + hectares;
    }, 0),
    totalTreesPlanted: PILOT_FORESTS.reduce((sum, forest) => sum + forest.treesPlanted, 0),
    totalInitiatives: PILOT_FORESTS.reduce((sum, forest) => sum + forest.activeInitiatives, 0),
    forestCount: PILOT_FORESTS.length,
  };
};
