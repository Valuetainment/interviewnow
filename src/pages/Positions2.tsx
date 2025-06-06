import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

// Keep mock data for fallback
const mockPositions = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    location: 'Remote',
    company: 'Acme Corp',
    experienceLevel: 'Senior',
    applicants: 23,
    created: '2025-03-12',
    status: 'Active',
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    department: 'Engineering',
    location: 'San Francisco',
    company: 'Stark Industries',
    experienceLevel: 'Mid-level',
    applicants: 18,
    created: '2025-03-15',
    status: 'Active',
  },
  {
    id: '3',
    title: 'Product Manager',
    department: 'Product',
    location: 'New York',
    company: 'Acme Corp',
    experienceLevel: 'Senior',
    applicants: 12,
    created: '2025-03-18',
    status: 'Active',
  },
  {
    id: '4',
    title: 'DevOps Engineer',
    department: 'Infrastructure',
    location: 'Remote',
    company: 'Stark Industries',
    experienceLevel: 'Mid-level',
    applicants: 8,
    created: '2025-03-20',
    status: 'Active',
  },
  {
    id: '5',
    title: 'UX Designer',
    department: 'Design',
    location: 'London',
    company: 'Acme Corp',
    experienceLevel: 'Entry-level',
    applicants: 15,
    created: '2025-03-22',
    status: 'Active',
  },
];

const Positions2 = () => {
  const { tenantId } = useAuth();
  const [positions, setPositions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define types
  type Position = {
    id: string;
    title: string;
    description: string | null;
    role_overview: string | null;
    key_responsibilities: string | null;
    required_qualifications: string | null;
    preferred_qualifications: string | null;
    benefits: string | null;
    key_competencies_section: string | null;
    experience_level: string | null;
    company_id: string | null;
    created_at: string;
    updated_at: string;
    tenant_id: string;
  };
  
  type DisplayPosition = {
    id: string;
    title: string;
    department: string;
    location: string;
    company: string;
    experienceLevel: string;
    applicants: number;
    created: string;
    status: string;
  };

  // Fetch positions from database
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        if (!tenantId) return;
        
        console.log("Fetching positions for tenant:", tenantId);
        
        const { data, error } = await supabase
          .from('positions')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching positions:", error);
          setError("Failed to load positions");
          setPositions([]);
        } else if (data) {
          console.log("Fetched positions:", data);
          
          // Transform data to match expected format
          const formattedPositions = (data as Position[]).map(pos => ({
            id: pos.id,
            title: pos.title,
            department: 'General', // Default value since we don't have a department column
            location: 'Remote', // Default value since we don't have a location column
            company: 'Your Company', // Default since we're not joining with companies table yet
            experienceLevel: pos.experience_level || 'Not specified',
            applicants: 0, // We'll need to implement this with a real count later
            created: pos.created_at ? format(new Date(pos.created_at), 'yyyy-MM-dd') : 'Unknown',
            status: 'Active'
          }));
          
          setPositions(formattedPositions);
        }
      } catch (err) {
        console.error("Unexpected error fetching positions:", err);
        setError("An unexpected error occurred");
        setPositions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPositions();
  }, [tenantId]);

  // Filter positions based on search query
  const filteredPositions = positions.filter(position => 
    position.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    position.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    position.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    position.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (position.experienceLevel && position.experienceLevel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl pt-24 pb-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Positions</h1>
          <Link to="/create-position">
            <Button>Create Position</Button>
          </Link>
        </div>

        {/* Search and filters */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find positions by title, department, location, company or experience level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search positions..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Positions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Positions ({filteredPositions.length})</CardTitle>
            <CardDescription>Enhanced positions with company and experience level</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center">Loading positions...</div>
            ) : error ? (
              <div className="py-10 text-center text-destructive">{error}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Experience Level</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-center">Applicants</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPositions.length > 0 ? (
                    filteredPositions.map((position) => (
                      <TableRow key={position.id} className="hover:cursor-pointer">
                        <TableCell className="font-medium">
                          <Link to={`/positions/${position.id}`} className="text-primary hover:underline">
                            {position.title}
                          </Link>
                        </TableCell>
                        <TableCell>{position.company}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
                            ${position.experienceLevel === 'Entry-level' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 
                              position.experienceLevel === 'Mid-level' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' :
                              position.experienceLevel === 'Senior' ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20' :
                              'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'}`}>
                            {position.experienceLevel}
                          </span>
                        </TableCell>
                        <TableCell>{position.department}</TableCell>
                        <TableCell>{position.location}</TableCell>
                        <TableCell className="text-center">{position.applicants}</TableCell>
                        <TableCell>{position.created}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            {position.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {positions.length === 0 ? 
                          "No positions found. Create your first position!" :
                          "No positions found matching your search criteria."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Positions2; 