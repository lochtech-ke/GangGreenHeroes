
import React, { useState, useEffect } from 'react';
import { BadgeSvgService } from '../../services/badgeSvg.service';
import { hummingbirdBadgeService } from '../../services/hummingbirdBadge.service';
import { BadgeTier, ForestType, AchievementType } from '../../types/badge.types';

// Define Badge interface locally since it's not exported from badgePurchase.types
interface Badge {
    id: string;
    name: string;
    type: AchievementType;
    tier: BadgeTier;
    forest: ForestType;
}

interface ComparisonViewProps {
    badge: Badge;
    onClose: () => void;
}

export const BadgeComparisonView: React.FC<ComparisonViewProps> = ({ badge, onClose }) => {
    const [classicSvg, setClassicSvg] = useState<string | null>(null);
    const [geometricSvg, setGeometricSvg] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const generateBadges = async () => {
            setLoading(true);
            try {
                const badgeService = new BadgeSvgService();

                // Common metadata
                const metadata = {
                    badgeName: badge.name,
                    tierLevel: ['hummingbird', 'bronze', 'silver', 'gold', 'platinum', 'diamond'].indexOf(badge.tier),
                    forestName: badge.forest,
                    achievementType: badge.type,
                    achievementCount: 0,
                    earnedDate: new Date().toISOString(),
                    uniqueBadgeId: badge.id,
                    userId: 'comparison-preview',
                };

                // Generate Classic
                // Hummingbird logic is separate, let's assume we use standard logic for comparison for now except if it's hummingbird
                let classicResult;
                if (badge.tier === 'hummingbird' && badge.type === 'welcome_badge') {
                    const config = hummingbirdBadgeService.createDefaultHummingbirdConfig('preview', 'bronze', badge.forest);
                    classicResult = await hummingbirdBadgeService.generateHummingbirdBadge(config);
                } else {
                    classicResult = await badgeService.generateBadge({
                        id: badge.id,
                        tier: badge.tier,
                        forest: badge.forest,
                        achievement: badge.type,
                        metadata: { ...metadata, badgeStyle: 'classic' },
                        animated: false,
                        style: 'classic'
                    });
                }

                // Generate Geometric
                const geometricResult = await badgeService.generateBadge({
                    id: badge.id,
                    tier: badge.tier,
                    forest: badge.forest,
                    achievement: badge.type,
                    metadata: { ...metadata, badgeStyle: 'geometric' },
                    animated: false,
                    style: 'geometric'
                });

                if (classicResult.success) setClassicSvg(classicResult.svg || null);
                if (geometricResult.success) setGeometricSvg(geometricResult.svg || null);

            } catch (error) {
                console.error('Error generating comparison badges:', error);
            } finally {
                setLoading(false);
            }
        };

        generateBadges();
    }, [badge]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">Style Comparison</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Classic Style */}
                    <div className="flex flex-col items-center">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">Classic Style</h3>
                        <div className="w-full aspect-square bg-gray-50 rounded-lg p-6 flex items-center justify-center border border-gray-200">
                            {loading ? (
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                            ) : classicSvg ? (
                                <div
                                    className="w-full h-full drop-shadow-lg"
                                    dangerouslySetInnerHTML={{ __html: classicSvg }}
                                />
                            ) : (
                                <p className="text-gray-400">Preview not available</p>
                            )}
                        </div>
                        <p className="mt-4 text-sm text-gray-500 text-center">
                            The original illustrated design celebrating natural forms.
                        </p>
                    </div>

                    {/* Geometric Style */}
                    <div className="flex flex-col items-center">
                        <h3 className="text-lg font-semibold mb-4 text-green-700 flex items-center gap-2">
                            Geometric Style
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">New</span>
                        </h3>
                        <div className="w-full aspect-square bg-gray-50 rounded-lg p-6 flex items-center justify-center border-2 border-green-500 ring-4 ring-green-50/50">
                            {loading ? (
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                            ) : geometricSvg ? (
                                <div
                                    className="w-full h-full drop-shadow-lg"
                                    dangerouslySetInnerHTML={{ __html: geometricSvg }}
                                />
                            ) : (
                                <p className="text-gray-400">Preview not available</p>
                            )}
                        </div>
                        <p className="mt-4 text-sm text-gray-500 text-center">
                            A modern, low-poly interpretation focusing on structure and form.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Close Comparison
                    </button>
                </div>
            </div>
        </div>
    );
};
