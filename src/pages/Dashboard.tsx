
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DashboardInterviews from '@/components/dashboard/DashboardInterviews';
import DashboardInvitations from '@/components/dashboard/DashboardInvitations';
import DashboardStatistics from '@/components/dashboard/DashboardStatistics';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("interviews");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-20 md:py-28 flex-grow">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Admin Dashboard</h1>
          
          <Tabs defaultValue="interviews" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-8 bg-muted/40">
              <TabsTrigger value="interviews">Interviews</TabsTrigger>
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="interviews">
              <DashboardInterviews />
            </TabsContent>
            
            <TabsContent value="invitations">
              <DashboardInvitations />
            </TabsContent>
            
            <TabsContent value="statistics">
              <DashboardStatistics />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
