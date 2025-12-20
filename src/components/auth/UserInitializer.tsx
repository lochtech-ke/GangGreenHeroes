import { useEffect, useState } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import { ErrorLogger } from '../../utils/errorLogger';

/**
 * UserInitializer Component
 * 
 * Responsibilities:
 * 1. Ensure user profile exists after login (background process).
 * 2. Handle post-login initialization (badges, welcome notifications).
 * 
 * This component should be mounted in the main AppLayout or DashboardLayout 
 * so it runs for every authenticated user, but DOES NOT block the UI.
 */
export function UserInitializer() {
    const { user } = useAuthContext();
    const [isInitializing, setIsInitializing] = useState(false);
    const [hasRun, setHasRun] = useState(false);

    useEffect(() => {
        // Only run if we have a user, haven't run yet, and profile might be missing/incomplete
        if (!user || hasRun) return;

        // Check if profile is missing (common for new OAuth users)
        // or if we just want to ensure everything is synced.
        // Ideally, we check a flag or just run it idempotently.

        // We'll run it once per session mount if profile seems incomplete
        const needsInitialization = !user.profile?.full_name;

        if (needsInitialization) {
            initializeUser(user);
        } else {
            setHasRun(true);
        }
    }, [user, hasRun]);

    const initializeUser = async (currentUser: any) => {
        try {
            setIsInitializing(true);
            console.log('[UserInitializer] Starting background initialization...');

            // 1. Ensure Profile
            // Metadata extraction from auth user
            const metadata = {
                full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name,
                avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture,
            };

            await authService.ensureUserProfile(currentUser.id, metadata);

            console.log('[UserInitializer] Initialization complete.');
            // Optionally trigger a re-fetch of user context if needed, 
            // but usually auth listener handles this or we can rely on next page load.

        } catch (error) {
            console.error('[UserInitializer] Initialization failed:', error);
            ErrorLogger.logError('User Initializer Failed', error as Error, { userId: currentUser.id });
        } finally {
            setIsInitializing(false);
            setHasRun(true);
        }
    };

    // Render a small non-blocking indicator if initializing
    if (isInitializing) {
        return (
            <div className="fixed bottom-4 left-4 z-50 bg-white shadow-lg rounded-lg p-3 border border-green-100 flex items-center gap-3 animate-slide-up">
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm text-gray-700">Setting up your profile...</div>
            </div>
        );
    }

    return null;
}
