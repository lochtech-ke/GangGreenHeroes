
import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { badgeAnalyticsService, BadgeAnalytics } from '../../services/badgeAnalytics.service';
import { Download, TrendingUp, Award, Coins } from 'lucide-react';

export const BadgeAnalyticsDashboard: React.FC = () => {
    const [analytics, setAnalytics] = useState<BadgeAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const data = await badgeAnalyticsService.getAnalytics();
            setAnalytics(data);
        } catch (err) {
            setError('Failed to load analytics data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const csv = await badgeAnalyticsService.exportToCSV();
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `badge-analytics-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="text-center py-12 text-red-600 bg-red-50 rounded-lg">
                <p>{error || 'No data available'}</p>
                <button
                    onClick={fetchAnalytics}
                    className="mt-4 px-4 py-2 bg-white border border-red-200 rounded hover:bg-red-50"
                >
                    Retry
                </button>
            </div>
        );
    }

    // Formatting for charts
    const styleData = [
        { name: 'Geometric', value: analytics.salesByStyle.geometric || 0 },
        { name: 'Classic', value: analytics.salesByStyle.classic || 0 },
    ].filter(d => d.value > 0);

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#6366F1'];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Badge Analytics</h2>
                    <p className="text-gray-500">Overview of badge performance and user engagement</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            Revenue
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                        KES {analytics.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Total revenue generated</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Award size={24} />
                        </div>
                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            Sales
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                        {analytics.totalBadgesSold.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Total badges sold</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
                            <Coins size={24} />
                        </div>
                        <span className="text-sm font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                            Rewards
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                        {analytics.totalGGCoinsDistributed.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Total GG Coins distributed</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Popular Badges */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Popular Badges</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.salesByBadgeType.slice(0, 5)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="badge_type" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} name="Sales" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Style Preference */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Style Preference</h3>
                    <div className="flex items-center justify-center h-64">
                        {styleData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={styleData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {styleData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-400 text-sm">No style data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Transactions</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Badge</th>
                                <th className="px-4 py-3">Tier</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 text-right">Rewards</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {analytics.recentPurchases.map((purchase) => (
                                <tr key={purchase.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        {new Date(purchase.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 capitalize">
                                        {purchase.badge_type.replace(/_/g, ' ')}
                                    </td>
                                    <td className="px-4 py-3 capitalize">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                      ${purchase.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                                                purchase.tier === 'diamond' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {purchase.tier}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                                        KES {purchase.amount_kes.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right text-yellow-600 font-medium">
                                        +{purchase.gg_coins_awarded} GG
                                    </td>
                                </tr>
                            ))}
                            {analytics.recentPurchases.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-400">
                                        No recent transactions found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
