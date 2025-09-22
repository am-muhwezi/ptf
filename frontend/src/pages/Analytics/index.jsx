import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { formatCurrency, formatDate } from '../../utils/formatters';
import analyticsService from '../../services/analyticsService';

const Analytics = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalMembers: 0,
      activeMembers: 0,
      totalRevenue: 0,
      monthlyGrowth: 0,
      averageSessionsPerMember: 0,
      memberRetentionRate: 0
    },
    membershipBreakdown: {
      indoor: {
        total: 0,
        active: 0,
        suspended: 0,
        expired: 0,
        revenue: 0,
        averageMonthlyFee: 0
      },
      outdoor: {
        total: 0,
        active: 0,
        suspended: 0,
        expired: 0,
        revenue: 0,
        averageWeeklyFee: 0
      }
    },
    outdoorAnalytics: {
      locations: [],
      attendance: {
        daily_avg: 0,
        peak_days: [],
        monthly_visits: 0
      },
      revenue_trend: []
    },
    attendanceAnalytics: {
      dailyAverage: 0,
      weeklyTotal: 0,
      monthlyTotal: 0,
      indoorVisits: 0,
      outdoorVisits: 0,
      averageSessionDuration: 0,
      locationBreakdown: []
    },
    revenueAnalytics: {
      total: 0,
      monthly: 0,
      growth: 0,
      trend: [],
      planPerformance: []
    }
  });

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        // Use the new comprehensive analytics endpoint
        const response = await analyticsService.getComprehensiveAnalytics(selectedTimeframe);

        if (response.success) {
          // Set the complete analytics data from the backend
          setAnalyticsData(response.data);
        } else {
          throw new Error('Failed to load analytics data');
        }
      } catch (error) {
        console.error('Failed to load analytics data:', error);

        // Handle authentication errors specifically
        if (error.message.includes('session has expired') || error.message.includes('Authentication')) {
          showToast('Please sign in to view analytics data.', 'error');
        } else {
          showToast('Failed to load analytics data. Please try again.', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedTimeframe]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const handleGenerateReport = (reportType) => {
    setSelectedReport(reportType);
    setShowReportModal(true);
  };

  const handleExportReport = async (reportType, format = 'pdf') => {
    try {
      showToast(`Generating ${reportType} report in ${format.toUpperCase()} format...`, 'info');

      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      showToast(`${reportType} report exported successfully!`, 'success');
      setShowReportModal(false);
    } catch (error) {
      showToast('Failed to generate report', 'error');
    }
  };

  const getGrowthIndicator = (value) => {
    if (value > 0) {
      return (
        <span className="inline-flex items-center text-green-600 text-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          +{value}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-red-600 text-sm">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
        {value}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600 mt-1">Comprehensive insights into gym performance and member analytics</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
                <Button
                  variant="primary"
                  onClick={() => handleGenerateReport('comprehensive')}
                >
                  Generate Report
                </Button>
              </div>
            </div>

            {/* Key Performance Indicators */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Key Performance Indicators</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                  title="Total Members"
                  value={analyticsData.overview.totalMembers}
                  subtitle={
                    <div className="flex items-center justify-between">
                      <span>{analyticsData.overview.activeMembers} active</span>
                      {getGrowthIndicator(analyticsData.overview.monthlyGrowth)}
                    </div>
                  }
                  className="border-blue-200"
                />
                <Card
                  title="Total Revenue"
                  value={formatCurrency(analyticsData.overview.totalRevenue)}
                  subtitle="All time revenue"
                  className="border-green-200"
                />
                <Card
                  title="Avg Sessions/Member"
                  value={analyticsData.overview.averageSessionsPerMember}
                  subtitle="Per month"
                  className="border-purple-200"
                />
                <Card
                  title="Retention Rate"
                  value={`${analyticsData.overview.memberRetentionRate}%`}
                  subtitle="Member retention"
                  className="border-emerald-200"
                />
              </div>
            </section>

            {/* Membership Analytics */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Membership Analytics</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Indoor Memberships */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Indoor Memberships</h3>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleGenerateReport('indoor')}
                    >
                      Export Report
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-900">
                          {analyticsData.membershipBreakdown.indoor.total}
                        </div>
                        <div className="text-sm text-blue-700">Total Members</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-900">
                          {analyticsData.membershipBreakdown.indoor.active}
                        </div>
                        <div className="text-sm text-green-700">Active Members</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-medium">{formatCurrency(analyticsData.membershipBreakdown.indoor.revenue)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Monthly Fee:</span>
                        <span className="font-medium">{formatCurrency(analyticsData.membershipBreakdown.indoor.averageMonthlyFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Suspended:</span>
                        <span className="font-medium text-yellow-600">{analyticsData.membershipBreakdown.indoor.suspended}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Expired:</span>
                        <span className="font-medium text-red-600">{analyticsData.membershipBreakdown.indoor.expired}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outdoor Memberships */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Outdoor Memberships</h3>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleGenerateReport('outdoor')}
                    >
                      Export Report
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-900">
                          {analyticsData.membershipBreakdown.outdoor.total}
                        </div>
                        <div className="text-sm text-green-700">Total Members</div>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-emerald-900">
                          {analyticsData.membershipBreakdown.outdoor.active}
                        </div>
                        <div className="text-sm text-emerald-700">Active Members</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-medium">{formatCurrency(analyticsData.membershipBreakdown.outdoor.revenue)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Weekly Fee:</span>
                        <span className="font-medium">{formatCurrency(analyticsData.membershipBreakdown.outdoor.averageWeeklyFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Suspended:</span>
                        <span className="font-medium text-yellow-600">{analyticsData.membershipBreakdown.outdoor.suspended}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Expired:</span>
                        <span className="font-medium text-red-600">{analyticsData.membershipBreakdown.outdoor.expired}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Location Performance Analytics */}
                {analyticsData.outdoorAnalytics.locations.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Location Performance Analysis</h3>
                        <p className="text-sm text-gray-600 mt-1">Detailed insights into each location's performance and utilization</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => handleGenerateReport('location-performance')}
                        >
                          Performance Report
                        </Button>
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => handleGenerateReport('locations')}
                        >
                          Detailed Analysis
                        </Button>
                      </div>
                    </div>

                    {/* Location Performance Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-900">
                          {analyticsData.outdoorAnalytics.locations.length}
                        </div>
                        <div className="text-blue-700 font-medium">Active Locations</div>
                        <div className="text-sm text-blue-600 mt-1">Currently operating</div>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-900">
                          {Math.round(analyticsData.outdoorAnalytics.locations.reduce((sum, loc) => sum + loc.utilization, 0) / analyticsData.outdoorAnalytics.locations.length)}%
                        </div>
                        <div className="text-green-700 font-medium">Average Utilization</div>
                        <div className="text-sm text-green-600 mt-1">Across all locations</div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-900">
                          {formatCurrency(analyticsData.outdoorAnalytics.locations.reduce((sum, loc) => sum + loc.revenue, 0))}
                        </div>
                        <div className="text-purple-700 font-medium">Total Location Revenue</div>
                        <div className="text-sm text-purple-600 mt-1">All outdoor locations</div>
                      </div>
                    </div>

                    {/* Individual Location Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {analyticsData.outdoorAnalytics.locations
                        .sort((a, b) => b.utilization - a.utilization)
                        .map((location, index) => {
                          const performanceLevel = location.utilization >= 80 ? 'excellent' :
                                                 location.utilization >= 60 ? 'good' :
                                                 location.utilization >= 40 ? 'average' : 'needs-attention';

                          const performanceColors = {
                            excellent: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100' },
                            good: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100' },
                            average: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-100' },
                            'needs-attention': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100' }
                          };

                          const colors = performanceColors[performanceLevel];
                          const revenuePerMember = location.members > 0 ? location.revenue / location.members : 0;

                          return (
                            <div key={location.id} className={`${colors.bg} ${colors.border} border-2 rounded-lg p-4 transition-all hover:shadow-md`}>
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900">{location.name}</h4>
                                  {index === 0 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                                      </svg>
                                      Top Performer
                                    </span>
                                  )}
                                </div>
                                <span className={`text-xs px-2 py-1 ${colors.badge} ${colors.text} rounded-full font-medium`}>
                                  {location.utilization}% utilized
                                </span>
                              </div>

                              <div className="space-y-3">
                                {/* Key Metrics */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="text-center bg-white rounded-lg p-2">
                                    <div className="text-lg font-bold text-gray-900">{location.members}</div>
                                    <div className="text-xs text-gray-600">Total Members</div>
                                  </div>
                                  <div className="text-center bg-white rounded-lg p-2">
                                    <div className="text-lg font-bold text-gray-900">{location.active}</div>
                                    <div className="text-xs text-gray-600">Active Members</div>
                                  </div>
                                </div>

                                {/* Revenue Metrics */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total Revenue:</span>
                                    <span className="font-semibold">{formatCurrency(location.revenue)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Revenue/Member:</span>
                                    <span className="font-semibold">{formatCurrency(revenuePerMember)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Active Rate:</span>
                                    <span className="font-semibold">
                                      {location.members > 0 ? Math.round((location.active / location.members) * 100) : 0}%
                                    </span>
                                  </div>
                                </div>

                                {/* Performance Bar */}
                                <div>
                                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Performance</span>
                                    <span>{performanceLevel.replace('-', ' ')}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all duration-500 ${
                                        performanceLevel === 'excellent' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                                        performanceLevel === 'good' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                                        performanceLevel === 'average' ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
                                        'bg-gradient-to-r from-red-500 to-pink-600'
                                      }`}
                                      style={{ width: `${location.utilization}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Performance Insights */}
                                <div className="bg-white rounded-lg p-2">
                                  <div className="text-xs font-medium text-gray-700 mb-1">Performance Insights:</div>
                                  <div className="text-xs text-gray-600">
                                    {performanceLevel === 'excellent' && "🎯 Excellent performance! This location is operating at peak efficiency."}
                                    {performanceLevel === 'good' && "✅ Good performance with room for optimization."}
                                    {performanceLevel === 'average' && "⚠️ Average performance. Consider member engagement initiatives."}
                                    {performanceLevel === 'needs-attention' && "🚨 Needs attention. Low utilization requires immediate action."}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Performance Recommendations */}
                    <div className="mt-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Performance Recommendations
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-green-700 mb-1">🎯 Top Performing Locations:</div>
                          <ul className="text-gray-600 space-y-1">
                            {analyticsData.outdoorAnalytics.locations
                              .filter(loc => loc.utilization >= 70)
                              .slice(0, 2)
                              .map(loc => (
                                <li key={loc.id}>• {loc.name} ({loc.utilization}% utilization)</li>
                              ))}
                          </ul>
                        </div>
                        <div>
                          <div className="font-medium text-yellow-700 mb-1">⚠️ Areas for Improvement:</div>
                          <ul className="text-gray-600 space-y-1">
                            {analyticsData.outdoorAnalytics.locations
                              .filter(loc => loc.utilization < 50)
                              .slice(0, 2)
                              .map(loc => (
                                <li key={loc.id}>• {loc.name} needs member engagement boost</li>
                              ))}
                            {analyticsData.outdoorAnalytics.locations.filter(loc => loc.utilization < 50).length === 0 && (
                              <li>• All locations performing well!</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Payment Analytics */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card
                  title="Total Payments"
                  value={analyticsData.paymentAnalytics?.totalPayments || 0}
                  subtitle={`${analyticsData.paymentAnalytics?.completedPayments || 0} completed`}
                  className="border-blue-200"
                />
                <Card
                  title="Pending Payments"
                  value={analyticsData.paymentAnalytics?.pendingPayments || 0}
                  subtitle="Awaiting confirmation"
                  className="border-yellow-200"
                />
                <Card
                  title="Overdue Payments"
                  value={analyticsData.paymentAnalytics?.overduePayments || 0}
                  subtitle="Require attention"
                  className="border-red-200"
                />
                <Card
                  title="Avg Payment Value"
                  value={formatCurrency(analyticsData.paymentAnalytics?.averagePaymentValue || 0)}
                  subtitle="Per transaction"
                  className="border-green-200"
                />
              </div>

              {/* Payment Methods Breakdown */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Methods Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analyticsData.paymentAnalytics?.paymentMethods || {}).map(([method, percentage]) => (
                    <div key={method} className="text-center">
                      <div className="relative w-20 h-20 mx-auto mb-2">
                        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3"
                            strokeDasharray={`${percentage}, 100`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-900">{percentage}%</span>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900 capitalize">{method}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Revenue Analytics - Focused on Outdoor */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Analytics</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Outdoor Revenue Trend */}
                {analyticsData.outdoorAnalytics.revenue_trend.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Outdoor Revenue Trend</h3>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => handleGenerateReport('outdoor-revenue')}
                      >
                        Export Chart
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {analyticsData.outdoorAnalytics.revenue_trend.map((month, index) => {
                        const maxRevenue = Math.max(...analyticsData.outdoorAnalytics.revenue_trend.map(m => m.amount));
                        return (
                          <div key={month.month} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 text-sm font-medium text-gray-600">{month.month}</div>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${(month.amount / maxRevenue) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(month.amount)}
                              </div>
                              <div className="text-xs text-gray-500">Outdoor revenue</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Plan Performance */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Plan Performance</h3>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleGenerateReport('plans')}
                    >
                      Detailed View
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {analyticsData.revenueAnalytics.planPerformance.length > 0 ? (
                      analyticsData.revenueAnalytics.planPerformance.map((plan, index) => {
                        const maxRevenue = Math.max(...analyticsData.revenueAnalytics.planPerformance.map(p => p.revenue));
                        return (
                          <div key={plan.plan} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium text-gray-900">{plan.plan}</div>
                                <div className="text-sm text-gray-600">{plan.members} members</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-gray-900">{formatCurrency(plan.revenue)}</div>
                                <div className="text-xs text-gray-500">
                                  {plan.members > 0 ? formatCurrency(plan.revenue / plan.members) : formatCurrency(0)} avg/member
                                </div>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${maxRevenue > 0 ? (plan.revenue / maxRevenue) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        No plan performance data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Attendance Analytics - Focused on Outdoor */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Outdoor Activity Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card
                  title="Daily Average"
                  value={analyticsData.attendanceAnalytics.dailyAverage}
                  subtitle="Outdoor check-ins per day"
                  className="border-green-200"
                />
                <Card
                  title="Weekly Total"
                  value={analyticsData.attendanceAnalytics.weeklyTotal}
                  subtitle="This week's outdoor visits"
                  className="border-green-200"
                />
                <Card
                  title="Outdoor Visits"
                  value={analyticsData.attendanceAnalytics.outdoorVisits}
                  subtitle="This month"
                  className="border-emerald-200"
                />
                <Card
                  title="Avg Session Duration"
                  value={`${analyticsData.attendanceAnalytics.averageSessionDuration} min`}
                  subtitle="Outdoor sessions"
                  className="border-teal-200"
                />
              </div>

              {/* Location Breakdown */}
              {analyticsData.attendanceAnalytics.locationBreakdown.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Location Activity Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analyticsData.attendanceAnalytics.locationBreakdown.map((location, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-900">{location.location}</h4>
                          <span className="text-sm text-green-600 font-medium">{location.utilization}%</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{location.visits}</div>
                        <div className="text-sm text-gray-600 mb-3">Monthly visits</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${location.utilization}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Peak Days for Outdoor Activities */}
              {analyticsData.outdoorAnalytics.attendance.peak_days.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Peak Activity Days</h3>
                  <div className="flex flex-wrap gap-3">
                    {analyticsData.outdoorAnalytics.attendance.peak_days.map((day, index) => (
                      <div key={index} className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    Outdoor activities see highest participation on these days
                  </div>
                </div>
              )}
            </section>

            {/* Outdoor Member Engagement Summary */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Outdoor Member Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card
                  title="Total Outdoor Members"
                  value={analyticsData.membershipBreakdown.outdoor.total}
                  subtitle="All outdoor memberships"
                  className="border-green-200"
                />
                <Card
                  title="Active Members"
                  value={analyticsData.membershipBreakdown.outdoor.active}
                  subtitle="Currently active"
                  className="border-emerald-200"
                />
                <Card
                  title="Suspended/Expired"
                  value={analyticsData.membershipBreakdown.outdoor.suspended + analyticsData.membershipBreakdown.outdoor.expired}
                  subtitle="Need attention"
                  className="border-yellow-200"
                />
              </div>

              <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Outdoor Performance Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-green-900 mb-2">
                      {formatCurrency(analyticsData.membershipBreakdown.outdoor.revenue)}
                    </div>
                    <div className="text-green-700 font-medium">Total Outdoor Revenue</div>
                    <div className="text-sm text-green-600 mt-1">All outdoor memberships</div>
                  </div>
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-teal-900 mb-2">
                      {analyticsData.outdoorAnalytics.attendance.daily_avg}
                    </div>
                    <div className="text-teal-700 font-medium">Daily Average Attendance</div>
                    <div className="text-sm text-teal-600 mt-1">Outdoor activities per day</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Report Generation</h2>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateReport('membership')}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm font-medium">Membership Report</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleGenerateReport('financial')}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="text-sm font-medium">Financial Report</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleGenerateReport('attendance')}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-sm font-medium">Attendance Report</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleGenerateReport('comprehensive')}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium">Full Report</span>
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Report Generation Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Generate Report"
        size="medium"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedReport && selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report
            </h3>
            <p className="text-gray-600">
              Generate a detailed {selectedReport} report for the selected timeframe.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Format
            </label>
            <div className="grid grid-cols-3 gap-4">
              {['PDF', 'Excel', 'CSV'].map((format) => (
                <button
                  key={format}
                  onClick={() => handleExportReport(selectedReport, format.toLowerCase())}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="text-lg font-medium text-gray-900">{format}</div>
                  <div className="text-xs text-gray-500">
                    {format === 'PDF' ? 'Formatted report' :
                     format === 'Excel' ? 'Spreadsheet format' :
                     'Raw data export'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Report Contents</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {selectedReport === 'membership' && (
                <>
                  <li>• Member demographics and statistics</li>
                  <li>• Indoor vs outdoor membership breakdown</li>
                  <li>• Membership status analysis</li>
                  <li>• Growth trends and projections</li>
                </>
              )}
              {selectedReport === 'financial' && (
                <>
                  <li>• Revenue breakdown by membership type</li>
                  <li>• Payment status analysis</li>
                  <li>• Monthly revenue trends</li>
                  <li>• Outstanding payments report</li>
                </>
              )}
              {selectedReport === 'attendance' && (
                <>
                  <li>• Daily and weekly attendance patterns</li>
                  <li>• Peak hours analysis</li>
                  <li>• Member engagement metrics</li>
                  <li>• Facility utilization rates</li>
                </>
              )}
              {selectedReport === 'comprehensive' && (
                <>
                  <li>• Complete gym performance overview</li>
                  <li>• All membership and payment data</li>
                  <li>• Attendance and engagement metrics</li>
                  <li>• Executive summary and recommendations</li>
                </>
              )}
            </ul>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowReportModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={hideToast}
      />
    </div>
  );
};

export default Analytics;