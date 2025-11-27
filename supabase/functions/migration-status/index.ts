/**
 * Supabase Edge Function: Migration Status
 * 
 * Returns current migration status, progress percentage, and recent errors.
 * 
 * Implements Requirements: 9.4
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface MigrationStatusResponse {
  success: boolean;
  status?: {
    inProgress: boolean;
    migrationId?: string;
    progress: number; // 0-100
    currentBatch?: number;
    totalBatches?: number;
    totalBadges: number;
    migratedBadges: number;
    failedBadges: number;
    startedAt?: string;
    estimatedCompletion?: string;
    recentErrors: Array<{
      badgeId?: string;
      userId?: string;
      error: string;
      timestamp: string;
    }>;
  };
  history?: Array<{
    migrationId: string;
    status: string;
    totalBadges: number;
    migratedBadges: number;
    failedBadges: number;
    startedAt: string;
    completedAt?: string;
    duration?: number;
  }>;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Validate request method
    if (req.method !== 'GET') {
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

    // Parse URL to get query parameters
    const url = new URL(req.url);
    const includeHistory = url.searchParams.get('history') === 'true';
    const migrationId = url.searchParams.get('migrationId');

    console.log('[migration-status] Fetching migration status:', {
      userId: user.id,
      includeHistory,
      migrationId,
    });

    // If specific migration ID is provided, fetch that migration
    if (migrationId) {
      const { data: migration, error: fetchError } = await supabase
        .from('badge_migration_log')
        .select('*')
        .eq('migration_id', migrationId)
        .single();

      if (fetchError || !migration) {
        return new Response(
          JSON.stringify({ error: 'Migration not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: buildMigrationStatus(migration),
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

    // Fetch current migration (in progress)
    const { data: currentMigration, error: currentError } = await supabase
      .from('badge_migration_log')
      .select('*')
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    // If no current migration, check for most recent completed migration
    let status;
    if (!currentMigration) {
      const { data: lastMigration } = await supabase
        .from('badge_migration_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (lastMigration) {
        status = buildMigrationStatus(lastMigration);
      } else {
        // No migrations found
        status = {
          inProgress: false,
          progress: 0,
          totalBadges: 0,
          migratedBadges: 0,
          failedBadges: 0,
          recentErrors: [],
        };
      }
    } else {
      status = buildMigrationStatus(currentMigration);
    }

    // Fetch migration history if requested
    let history;
    if (includeHistory) {
      const { data: migrations, error: historyError } = await supabase
        .from('badge_migration_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (!historyError && migrations) {
        history = migrations.map((m: any) => ({
          migrationId: m.migration_id,
          status: m.status,
          totalBadges: m.total_badges,
          migratedBadges: m.migrated_badges,
          failedBadges: m.failed_badges,
          startedAt: m.started_at,
          completedAt: m.completed_at,
          duration: m.completed_at
            ? new Date(m.completed_at).getTime() - new Date(m.started_at).getTime()
            : undefined,
        }));
      }
    }

    console.log('[migration-status] Status fetched successfully:', {
      inProgress: status.inProgress,
      progress: status.progress,
      totalBadges: status.totalBadges,
    });

    // Return status response
    const response: MigrationStatusResponse = {
      success: true,
      status,
      history,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[migration-status] Error:', error);
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
 * Build migration status object from migration log entry
 */
function buildMigrationStatus(migration: any): any {
  const inProgress = migration.status === 'in_progress';
  const totalBadges = migration.total_badges || 0;
  const migratedBadges = migration.migrated_badges || 0;
  const failedBadges = migration.failed_badges || 0;
  const batchSize = migration.batch_size || 100;

  // Calculate progress percentage (Requirement 9.4)
  const progress = totalBadges > 0 ? Math.round((migratedBadges / totalBadges) * 100) : 0;

  // Calculate batches
  const totalBatches = Math.ceil(totalBadges / batchSize);
  const currentBatch = Math.ceil(migratedBadges / batchSize);

  // Calculate estimated completion time
  let estimatedCompletion;
  if (inProgress && migration.started_at) {
    const startTime = new Date(migration.started_at).getTime();
    const currentTime = new Date().getTime();
    const elapsed = currentTime - startTime;
    
    if (migratedBadges > 0) {
      const avgTimePerBadge = elapsed / migratedBadges;
      const remainingBadges = totalBadges - migratedBadges;
      const estimatedRemainingTime = avgTimePerBadge * remainingBadges;
      estimatedCompletion = new Date(currentTime + estimatedRemainingTime).toISOString();
    }
  }

  // Extract recent errors (Requirement 9.4)
  const recentErrors = Array.isArray(migration.errors)
    ? migration.errors.slice(-10).map((err: any) => ({
        badgeId: err.badgeId,
        userId: err.userId,
        error: err.error,
        timestamp: err.timestamp,
      }))
    : [];

  return {
    inProgress,
    migrationId: migration.migration_id,
    progress,
    currentBatch: inProgress ? currentBatch : undefined,
    totalBatches: inProgress ? totalBatches : undefined,
    totalBadges,
    migratedBadges,
    failedBadges,
    startedAt: migration.started_at,
    estimatedCompletion,
    recentErrors,
  };
}
