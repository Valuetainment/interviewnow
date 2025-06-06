
import React, { useState } from 'react';
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

// Mock data for positions
const mockPositions = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    location: 'Remote',
    applicants: 23,
    created: '2025-03-12',
    status: 'Active',
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    department: 'Engineering',
    location: 'San Francisco',
    applicants: 18,
    created: '2025-03-15',
    status: 'Active',
  },
  {
    id: '3',
    title: 'Product Manager',
    department: 'Product',
    location: 'New York',
    applicants: 12,
    created: '2025-03-18',
    status: 'Active',
  },
  {
    id: '4',
    title: 'DevOps Engineer',
    department: 'Infrastructure',
    location: 'Remote',
    applicants: 8,
    created: '2025-03-20',
    status: 'Active',
  },
  {
    id: '5',
    title: 'UX Designer',
    department: 'Design',
    location: 'London',
    applicants: 15,
    created: '2025-03-22',
    status: 'Active',
  },
];

const Positions = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter positions based on search query
  const filteredPositions = mockPositions.filter(position => 
    position.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    position.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    position.location.toLowerCase().includes(searchQuery.toLowerCase())
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
            <CardDescription>Find positions by title, department, or location</CardDescription>
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
            <CardDescription>Overview of all job positions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position Title</TableHead>
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
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No positions found matching your search criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Positions;
