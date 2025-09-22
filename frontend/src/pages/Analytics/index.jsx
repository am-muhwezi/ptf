import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { formatCurrency, formatDate } from '../../utils/formatters';

const Analytics = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Mock analytics data - replace with real API calls later
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalMembers: 245,
      activeMembers: 198,
      totalRevenue: 18500000,
      monthlyGrowth: 12.5,
      averageSessionsPerMember: 8.3,
      memberRetentionRate: 87.2
    },
    membershipBreakdown: {
      indoor: {
        total: 156,
        active: 142,
        suspended: 8,
        expired: 6,
        revenue: 12400000,
        averageMonthlyFee: 8500
      },
      outdoor: {
        total: 89,
        active: 76,
        suspended: 5,
        expired: 8,
        revenue: 6100000,
        averageWeeklyFee: 4200
      }
    },
    paymentAnalytics: {
      totalPayments: 1247,
      completedPayments: 1089,
      pendingPayments: 98,
      overduePayments: 60,
      totalRevenue: 18500000,
      monthlyRevenue: 3200000,
      averagePaymentValue: 14836,
      paymentMethods: {
        cash: 45,
        mpesa: 35,
        bankTransfer: 15,
        card: 5
      }
    },
    attendanceAnalytics: {
      dailyAverage: 47,
      weeklyTotal: 329,
      monthlyTotal: 1456,
      peakHours: ['06:00-08:00', '17:00-19:00'],
      indoorVisits: 892,
      outdoorVisits: 564,
      averageSessionDuration: 85
    },
    revenueAnalytics: {
      monthlyTrend: [
        { month: 'Jan', revenue: 2800000, members: 210 },
        { month: 'Feb', revenue: 3100000, members: 225 },
        { month: 'Mar', revenue: 2950000, members: 220 },
        { month: 'Apr', revenue: 3200000, members: 235 },
        { month: 'May', revenue: 3400000, members: 245 }
      ],
      planPerformance: [
        { plan: 'Indoor Monthly', members: 89, revenue: 7120000 },
        { plan: 'Indoor Quarterly', members: 34, revenue: 3400000 },
        { plan: 'Outdoor Weekly', members: 45, revenue: 1890000 },
        { plan: 'Outdoor Monthly', members: 31, revenue: 1550000 }
      ]
    },
    memberEngagement: {
      highlyActive: 67, // 15+ visits per month
      moderatelyActive: 98, // 8-14 visits per month
      lowActivity: 33, // <8 visits per month
      newMemberRetention: 78.5, // % of new members still active after 3 months
      averageLifetimeValue: 245000
    }
  });

  useEffect(() => {
    // Simulate API loading
    const loadAnalytics = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
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
              </div>
            </section>

            {/* Payment Analytics */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card
                  title="Total Payments"
                  value={analyticsData.paymentAnalytics.totalPayments}
                  subtitle={`${analyticsData.paymentAnalytics.completedPayments} completed`}
                  className="border-blue-200"
                />
                <Card
                  title="Pending Payments"
                  value={analyticsData.paymentAnalytics.pendingPayments}
                  subtitle="Awaiting confirmation"
                  className="border-yellow-200"
                />
                <Card
                  title="Overdue Payments"
                  value={analyticsData.paymentAnalytics.overduePayments}
                  subtitle="Require attention"
                  className="border-red-200"
                />
                <Card
                  title="Avg Payment Value"
                  value={formatCurrency(analyticsData.paymentAnalytics.averagePaymentValue)}
                  subtitle="Per transaction"
                  className="border-green-200"
                />
              </div>

              {/* Payment Methods Breakdown */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Methods Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analyticsData.paymentAnalytics.paymentMethods).map(([method, percentage]) => (
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

            {/* Revenue Analytics */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Analytics</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Revenue Trend */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue Trend</h3>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleGenerateReport('revenue')}
                    >
                      Export Chart
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {analyticsData.revenueAnalytics.monthlyTrend.map((month, index) => (
                      <div key={month.month} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 text-sm font-medium text-gray-600">{month.month}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(month.revenue / 3500000) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(month.revenue)}
                          </div>
                          <div className="text-xs text-gray-500">{month.members} members</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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
                    {analyticsData.revenueAnalytics.planPerformance.map((plan, index) => (
                      <div key={plan.plan} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium text-gray-900">{plan.plan}</div>
                            <div className="text-sm text-gray-600">{plan.members} members</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">{formatCurrency(plan.revenue)}</div>
                            <div className="text-xs text-gray-500">
                              {formatCurrency(plan.revenue / plan.members)} avg/member
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(plan.revenue / 8000000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Attendance Analytics */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Attendance Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card
                  title="Daily Average"
                  value={analyticsData.attendanceAnalytics.dailyAverage}
                  subtitle="Check-ins per day"
                />
                <Card
                  title="Weekly Total"
                  value={analyticsData.attendanceAnalytics.weeklyTotal}
                  subtitle="This week's visits"
                />
                <Card
                  title="Indoor Visits"
                  value={analyticsData.attendanceAnalytics.indoorVisits}
                  subtitle="This month"
                  className="border-blue-200"
                />
                <Card
                  title="Outdoor Visits"
                  value={analyticsData.attendanceAnalytics.outdoorVisits}
                  subtitle="This month"
                  className="border-green-200"
                />
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Peak Hours Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Busiest Times</h4>
                    <div className="space-y-2">
                      {analyticsData.attendanceAnalytics.peakHours.map((hour, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-900">{hour}</span>
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Peak</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Session Metrics</h4>
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-gray-900">
                          {analyticsData.attendanceAnalytics.averageSessionDuration} min
                        </div>
                        <div className="text-sm text-gray-600">Average Session Duration</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-gray-900">
                          {analyticsData.attendanceAnalytics.monthlyTotal}
                        </div>
                        <div className="text-sm text-gray-600">Monthly Total Visits</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Member Engagement */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Member Engagement</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card
                  title="Highly Active"
                  value={analyticsData.memberEngagement.highlyActive}
                  subtitle="15+ visits/month"
                  className="border-green-200"
                />
                <Card
                  title="Moderately Active"
                  value={analyticsData.memberEngagement.moderatelyActive}
                  subtitle="8-14 visits/month"
                  className="border-yellow-200"
                />
                <Card
                  title="Low Activity"
                  value={analyticsData.memberEngagement.lowActivity}
                  subtitle="<8 visits/month"
                  className="border-red-200"
                />
              </div>

              <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Member Lifetime Value</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-emerald-900 mb-2">
                      {formatCurrency(analyticsData.memberEngagement.averageLifetimeValue)}
                    </div>
                    <div className="text-emerald-700 font-medium">Average Lifetime Value</div>
                    <div className="text-sm text-emerald-600 mt-1">Per member revenue</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-blue-900 mb-2">
                      {analyticsData.memberEngagement.newMemberRetention}%
                    </div>
                    <div className="text-blue-700 font-medium">New Member Retention</div>
                    <div className="text-sm text-blue-600 mt-1">3-month retention rate</div>
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