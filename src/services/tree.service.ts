import { supabase } from './supabase';
import { antugrowService } from './antugrow.service';
import { governanceTokenEarningService } from './governanceTokenEarning.service';
import type {
  Tree,
  CreateTreeData,
  UpdateTreeData,
  TreeFilters,
  TreeStatistics,
  TreeResponse,
  TreesResponse,
  TreeImageResponse,
  TreeImagesResponse,
  TreeWithImages,
} from '../types/tree.types';

/**
 * Tree Service
 * Handles tree registry, monitoring, and statistics
 * Integrates with Antugrow API for AI-powered tree monitoring
 */
class TreeService {
  /**
   * Create a new tree record
   * Automatically registers with Antugrow if configured
   */
  async createTree(data: CreateTreeData): Promise<TreeResponse> {
    try {
      // Validate tree data
      const validationError = this.validateTreeData(data);
      if (validationError) {
        return { tree: null, error: validationError };
      }

      // Validate coordinates for Antugrow
      const coordValidationError = this.validateCoordinates(data.location.coordinates);
      if (coordValidationError) {
        return { tree: null, error: coordValidationError };
      }

      // Convert GeoPoint to PostGIS format
      const locationWKT = `POINT(${data.location.coordinates[0]} ${data.location.coordinates[1]})`;

      const { data: tree, error } = await supabase
        .from('trees')
        .insert({
          initiative_id: data.initiative_id,
          species: data.species,
          planted_date: data.planted_date,
          location: locationWKT,
          planted_by: data.planted_by,
          current_height_cm: data.current_height_cm,
          current_diameter_cm: data.current_diameter_cm,
        })
        .select()
        .single();

      if (error) {
        return { tree: null, error };
      }

      const formattedTree = this.formatTree(tree);

      // Register with Antugrow if configured
      if (antugrowService.isConfigured()) {
        await this.registerTreeWithAntugrow(formattedTree);
      }

      // Award governance tokens for tree planting (Requirement 1.1)
      if (data.planted_by) {
        await governanceTokenEarningService.awardForTreePlanting(
          data.planted_by,
          1, // 1 tree planted
          {
            tree_id: tree.id,
            species: data.species,
            initiative_id: data.initiative_id,
          }
        );
      }

      return { tree: formattedTree, error: null };
    } catch (error) {
      return {
        tree: null,
        error: error instanceof Error ? error : new Error('Failed to create tree'),
      };
    }
  }

  /**
   * Register tree with Antugrow API
   * Updates tree record with antugrow_id on success
   */
  private async registerTreeWithAntugrow(tree: Tree): Promise<void> {
    try {
      // Validate species is non-empty
      if (!tree.species || tree.species.trim().length === 0) {
        console.warn(`Skipping Antugrow registration for tree ${tree.id}: empty species`);
        return;
      }

      // Validate coordinates
      if (!tree.location || !tree.location.coordinates) {
        console.warn(`Skipping Antugrow registration for tree ${tree.id}: invalid location`);
        return;
      }

      const [longitude, latitude] = tree.location.coordinates;
      const coordError = this.validateCoordinates([longitude, latitude]);
      if (coordError) {
        console.warn(`Skipping Antugrow registration for tree ${tree.id}: ${coordError.message}`);
        return;
      }

      // Register with Antugrow
      const { data, error } = await antugrowService.registerTree({
        tree_id: tree.id,
        species: tree.species,
        location: {
          latitude,
          longitude,
        },
        planted_date: tree.planted_date,
      });

      if (error) {
        console.error(`Failed to register tree ${tree.id} with Antugrow:`, error);
        // Don't throw - tree creation should succeed even if Antugrow registration fails
        return;
      }

      if (data?.antugrow_id) {
        // Update tree with antugrow_id
        await supabase
          .from('trees')
          .update({ antugrow_id: data.antugrow_id })
          .eq('id', tree.id);

        console.log(`Tree ${tree.id} registered with Antugrow: ${data.antugrow_id}`);
      }
    } catch (error) {
      console.error(`Error registering tree ${tree.id} with Antugrow:`, error);
      // Don't throw - tree creation should succeed even if Antugrow registration fails
    }
  }

  /**
   * Register multiple trees with Antugrow sequentially
   * Processes trees one at a time to avoid rate limiting
   */
  async registerTreesWithAntugrow(treeIds: string[]): Promise<{
    succeeded: string[];
    failed: string[];
    errors: Record<string, string>;
  }> {
    const succeeded: string[] = [];
    const failed: string[] = [];
    const errors: Record<string, string> = {};

    if (!antugrowService.isConfigured()) {
      return {
        succeeded: [],
        failed: treeIds,
        errors: { _global: 'Antugrow API not configured' },
      };
    }

    // Process trees sequentially to avoid rate limiting
    for (const treeId of treeIds) {
      try {
        const { tree, error } = await this.getTree(treeId);

        if (error || !tree) {
          failed.push(treeId);
          errors[treeId] = error?.message || 'Tree not found';
          continue;
        }

        // Skip if already registered
        if (tree.antugrow_id) {
          succeeded.push(treeId);
          continue;
        }

        // Register with Antugrow
        await this.registerTreeWithAntugrow(tree);

        // Check if registration succeeded
        const { tree: updatedTree } = await this.getTree(treeId);
        if (updatedTree?.antugrow_id) {
          succeeded.push(treeId);
        } else {
          failed.push(treeId);
          errors[treeId] = 'Registration completed but antugrow_id not set';
        }
      } catch (error) {
        failed.push(treeId);
        errors[treeId] = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return { succeeded, failed, errors };
  }

  /**
   * Get tree by ID
   */
  async getTree(treeId: string): Promise<TreeResponse> {
    try {
      const { data, error } = await supabase
        .from('trees')
        .select('*')
        .eq('id', treeId)
        .single();

      if (error) {
        return { tree: null, error };
      }

      return { tree: this.formatTree(data), error: null };
    } catch (error) {
      return {
        tree: null,
        error: error instanceof Error ? error : new Error('Failed to fetch tree'),
      };
    }
  }

  /**
   * Get tree with images
   */
  async getTreeWithImages(treeId: string): Promise<{
    tree: TreeWithImages | null;
    error: Error | null;
  }> {
    try {
      const { tree, error: treeError } = await this.getTree(treeId);

      if (treeError || !tree) {
        return { tree: null, error: treeError };
      }

      const { images, error: imagesError } = await this.getTreeImages(treeId);

      if (imagesError) {
        return { tree: null, error: imagesError };
      }

      return {
        tree: {
          ...tree,
          images,
        },
        error: null,
      };
    } catch (error) {
      return {
        tree: null,
        error:
          error instanceof Error ? error : new Error('Failed to fetch tree with images'),
      };
    }
  }

  /**
   * Get all trees with optional filtering
   */
  async getTrees(filters?: TreeFilters): Promise<TreesResponse> {
    try {
      let query = supabase.from('trees').select('*');

      // Apply filters
      if (filters?.initiative_id) {
        query = query.eq('initiative_id', filters.initiative_id);
      }

      if (filters?.species) {
        query = query.eq('species', filters.species);
      }

      if (filters?.health_status) {
        query = query.eq('health_status', filters.health_status);
      }

      if (filters?.planted_by) {
        query = query.eq('planted_by', filters.planted_by);
      }

      if (filters?.search) {
        query = query.ilike('species', `%${filters.search}%`);
      }

      // Order by planted date (newest first)
      query = query.order('planted_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        return { trees: [], error };
      }

      const trees = data.map((item) => this.formatTree(item));
      return { trees, error: null };
    } catch (error) {
      return {
        trees: [],
        error: error instanceof Error ? error : new Error('Failed to fetch trees'),
      };
    }
  }

  /**
   * Get trees by initiative
   */
  async getTreesByInitiative(initiativeId: string): Promise<TreesResponse> {
    return this.getTrees({ initiative_id: initiativeId });
  }

  /**
   * Update tree
   */
  async updateTree(treeId: string, updates: UpdateTreeData): Promise<TreeResponse> {
    try {
      // Validate updates
      const validationError = this.validateUpdateData(updates);
      if (validationError) {
        return { tree: null, error: validationError };
      }

      const { data, error } = await supabase
        .from('trees')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', treeId)
        .select()
        .single();

      if (error) {
        return { tree: null, error };
      }

      return { tree: this.formatTree(data), error: null };
    } catch (error) {
      return {
        tree: null,
        error: error instanceof Error ? error : new Error('Failed to update tree'),
      };
    }
  }

  /**
   * Delete tree
   */
  async deleteTree(treeId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.from('trees').delete().eq('id', treeId);

      return { error };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Failed to delete tree'),
      };
    }
  }

  /**
   * Get tree images
   */
  async getTreeImages(treeId: string): Promise<TreeImagesResponse> {
    try {
      const { data, error } = await supabase
        .from('tree_images')
        .select('*')
        .eq('tree_id', treeId)
        .order('captured_at', { ascending: false });

      if (error) {
        return { images: [], error };
      }

      return { images: data, error: null };
    } catch (error) {
      return {
        images: [],
        error: error instanceof Error ? error : new Error('Failed to fetch tree images'),
      };
    }
  }

  /**
   * Add tree image
   */
  async addTreeImage(
    treeId: string,
    imageUrl: string,
    capturedAt?: string
  ): Promise<TreeImageResponse> {
    try {
      const { data, error } = await supabase
        .from('tree_images')
        .insert({
          tree_id: treeId,
          image_url: imageUrl,
          captured_at: capturedAt || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { image: null, error };
      }

      return { image: data, error: null };
    } catch (error) {
      return {
        image: null,
        error: error instanceof Error ? error : new Error('Failed to add tree image'),
      };
    }
  }

  /**
   * Delete tree image
   */
  async deleteTreeImage(imageId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.from('tree_images').delete().eq('id', imageId);

      return { error };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Failed to delete tree image'),
      };
    }
  }

  /**
   * Calculate tree statistics
   */
  async calculateStatistics(filters?: TreeFilters): Promise<TreeStatistics | null> {
    try {
      const { trees, error } = await this.getTrees(filters);

      if (error || trees.length === 0) {
        return null;
      }

      // Calculate statistics
      const bySpecies: Record<string, number> = {};
      const byHealthStatus: Record<string, number> = {
        healthy: 0,
        stressed: 0,
        diseased: 0,
        dead: 0,
      };
      const byInitiative: Record<string, number> = {};

      let totalHeight = 0;
      let totalDiameter = 0;
      let heightCount = 0;
      let diameterCount = 0;

      trees.forEach((tree) => {
        // Count by species
        bySpecies[tree.species] = (bySpecies[tree.species] || 0) + 1;

        // Count by health status
        if (tree.health_status) {
          byHealthStatus[tree.health_status] =
            (byHealthStatus[tree.health_status] || 0) + 1;
        }

        // Count by initiative
        byInitiative[tree.initiative_id] =
          (byInitiative[tree.initiative_id] || 0) + 1;

        // Sum heights and diameters
        if (tree.current_height_cm) {
          totalHeight += tree.current_height_cm;
          heightCount++;
        }

        if (tree.current_diameter_cm) {
          totalDiameter += tree.current_diameter_cm;
          diameterCount++;
        }
      });

      const healthyCount = byHealthStatus.healthy || 0;
      const healthyPercentage =
        trees.length > 0 ? Math.round((healthyCount / trees.length) * 100) : 0;

      return {
        total_trees: trees.length,
        by_species: bySpecies,
        by_health_status: byHealthStatus as any,
        by_initiative: byInitiative,
        average_height_cm: heightCount > 0 ? totalHeight / heightCount : undefined,
        average_diameter_cm:
          diameterCount > 0 ? totalDiameter / diameterCount : undefined,
        healthy_percentage: healthyPercentage,
      };
    } catch (error) {
      console.error('Error calculating tree statistics:', error);
      return null;
    }
  }

  /**
   * Search trees by species
   */
  async searchTrees(searchTerm: string): Promise<TreesResponse> {
    return this.getTrees({ search: searchTerm });
  }

  /**
   * Get unique species list
   */
  async getSpeciesList(): Promise<{ species: string[]; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('trees')
        .select('species')
        .order('species');

      if (error) {
        return { species: [], error };
      }

      // Get unique species
      const uniqueSpecies = [...new Set(data.map((item) => item.species))];

      return { species: uniqueSpecies, error: null };
    } catch (error) {
      return {
        species: [],
        error: error instanceof Error ? error : new Error('Failed to fetch species list'),
      };
    }
  }

  /**
   * Format tree data from database
   * Converts PostGIS location to GeoJSON format
   */
  private formatTree(data: any): Tree {
    // Parse location if it's in WKT format
    let location = data.location;
    if (typeof data.location === 'string') {
      // Extract coordinates from WKT POINT format
      const match = data.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) {
        location = {
          type: 'Point',
          coordinates: [parseFloat(match[1]), parseFloat(match[2])],
        };
      }
    }

    return {
      ...data,
      location,
    };
  }

  /**
   * Validate coordinates for Antugrow API
   * Ensures coordinates are within valid ranges
   */
  private validateCoordinates(coordinates: [number, number]): Error | null {
    const [longitude, latitude] = coordinates;

    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      return new Error('Coordinates must be numbers');
    }

    if (isNaN(longitude) || isNaN(latitude)) {
      return new Error('Invalid coordinates: NaN values');
    }

    if (latitude < -90 || latitude > 90) {
      return new Error('Latitude must be between -90 and 90 degrees');
    }

    if (longitude < -180 || longitude > 180) {
      return new Error('Longitude must be between -180 and 180 degrees');
    }

    return null;
  }

  /**
   * Validate tree creation data
   */
  private validateTreeData(data: CreateTreeData): Error | null {
    if (!data.species || data.species.trim().length === 0) {
      return new Error('Tree species is required');
    }

    if (data.species.length > 100) {
      return new Error('Species name must be less than 100 characters');
    }

    if (!data.planted_date) {
      return new Error('Planted date is required');
    }

    const plantedDate = new Date(data.planted_date);
    if (isNaN(plantedDate.getTime())) {
      return new Error('Invalid planted date');
    }

    if (plantedDate > new Date()) {
      return new Error('Planted date cannot be in the future');
    }

    if (!data.location || !data.location.coordinates) {
      return new Error('Location is required');
    }

    if (
      data.location.coordinates.length !== 2 ||
      typeof data.location.coordinates[0] !== 'number' ||
      typeof data.location.coordinates[1] !== 'number'
    ) {
      return new Error('Invalid location coordinates');
    }

    if (data.current_height_cm !== undefined && data.current_height_cm < 0) {
      return new Error('Height cannot be negative');
    }

    if (data.current_diameter_cm !== undefined && data.current_diameter_cm < 0) {
      return new Error('Diameter cannot be negative');
    }

    return null;
  }

  /**
   * Validate tree update data
   */
  private validateUpdateData(data: UpdateTreeData): Error | null {
    if (data.species !== undefined) {
      if (!data.species || data.species.trim().length === 0) {
        return new Error('Species cannot be empty');
      }

      if (data.species.length > 100) {
        return new Error('Species name must be less than 100 characters');
      }
    }

    if (data.current_height_cm !== undefined && data.current_height_cm < 0) {
      return new Error('Height cannot be negative');
    }

    if (data.current_diameter_cm !== undefined && data.current_diameter_cm < 0) {
      return new Error('Diameter cannot be negative');
    }

    return null;
  }
}

// Export singleton instance
export const treeService = new TreeService();
