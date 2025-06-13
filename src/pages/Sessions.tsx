import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import SessionList from '@/components/interview/SessionList';
import SafeRender from '@/components/SafeRender';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, ClipboardList, Video } from 'lucide-react';

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
        
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">
              <Calendar className="h-4 w-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="completed">
              <ClipboardList className="h-4 w-4 mr-2" />
              Completed
            </TabsTrigger>
            <TabsTrigger value="recordings">
              <Video className="h-4 w-4 mr-2" />
              Recordings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-6">
            <SafeRender>
              <SessionList />
            </SafeRender>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-6">
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Completed Sessions</h3>
              <p className="text-muted-foreground max-w-md">
                View completed interviews with assessment results and analytics
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Coming soon
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="recordings" className="mt-6">
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Video className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Interview Recordings</h3>
              <p className="text-muted-foreground max-w-md">
                Access recordings of past interviews for review and analysis
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Coming soon
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Sessions; 