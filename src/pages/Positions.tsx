import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { useCompany } from "@/contexts/CompanyContext";

// Keep mock data for fallback
const mockPositions = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    department: "Engineering",
    location: "Remote",
    company: "Acme Corp",
    experienceLevel: "Senior",
    applicants: 23,
    created: "2025-03-12",
    status: "Active",
  },
  {
    id: "2",
    title: "Full Stack Engineer",
    department: "Engineering",
    location: "San Francisco",
    company: "Stark Industries",
    experienceLevel: "Mid-level",
    applicants: 18,
    created: "2025-03-15",
    status: "Active",
  },
  {
    id: "3",
    title: "Product Manager",
    department: "Product",
    location: "New York",
    company: "Acme Corp",
    experienceLevel: "Senior",
    applicants: 12,
    created: "2025-03-18",
    status: "Active",
  },
  {
    id: "4",
    title: "DevOps Engineer",
    department: "Infrastructure",
    location: "Remote",
    company: "Stark Industries",
    experienceLevel: "Mid-level",
    applicants: 8,
    created: "2025-03-20",
    status: "Active",
  },
  {
    id: "5",
    title: "UX Designer",
    department: "Design",
    location: "London",
    company: "Acme Corp",
    experienceLevel: "Entry-level",
    applicants: 15,
    created: "2025-03-22",
    status: "Active",
  },
];

const Positions = () => {
  const { tenantId } = useAuth();
  const { selectedCompany } = useCompany();
  const [positions, setPositions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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
    key_competencies_section: string | null;
    experience_level: string | null;
    department: string | null;
    location: string | null;
    employment_type: string | null;
    salary_range: string | null;
    application_deadline: string | null;
    reference_number: string | null;
    travel_requirements: string | null;
    work_authorization: string | null;
    company_id: string | null;
    created_at: string;
    updated_at: string;
    tenant_id: string;
    companies?: {
      id: string;
      name: string;
    };
  };

  type DisplayPosition = {
    id: string;
    title: string;
    department: string;
    location: string;
    company: string;
    experienceLevel: string;
    employmentType: string;
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

        let query = supabase
          .from("positions")
          .select(
            `
            *,
            companies (
              id,
              name
            )
          `
          )
          .eq("tenant_id", tenantId);

        // Filter by selected company if one is selected
        if (selectedCompany) {
          query = query.eq("company_id", selectedCompany.id);
        }

        const { data, error } = await query.order("created_at", {
          ascending: false,
        });

        if (error) {
          console.error("Error fetching positions:", error);
          setError("Failed to load positions");
          setPositions([]);
        } else if (data) {
          console.log("Fetched positions:", data);

          // Transform data to match expected format
          const formattedPositions = (data as Position[]).map((pos) => ({
            id: pos.id,
            title: pos.title,
            department: pos.department || "Not specified",
            location: pos.location || "Not specified",
            company: pos.companies?.name || "Not specified",
            experienceLevel: pos.experience_level || "Not specified",
            employmentType: pos.employment_type || "Full-Time",
            applicants: 0, // We'll need to implement this with a real count later
            created: pos.created_at
              ? format(new Date(pos.created_at), "yyyy-MM-dd")
              : "Unknown",
            status: "Active",
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
  }, [tenantId, selectedCompany]);

  // Filter positions based on search query
  const filteredPositions = positions.filter(
    (position) =>
      position.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (position.experienceLevel &&
        position.experienceLevel
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (position.employmentType &&
        position.employmentType
          .toLowerCase()
          .includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-7xl pt-24 pb-16">
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
            <CardDescription>
              Find positions by title, department, location, company, experience
              level, or employment type
            </CardDescription>
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
            <CardDescription>
              Complete position listings with department, location, and
              employment details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center">Loading positions...</div>
            ) : error ? (
              <div className="py-10 text-center text-destructive">{error}</div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table className="min-w-[1000px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">
                        Position Title
                      </TableHead>
                      <TableHead className="min-w-[150px]">Company</TableHead>
                      <TableHead className="min-w-[140px]">
                        Experience Level
                      </TableHead>
                      <TableHead className="min-w-[120px]">
                        Department
                      </TableHead>
                      <TableHead className="min-w-[120px]">Location</TableHead>
                      <TableHead className="text-center min-w-[100px]">
                        Applicants
                      </TableHead>
                      <TableHead className="min-w-[100px]">Created</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPositions.length > 0 ? (
                      filteredPositions.map((position) => (
                        <TableRow
                          key={position.id}
                          className="hover:cursor-pointer"
                        >
                          <TableCell className="font-medium">
                            <Link
                              to={`/positions/${position.id}`}
                              className="text-primary hover:underline"
                            >
                              {position.title}
                            </Link>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {position.company}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap
                              ${
                                position.experienceLevel === "entry-level"
                                  ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                                  : position.experienceLevel === "mid-level"
                                  ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
                                  : position.experienceLevel === "senior"
                                  ? "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20"
                                  : position.experienceLevel === "lead"
                                  ? "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20"
                                  : "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20"
                              }`}
                            >
                              {position.experienceLevel === "entry-level"
                                ? "Entry"
                                : position.experienceLevel === "mid-level"
                                ? "Mid"
                                : position.experienceLevel === "senior"
                                ? "Senior"
                                : position.experienceLevel === "lead"
                                ? "Lead"
                                : position.experienceLevel
                                    .charAt(0)
                                    .toUpperCase() +
                                  position.experienceLevel.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {position.department}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {position.location}
                          </TableCell>
                          <TableCell className="text-center">
                            {position.applicants}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {position.created}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 whitespace-nowrap">
                              {position.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {positions.length === 0
                            ? "No positions found. Create your first position!"
                            : "No positions found matching your search criteria."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Positions;
