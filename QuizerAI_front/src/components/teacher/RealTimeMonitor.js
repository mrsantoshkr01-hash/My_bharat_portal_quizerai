// components/Teacher/RealTimeMonitor.jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export default function RealTimeMonitor({ quizId }) {
  const [activeSessions, setActiveSessions] = useState([]);
  const [violations, setViolations] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('/quiz-security', {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.emit('monitor_quiz', { quiz_id: quizId });

    newSocket.on('session_update', (data) => {
      setActiveSessions(prev => 
        prev.map(session => 
          session.id === data.session_id 
            ? { ...session, ...data }
            : session
        )
      );
    });

    newSocket.on('violation_alert', (data) => {
      setViolations(prev => [data, ...prev.slice(0, 49)]); // Keep last 50
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [quizId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active Sessions */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activeSessions.map(session => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">{session.student_name}</p>
                <p className="text-sm text-gray-600">
                  {session.is_within_geofence ? '✅ In area' : '❌ Outside area'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">Violations: {session.violations_count}</p>
                <p className="text-xs text-gray-500">
                  {new Date(session.last_update).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Violations */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Recent Violations</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {violations.map((violation, index) => (
            <div key={index} className="p-3 bg-red-50 rounded border-l-4 border-red-400">
              <div className="flex justify-between">
                <p className="font-medium text-red-800">{violation.type}</p>
                <p className="text-xs text-red-600">
                  {new Date(violation.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <p className="text-sm text-red-700">{violation.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}