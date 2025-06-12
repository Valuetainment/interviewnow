import React from 'react';
import { Helmet } from 'react-helmet-async';
import DashboardLayout from '@/components/layouts/DashboardLayout';

const Sessions: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Interview Sessions | AI Interview Insights Platform</title>
      </Helmet>
      <DashboardLayout>
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Interview Sessions</h1>
            <p className="text-muted-foreground mt-2">
              Debugging .add() error - Minimal version
            </p>
          </div>
          
          <div className="p-8 border rounded-lg">
            <p>Sessions page is temporarily simplified for debugging.</p>
            <p className="mt-4">If you see this message, the error is not in the Sessions page itself.</p>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Sessions; 