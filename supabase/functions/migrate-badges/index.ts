/**
 * Supabase Edge Function: Migrate Badges
 * 
 * Triggers badge migration for a user or all users.
 * Returns migration status and requires admin authentication.
 * 
 * Implements Requirements: 1.1, 9.1
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface MigrateBadgesRequest {
  userId?: string; // Optional: migrate specific user only
  batchSize?: number; // Default: 100
  dryRun?: boolean; // Default: false
  createBackup?: boolean; // Default: true
}

interface MigrationResponse {
  success: boolean;
  migrationId?: string;
  message?: string;
  status?: {
    inProgress: boolean;
    totalBadges: number;
    estimatedDuration?: number;
  };
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify user is admin (Requirement: admin authentication)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: MigrateBadgesRequest = await req.json();
    const {
      userId,
      batchSize = 100,
      dryRun = false,
      createBackup = true,
    } = body;

    console.log('[migrate-badges] Starting migration:', {
      userId: userId || 'all users',
      batchSize,
      dryRun,
      createBackup,
      requestedBy: user.id,
    });

    // Check if migration is already in progress
    const { data: existingMigration } = await supabase
      .from('badge_migration_log')
      .select('id, migration_id, status')
      .eq('status', 'in_progress')
      .single();

    if (existingMigration) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Migration already in progress',
          migrationId: existingMigration.migration_id,
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Count badges to migrate
    let badgeQuery = supabase
      .from('nft_badges')
      .select('id', { count: 'exact', head: true });

    if (userId) {
      badgeQuery = badgeQuery.eq('user_id', userId);
    }

    // Only migrate badges that haven't been migrated yet or are not geometric
    badgeQuery = badgeQuery.or('badge_type.is.null,badge_type.neq.geometric');

    const { count: totalBadges, error: countError } = await badgeQuery;

    if (countError) {
      console.error('[migrate-badges] Error counting badges:', countError);
      return new Response(
        JSON.stringify({
          error: 'Failed to count badges',
          details: countError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!totalBadges || totalBadges === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No badges to migrate',
          status: {
            inProgress: false,
            totalBadges: 0,
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Generate migration ID
    const migrationId = `migration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create migration log entry (Requirement 9.1)
    const { error: logError } = await supabase
      .from('badge_migration_log')
      .insert({
        migration_id: migrationId,
        started_at: new Date().toISOString(),
        status: dryRun ? 'dry_run' : 'in_progress',
        total_badges: totalBadges,
        migrated_badges: 0,
        failed_badges: 0,
        batch_size: batchSize,
        options: {
          userId,
          batchSize,
          dryRun,
          createBackup,
        },
        errors: [],
        created_by: user.id,
      });

    if (logError) {
      console.error('[migrate-badges] Error creating migration log:', logError);
      return new Response(
        JSON.stringify({
          error: 'Failed to create migration log',
          details: logError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[migrate-badges] Migration initiated:', {
      migrationId,
      totalBadges,
      batchSize,
      dryRun,
    });

    // If dry run, return immediately
    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          migrationId,
          message: 'Dry run completed - no changes made',
          status: {
            inProgress: false,
            totalBadges,
            estimatedDuration: Math.ceil((totalBadges / batchSize) * 2), // Estimate 2 seconds per batch
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Start migration process asynchronously
    // Note: In production, this would trigger a background job or queue
    // For now, we'll start the migration and return immediately
    startMigrationProcess(supabase, migrationId, userId, batchSize, createBackup);

    // Return success response
    const response: MigrationResponse = {
      success: true,
      migrationId,
      message: 'Migration started successfully',
      status: {
        inProgress: true,
        totalBadges,
        estimatedDuration: Math.ceil((totalBadges / batchSize) * 2),
      },
    };

    return new Response(JSON.stringify(response), {
      status: 202, // Accepted
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[migrate-badges] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Start migration process asynchronously
 * Note: In production, this would be a background job
 */
async function startMigrationProcess(
  supabase: any,
  migrationId: string,
  userId: string | undefined,
  batchSize: number,
  createBackup: boolean
): Promise<void> {
  try {
    console.log('[migrate-badges] Starting migration process:', migrationId);

    let migratedCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    // Fetch badges to migrate in batches
    let hasMore = true;
    let offset = 0;

    while (hasMore) {
      // Fetch batch of badges
      let badgeQuery = supabase
        .from('nft_badges')
        .select('*')
        .or('badge_type.is.null,badge_type.neq.geometric')
        .range(offset, offset + batchSize - 1);

      if (userId) {
        badgeQuery = badgeQuery.eq('user_id', userId);
      }

      const { data: badges, error: fetchError } = await badgeQuery;

      if (fetchError) {
        console.error('[migrate-badges] Error fetching badges:', fetchError);
        errors.push({
          batch: Math.floor(offset / batchSize) + 1,
          error: fetchError.message,
          timestamp: new Date().toISOString(),
        });
        break;
      }

      if (!badges || badges.length === 0) {
        hasMore = false;
        break;
      }

      // Create backup if requested
      if (createBackup) {
        await createBadgeBackups(supabase, badges, migrationId);
      }

      // Migrate each badge in the batch
      for (const badge of badges) {
        try {
          await migrateBadge(supabase, badge);
          migratedCount++;
        } catch (error) {
          console.error('[migrate-badges] Error migrating badge:', badge.id, error);
          failedCount++;
          errors.push({
            badgeId: badge.id,
            userId: badge.user_id,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Update migration log
      await supabase
        .from('badge_migration_log')
        .update({
          migrated_badges: migratedCount,
          failed_badges: failedCount,
          errors,
          updated_at: new Date().toISOString(),
        })
        .eq('migration_id', migrationId);

      offset += batchSize;

      // Add delay between batches to prevent overload
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Mark migration as completed
    await supabase
      .from('badge_migration_log')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        migrated_badges: migratedCount,
        failed_badges: failedCount,
        errors,
        updated_at: new Date().toISOString(),
      })
      .eq('migration_id', migrationId);

    console.log('[migrate-badges] Migration completed:', {
      migrationId,
      migratedCount,
      failedCount,
    });
  } catch (error) {
    console.error('[migrate-badges] Migration process error:', error);

    // Mark migration as failed
    await supabase
      .from('badge_migration_log')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        errors: [
          {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          },
        ],
        updated_at: new Date().toISOString(),
      })
      .eq('migration_id', migrationId);
  }
}

/**
 * Create backups for badges before migration
 */
async function createBadgeBackups(
  supabase: any,
  badges: any[],
  migrationId: string
): Promise<void> {
  try {
    const backups = badges.map((badge) => ({
      badge_id: badge.id,
      user_id: badge.user_id,
      original_data: badge,
      backup_date: new Date().toISOString(),
      migration_id: migrationId,
    }));

    // Note: This assumes a badge_backups table exists
    // In production, you would create this table in the migration
    await supabase.from('badge_backups').insert(backups);
  } catch (error) {
    console.error('[migrate-badges] Error creating backups:', error);
  }
}

/**
 * Migrate a single badge to geometric design
 */
async function migrateBadge(supabase: any, badge: any): Promise<void> {
  // Update badge to geometric type
  await supabase
    .from('nft_badges')
    .update({
      badge_type: 'geometric',
      migrated_at: new Date().toISOString(),
      migration_version: 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', badge.id);
}
