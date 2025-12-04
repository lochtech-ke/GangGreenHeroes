import { treeService } from './tree.service';
import { antugrowService } from './antugrow.service';
import { ggCoinService, type RewardMultiplier } from './ggCoin.service';
import type { PlantedTree, TreePhoto } from '../types/platform.types';
import type { Tree, TreeImage, CreateTreeData } from '../types/tree.types';

/**
 * Tree Wallet Service
 * Manages user's Digital Tree Wallet with impact tracking and CO₂ calculations
 * Requirements: A8.1, A8.2, A8.3, A8.4, A8.5
 */
class TreeWalletService {
  /**
   * Get user's tree wallet with all planted trees
   * Requirements: A8.1, A8.2
   */
  async getUserTreeWallet(userId: string): Promise<{
    trees: PlantedTree[];
    totalTrees: number;
    totalCO2Sequestered: number;
    error: Error | null;
  }> {
    try {
      const { trees, error } = await treeService.getTrees({ planted_by: userId });

      if (error) {
        return {
          trees: [],
          totalTrees: 0,
          totalCO2Sequestered: 0,
          error,
        };
      }

      // Convert Tree[] to PlantedTree[] and calculate CO₂
      const plantedTrees = trees.map((tree) => this.convertToPlantedTree(tree));
      const totalCO2 = plantedTrees.reduce((sum, tree) => sum + tree.estimatedCO2, 0);

      return {
        trees: plantedTrees,
        totalTrees: plantedTrees.length,
        totalCO2Sequestered: totalCO2,
        error: null,
      };
    } catch (error) {
      return {
        trees: [],
        totalTrees: 0,
        totalCO2Sequestered: 0,
        error: error instanceof Error ? error : new Error('Failed to fetch tree wallet'),
      };
    }
  }

  /**
   * Plant a tree and award GG Coins
   * Integrates tree creation with reward system
   * Requirements: B3.1, B4.1
   */
  async plantTree(data: CreateTreeData): Promise<{
    tree: Tree | null;
    coinsAwarded: number;
    error: Error | null;
  }> {
    try {
      // Create tree record
      const { tree, error: treeError } = await treeService.createTree(data);

      if (treeError || !tree) {
        return {
          tree: null,
          coinsAwarded: 0,
          error: treeError || new Error('Failed to create tree'),
        };
      }

      // Determine multipliers based on tree data
      const multipliers: RewardMultiplier[] = [];

      // Check for photo verification
      if (data.current_height_cm || data.current_diameter_cm) {
        // If measurements are provided, assume photo verification
        multipliers.push({ condition: 'verified_with_photo', factor: 1.2 });
      }

      // Check for native species (this would need to be enhanced with actual native species list)
      // For now, we'll check if species metadata indicates it's native
      const nativeSpecies = [
        'acacia',
        'cedar',
        'mahogany',
        'teak',
        'bamboo',
        'indigenous',
        'native',
      ];
      const speciesLower = data.species.toLowerCase();
      const isNative = nativeSpecies.some((native) => speciesLower.includes(native));

      if (isNative) {
        multipliers.push({ condition: 'native_species', factor: 1.5 });
      }

      // Award GG Coins for tree planting
      const transaction = await ggCoinService.awardCoins(
        data.planted_by,
        'tree_planting',
        1, // Impact = 1 tree
        multipliers
      );

      const coinsAwarded = transaction?.amount || 0;

      return {
        tree,
        coinsAwarded,
        error: null,
      };
    } catch (error) {
      return {
        tree: null,
        coinsAwarded: 0,
        error: error instanceof Error ? error : new Error('Failed to plant tree'),
      };
    }
  }

  /**
   * Get detailed tree information with photos
   * Requirements: A8.4
   */
  async getTreeDetails(treeId: string): Promise<{
    tree: PlantedTree | null;
    photos: TreePhoto[];
    error: Error | null;
  }> {
    try {
      const { tree, error: treeError } = await treeService.getTree(treeId);

      if (treeError || !tree) {
        return {
          tree: null,
          photos: [],
          error: treeError || new Error('Tree not found'),
        };
      }

      const { images, error: imagesError } = await treeService.getTreeImages(treeId);

      if (imagesError) {
        return {
          tree: null,
          photos: [],
          error: imagesError,
        };
      }

      const plantedTree = this.convertToPlantedTree(tree);
      const photos = images.map((img) => this.convertToTreePhoto(img));

      return {
        tree: plantedTree,
        photos,
        error: null,
      };
    } catch (error) {
      return {
        tree: null,
        photos: [],
        error: error instanceof Error ? error : new Error('Failed to fetch tree details'),
      };
    }
  }

  /**
   * Calculate CO₂ sequestration for a tree
   * Based on species, age, height, and diameter
   * Requirements: A8.2
   */
  calculateCO2Sequestration(
    species: string,
    plantedDate: Date,
    height?: number,
    diameter?: number
  ): number {
    // Calculate tree age in years
    const ageInYears = this.calculateTreeAge(plantedDate);

    // Base CO₂ sequestration rates (kg/year) by species category
    const speciesRates: Record<string, number> = {
      // Fast-growing species
      eucalyptus: 25,
      bamboo: 30,
      acacia: 22,
      
      // Medium-growing species
      pine: 18,
      cedar: 16,
      cypress: 15,
      
      // Slow-growing species
      oak: 12,
      mahogany: 14,
      teak: 13,
      
      // Fruit trees
      mango: 10,
      avocado: 11,
      citrus: 9,
      
      // Default for unknown species
      default: 15,
    };

    // Get base rate for species (case-insensitive match)
    const speciesLower = species.toLowerCase();
    let baseRate = speciesRates.default;

    for (const [key, rate] of Object.entries(speciesRates)) {
      if (speciesLower.includes(key)) {
        baseRate = rate;
        break;
      }
    }

    // Age multiplier (trees sequester more CO₂ as they mature, up to ~20 years)
    let ageMultiplier = 1.0;
    if (ageInYears < 1) {
      ageMultiplier = 0.3; // Young saplings
    } else if (ageInYears < 3) {
      ageMultiplier = 0.6; // Establishing trees
    } else if (ageInYears < 5) {
      ageMultiplier = 0.85; // Growing trees
    } else if (ageInYears < 10) {
      ageMultiplier = 1.0; // Mature trees
    } else if (ageInYears < 20) {
      ageMultiplier = 1.2; // Peak sequestration
    } else {
      ageMultiplier = 1.0; // Older trees maintain steady rate
    }

    // Size multiplier based on height and diameter
    let sizeMultiplier = 1.0;
    if (height && diameter) {
      // Larger trees sequester more CO₂
      const heightFactor = Math.min(height / 1000, 2.0); // Normalize to meters, cap at 2x
      const diameterFactor = Math.min(diameter / 30, 2.0); // Normalize to cm, cap at 2x
      sizeMultiplier = (heightFactor + diameterFactor) / 2;
    }

    // Calculate annual CO₂ sequestration
    const annualCO2 = baseRate * ageMultiplier * sizeMultiplier;

    // Round to 2 decimal places
    return Math.round(annualCO2 * 100) / 100;
  }

  /**
   * Calculate tree age in years
   */
  private calculateTreeAge(plantedDate: Date): number {
    const now = new Date();
    const ageInMs = now.getTime() - plantedDate.getTime();
    const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0, ageInYears);
  }

  /**
   * Get wallet statistics
   * Requirements: A8.2
   */
  async getWalletStatistics(userId: string): Promise<{
    totalTrees: number;
    totalCO2Sequestered: number;
    healthyTrees: number;
    speciesCount: number;
    averageTreeAge: number;
    oldestTree: PlantedTree | null;
    newestTree: PlantedTree | null;
    error: Error | null;
  }> {
    try {
      const { trees, error } = await this.getUserTreeWallet(userId);

      if (error) {
        return {
          totalTrees: 0,
          totalCO2Sequestered: 0,
          healthyTrees: 0,
          speciesCount: 0,
          averageTreeAge: 0,
          oldestTree: null,
          newestTree: null,
          error,
        };
      }

      if (trees.length === 0) {
        return {
          totalTrees: 0,
          totalCO2Sequestered: 0,
          healthyTrees: 0,
          speciesCount: 0,
          averageTreeAge: 0,
          oldestTree: null,
          newestTree: null,
          error: null,
        };
      }

      // Calculate statistics
      const totalCO2 = trees.reduce((sum, tree) => sum + tree.estimatedCO2, 0);
      const healthyTrees = trees.filter((tree) => tree.healthStatus === 'healthy').length;
      const uniqueSpecies = new Set(trees.map((tree) => tree.species));
      
      // Calculate average age
      const totalAge = trees.reduce((sum, tree) => {
        return sum + this.calculateTreeAge(tree.plantedDate);
      }, 0);
      const averageAge = totalAge / trees.length;

      // Find oldest and newest trees
      const sortedByDate = [...trees].sort(
        (a, b) => a.plantedDate.getTime() - b.plantedDate.getTime()
      );
      const oldestTree = sortedByDate[0];
      const newestTree = sortedByDate[sortedByDate.length - 1];

      return {
        totalTrees: trees.length,
        totalCO2Sequestered: Math.round(totalCO2 * 100) / 100,
        healthyTrees,
        speciesCount: uniqueSpecies.size,
        averageTreeAge: Math.round(averageAge * 10) / 10,
        oldestTree,
        newestTree,
        error: null,
      };
    } catch (error) {
      return {
        totalTrees: 0,
        totalCO2Sequestered: 0,
        healthyTrees: 0,
        speciesCount: 0,
        averageTreeAge: 0,
        oldestTree: null,
        newestTree: null,
        error: error instanceof Error ? error : new Error('Failed to calculate statistics'),
      };
    }
  }

  /**
   * Generate shareable impact content
   * Requirements: A8.5
   */
  generateShareableContent(
    userName: string,
    totalTrees: number,
    totalCO2: number
  ): {
    text: string;
    hashtags: string[];
    imagePrompt: string;
  } {
    const co2Rounded = Math.round(totalCO2);
    
    // Generate engaging share text
    const text = `🌳 I've planted ${totalTrees} tree${totalTrees !== 1 ? 's' : ''} with #GangGreen, sequestering ${co2Rounded}kg of CO₂ annually! Join me in taking climate action. 🌍💚`;

    const hashtags = [
      '#GangGreen',
      '#ClimateAction',
      '#TreePlanting',
      '#CarbonSequestration',
      '#Kenya',
      '#Sustainability',
    ];

    const imagePrompt = `Digital Tree Wallet: ${totalTrees} trees planted, ${co2Rounded}kg CO₂/year`;

    return {
      text,
      hashtags,
      imagePrompt,
    };
  }

  /**
   * Convert Tree to PlantedTree format
   */
  private convertToPlantedTree(tree: Tree): PlantedTree {
    const plantedDate = new Date(tree.planted_date);
    
    // Calculate CO₂ sequestration
    const estimatedCO2 = this.calculateCO2Sequestration(
      tree.species,
      plantedDate,
      tree.current_height_cm,
      tree.current_diameter_cm
    );

    // Map health status
    let healthStatus: 'healthy' | 'needs_attention' | 'deceased' = 'healthy';
    if (tree.health_status === 'stressed' || tree.health_status === 'diseased') {
      healthStatus = 'needs_attention';
    } else if (tree.health_status === 'dead') {
      healthStatus = 'deceased';
    }

    return {
      id: tree.id,
      userId: tree.planted_by,
      species: tree.species,
      plantedDate,
      location: {
        name: '', // Will be populated from initiative or geocoding
        coordinates: tree.location.coordinates,
      },
      healthStatus,
      growthData: {
        height: tree.current_height_cm || 0,
        diameter: tree.current_diameter_cm || 0,
        lastMeasured: tree.last_monitored ? new Date(tree.last_monitored) : plantedDate,
      },
      estimatedCO2,
      createdAt: new Date(tree.created_at),
    };
  }

  /**
   * Convert TreeImage to TreePhoto format
   */
  private convertToTreePhoto(image: TreeImage): TreePhoto {
    return {
      id: image.id,
      treeId: image.tree_id,
      photoUrl: image.image_url,
      capturedAt: new Date(image.captured_at),
    };
  }

  /**
   * Sync growth data from Antugrow API
   * Updates tree health status and measurements
   * Requirements: A8.3
   */
  async syncTreeWithAntugrow(treeId: string): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      // Get tree from database
      const { tree, error: treeError } = await treeService.getTree(treeId);

      if (treeError || !tree) {
        return {
          success: false,
          error: treeError || new Error('Tree not found'),
        };
      }

      // Check if tree has Antugrow ID
      if (!tree.antugrow_id) {
        return {
          success: false,
          error: new Error('Tree not registered with Antugrow'),
        };
      }

      // Fetch growth data from Antugrow
      const { data: growthData, error: antugrowError } =
        await antugrowService.getGrowthData(tree.antugrow_id);

      if (antugrowError || !growthData) {
        return {
          success: false,
          error: antugrowError || new Error('Failed to fetch growth data'),
        };
      }

      // Update tree with Antugrow data
      const updates: any = {
        health_status: growthData.health_status,
        last_monitored: growthData.last_updated,
      };

      if (growthData.measurements.height_cm) {
        updates.current_height_cm = growthData.measurements.height_cm;
      }

      if (growthData.measurements.diameter_cm) {
        updates.current_diameter_cm = growthData.measurements.diameter_cm;
      }

      const { error: updateError } = await treeService.updateTree(treeId, updates);

      if (updateError) {
        return {
          success: false,
          error: updateError,
        };
      }

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to sync with Antugrow'),
      };
    }
  }

  /**
   * Sync all user's trees with Antugrow
   * Requirements: A8.3
   */
  async syncAllTreesWithAntugrow(userId: string): Promise<{
    synced: number;
    failed: number;
    errors: Record<string, string>;
  }> {
    const result = {
      synced: 0,
      failed: 0,
      errors: {} as Record<string, string>,
    };

    try {
      // Get all user's trees
      const { trees, error } = await treeService.getTrees({ planted_by: userId });

      if (error) {
        result.errors._global = error.message;
        return result;
      }

      // Sync each tree
      for (const tree of trees) {
        if (!tree.antugrow_id) {
          // Skip trees not registered with Antugrow
          continue;
        }

        const { success, error: syncError } = await this.syncTreeWithAntugrow(tree.id);

        if (success) {
          result.synced++;
        } else {
          result.failed++;
          if (syncError) {
            result.errors[tree.id] = syncError.message;
          }
        }

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return result;
    } catch (error) {
      result.errors._global =
        error instanceof Error ? error.message : 'Failed to sync trees';
      return result;
    }
  }

  /**
   * Analyze tree image with Antugrow AI
   * Requirements: A8.3
   */
  async analyzeTreeImage(
    treeId: string,
    imageUrl: string
  ): Promise<{
    analysis: {
      healthScore: number;
      growthRate: number;
      diseaseDetected: boolean;
      recommendations: string[];
    } | null;
    error: Error | null;
  }> {
    try {
      // Get tree from database
      const { tree, error: treeError } = await treeService.getTree(treeId);

      if (treeError || !tree) {
        return {
          analysis: null,
          error: treeError || new Error('Tree not found'),
        };
      }

      // Check if tree has Antugrow ID
      if (!tree.antugrow_id) {
        return {
          analysis: null,
          error: new Error('Tree not registered with Antugrow'),
        };
      }

      // Submit image for analysis
      const { data: analysisResult, error: analysisError } =
        await antugrowService.analyzeImage({
          tree_id: tree.antugrow_id,
          image_url: imageUrl,
          captured_at: new Date().toISOString(),
        });

      if (analysisError || !analysisResult) {
        return {
          analysis: null,
          error: analysisError || new Error('Failed to analyze image'),
        };
      }

      return {
        analysis: {
          healthScore: analysisResult.health_score,
          growthRate: analysisResult.growth_rate,
          diseaseDetected: analysisResult.disease_detected,
          recommendations: analysisResult.recommendations,
        },
        error: null,
      };
    } catch (error) {
      return {
        analysis: null,
        error: error instanceof Error ? error : new Error('Failed to analyze image'),
      };
    }
  }
}

// Export singleton instance
export const treeWalletService = new TreeWalletService();
