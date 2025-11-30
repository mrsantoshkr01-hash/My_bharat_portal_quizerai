// components/Analytics/SecurityAnalytics.jsx
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SecurityAnalytics({ quizId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [quizId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/v1/quiz-security/analytics/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading analytics...</div>;
  if (!analytics) return <div>No analytics data available</div>;

  const violationChartData = Object.entries(analytics.violation_breakdown).map(
    ([type, count]) => ({ type, count })
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-600">Total Sessions</h4>
          <p className="text-2xl font-bold text-blue-900">{analytics.total_sessions}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-600">Compliance Rate</h4>
          <p className="text-2xl font-bold text-green-900">{analytics.compliance_rate.toFixed(1)}%</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-red-600">Total Violations</h4>
          <p className="text-2xl font-bold text-red-900">{analytics.total_violations}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-600">Avg Accuracy</h4>
          <p className="text-2xl font-bold text-yellow-900">{analytics.average_accuracy.toFixed(1)}m</p>
        </div>
      </div>

      {/* Violation Breakdown Chart */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Violation Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={violationChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}