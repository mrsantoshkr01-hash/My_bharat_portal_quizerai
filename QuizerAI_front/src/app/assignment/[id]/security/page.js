// app/teacher/assignment/[assignmentId]/security/page.js
'use client'

import { useRouter, useParams } from 'next/navigation';
import GeofenceSetup from '@/components/QuizSecurity/GeofenceSetup';

export default function AssignmentSecurityPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.assignmentId;

  const handleSettingsUpdate = (settings) => {
    console.log('Assignment security settings updated:', settings);
    // Redirect back to assignment management
    router.push(`/teacher/assignment/${assignmentId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <GeofenceSetup 
        quizId={parseInt(assignmentId)}
        onSettingsUpdate={handleSettingsUpdate}
        isAssignmentMode={true}
      />
    </div>
  );
}