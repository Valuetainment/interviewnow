import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import SessionList from '@/components/interview/SessionList';
import SafeRender from '@/components/SafeRender';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Play, CheckCircle, LayoutList, XCircle } from 'lucide-react';

const Sessions: React.FC = () => {
  return (
    <>
    <HelmetProvider>
      <Helmet>
        <title>Interview Sessions | AI Interview Insights Platform</title>
      </Helmet>
      </HelmetProvider>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Interview Sessions</h1>
          <p className="text-muted-foreground mt-2">
            Manage scheduled interviews, view recordings, and analyze results
          </p>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">
              <LayoutList className="h-4 w-4 mr-2" />
              All
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              <Calendar className="h-4 w-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              <Play className="h-4 w-4 mr-2" />
              In Progress
            </TabsTrigger>
            <TabsTrigger value="completed">
              <CheckCircle className="h-4 w-4 mr-2" />
              Completed
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              <XCircle className="h-4 w-4 mr-2" />
              Cancelled
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <SafeRender>
              <SessionList filterStatus="all" />
            </SafeRender>
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-6">
            <SafeRender>
              <SessionList filterStatus="scheduled" />
            </SafeRender>
          </TabsContent>
          
          <TabsContent value="in_progress" className="mt-6">
            <SafeRender>
              <SessionList filterStatus="in_progress" />
            </SafeRender>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-6">
            <SafeRender>
              <SessionList filterStatus="completed" />
            </SafeRender>
          </TabsContent>
          
          <TabsContent value="cancelled" className="mt-6">
            <SafeRender>
              <SessionList filterStatus="cancelled" />
            </SafeRender>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Sessions; 