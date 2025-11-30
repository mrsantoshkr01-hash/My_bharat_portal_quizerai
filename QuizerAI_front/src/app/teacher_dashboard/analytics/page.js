"use client"
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Users, BookOpen, TrendingUp, Download, RefreshCw, Clock, Award, Target, Activity } from 'lucide-react';
import { useAnalytics, analyticsApi, formatters } from '@/utils/api/analyticsApi';

const TeacherDashboardAnalytics = () => {
  const { data: analyticsData, loading, error, refetch } = useAnalytics();
  const [overviewData, setOverviewData] = useState(null);
  const [trendsData, setTrendsData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedTrendDays, setSelectedTrendDays] = useState(30);

  // Load additional data
  useEffect(() => {
    const loadAdditionalData = async () => {
      try {
        const [overview, trends, subjects, activity] = await Promise.all([
          analyticsApi.getOverviewStats(),
          analyticsApi.getPerformanceTrends(selectedTrendDays),
          analyticsApi.getSubjectAnalytics(),
          analyticsApi.getRecentActivity(10)
        ]);

        setOverviewData(overview || {});
        setTrendsData(Array.isArray(trends) ? trends : []);
        setSubjectData(Array.isArray(subjects) ? subjects : []);
        setRecentActivity(Array.isArray(activity?.activities) ? activity.activities : Array.isArray(activity) ? activity : []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        // Set empty defaults on error
        setOverviewData({});
        setTrendsData([]);
        setSubjectData([]);
        setRecentActivity([]);
      }
    };

    loadAdditionalData();
  }, [selectedTrendDays]);

  const handleExport = async (format) => {
    setExportLoading(true);
    try {
      const exportData = await analyticsApi.exportAnalytics(format);
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `teacher_analytics_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExportLoading(false);
    }
  };

  const refreshData = () => {
    refetch();
    window.location.reload(); // Refresh additional data
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Error loading dashboard: {error}</div>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const overview = analyticsData?.data?.overview || overviewData || {};
  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-gray-600">Analytics and insights for your teaching activities</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshData}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('json')}
                  disabled={exportLoading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exportLoading ? 'Exporting...' : 'Export'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <OverviewCard
            icon={BookOpen}
            title="Total Quizzes"
            value={overview.total_quizzes || 0}
            iconColor="text-blue-600"
            bgColor="bg-blue-50"
          />
          <OverviewCard
            icon={Users}
            title="Total Students"
            value={overview.total_students || 0}
            iconColor="text-green-600"
            bgColor="bg-green-50"
          />
          <OverviewCard
            icon={Activity}
            title="Total Attempts"
            value={overview.total_attempts || 0}
            iconColor="text-purple-600"
            bgColor="bg-purple-50"
          />
          <OverviewCard
            icon={Award}
            title="Average Score"
            value={`${overview.avg_score || 0}%`}
            iconColor="text-yellow-600"
            bgColor="bg-yellow-50"
          />
        </div>

        {/* Performance Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Performance Trends</h2>
            <div className="flex space-x-2">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setSelectedTrendDays(days)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedTrendDays === days
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
          <div className="h-80">
            {Array.isArray(trendsData) && trendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="avg_score" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Average Score (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total_attempts" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Total Attempts"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No trend data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subject Analytics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Subject Performance</h2>
            {Array.isArray(subjectData) && subjectData.length > 0 ? (
              <div className="space-y-4">
                {subjectData.slice(0, 5).map((subject, index) => (
                  <SubjectCard key={subject.subject} subject={subject} color={chartColors[index % chartColors.length]} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No subject data available
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Array.isArray(analyticsData?.data?.recent_sessions) && analyticsData.data.recent_sessions.length > 0 ? (
                analyticsData.data.recent_sessions.slice(0, 8).map((activity, index) => (
                  <ActivityItem key={`${activity.type}_${activity.id}_${index}`} activity={activity} />
                ))
              ) : Array.isArray(recentActivity) && recentActivity.length > 0 ? (
                recentActivity.slice(0, 8).map((activity, index) => (
                  <ActivityItem key={`${activity.type}_${activity.id}_${index}`} activity={activity} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Analytics Grid */}
        {analyticsData?.data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Completion Rates */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Quiz Attempts</span>
                  <span className="font-semibold">{overview.total_attempts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Students</span>
                  <span className="font-semibold">{overview.total_students || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recent Activity</span>
                  <span className="font-semibold">{overview.recent_activity_count || 0}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-left">
                  Create New Quiz
                </button>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-left">
                  View All Assignments
                </button>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-left">
                  Manage Classrooms
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Data Updated</span>
                  <span className="text-green-600 text-sm">Just now</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Quizzes</span>
                  <span className="text-green-600 text-sm">All running</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Server Status</span>
                  <span className="text-green-600 text-sm">Healthy</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Overview Card Component
const OverviewCard = ({ icon: Icon, title, value, iconColor, bgColor }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className={`p-3 rounded-lg ${bgColor}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div className="ml-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

// Subject Card Component
const SubjectCard = ({ subject, color }) => (
  <div className="flex items-center justify-between p-4 border rounded-lg">
    <div className="flex items-center space-x-3">
      <div 
        className="w-4 h-4 rounded-full" 
        style={{ backgroundColor: color }}
      />
      <div>
        <h4 className="font-medium text-gray-900">{subject.subject}</h4>
        <p className="text-sm text-gray-500">{subject.quiz_count} quizzes</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-semibold text-gray-900">{subject.avg_score}%</p>
      <p className="text-sm text-gray-500">{subject.total_attempts} attempts</p>
    </div>
  </div>
);

// Activity Item Component
const ActivityItem = ({ activity }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'quiz_attempt':
        return BookOpen;
      case 'assignment_submission':
        return Users;
      default:
        return Activity;
    }
  };

  const Icon = getActivityIcon(activity.type);

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
      <div className="flex-shrink-0">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {activity.quiz_title || activity.title}
        </p>
        <p className="text-sm text-gray-500">
          {activity.student_name || activity.user_name} - 
          {activity.score ? ` ${activity.score}%` : ` ${activity.status}`}
        </p>
        <p className="text-xs text-gray-400">
          {activity.completed_at ? formatters.formatDate(activity.completed_at) : 'In progress'}
        </p>
      </div>
      {activity.score && (
        <div className={`text-sm font-medium ${formatters.getScoreColor(activity.score)}`}>
          {activity.score}%
        </div>
      )}
    </div>
  );
};

export default TeacherDashboardAnalytics;