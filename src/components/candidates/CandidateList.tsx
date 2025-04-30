import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import CandidateCard from './CandidateCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface CandidateListProps {
  positionId?: string;
  limit?: number;
}

const CandidateList: React.FC<CandidateListProps> = ({ positionId, limit = 20 }) => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [enrichedProfiles, setEnrichedProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch candidates and their enriched profiles
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First, fetch candidates
        let query = supabase
          .from('candidates')
          .select('*')
          .order(sortBy, { ascending: sortOrder === 'asc' })
          .limit(limit);
          
        // Apply position filter if specified
        if (positionId) {
          // This would require a join with interview_sessions or another table that links candidates to positions
          // For now, we'll leave this as a placeholder
          console.log('Position filtering not implemented yet');
        }
          
        const { data: candidatesData, error: candidatesError } = await query;
        
        if (candidatesError) throw candidatesError;
        
        if (!candidatesData || candidatesData.length === 0) {
          setCandidates([]);
          setLoading(false);
          return;
        }
        
        setCandidates(candidatesData);
        
        // Then, fetch enriched profiles for these candidates
        const candidateIds = candidatesData.map(c => c.id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('candidate_profiles')
          .select('*')
          .in('candidate_id', candidateIds);
          
        if (profilesError) throw profilesError;
        
        // Create a map of candidate_id to profile for easy lookup
        const profilesMap: Record<string, any> = {};
        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap[profile.candidate_id] = profile;
          });
        }
        
        setEnrichedProfiles(profilesMap);
      } catch (err) {
        console.error('Error fetching candidates:', err);
        setError('Failed to load candidates. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCandidates();
  }, [positionId, limit, sortBy, sortOrder]);
  
  // Filter candidates based on search term
  const filteredCandidates = candidates.filter(candidate => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in name, email, and skills
    return (
      (candidate.full_name && candidate.full_name.toLowerCase().includes(searchLower)) ||
      (candidate.email && candidate.email.toLowerCase().includes(searchLower)) ||
      (candidate.resume_analysis?.professional_summary && 
        candidate.resume_analysis.professional_summary.toLowerCase().includes(searchLower)) ||
      (candidate.skills && 
        candidate.skills.some((skill: string) => skill.toLowerCase().includes(searchLower)))
    );
  });
  
  // Handle sort change
  const handleSortChange = (value: string) => {
    const [field, order] = value.split(':');
    setSortBy(field);
    setSortOrder(order as 'asc' | 'desc');
  };
  
  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates by name, email, or skills..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          defaultValue="created_at:desc"
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at:desc">Newest first</SelectItem>
            <SelectItem value="created_at:asc">Oldest first</SelectItem>
            <SelectItem value="full_name:asc">Name (A-Z)</SelectItem>
            <SelectItem value="full_name:desc">Name (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Error State */}
      {error && (
        <div className="p-4 text-red-500 bg-red-50 rounded-md">{error}</div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-64 bg-gray-100 animate-pulse rounded-md" />
          ))}
        </div>
      )}
      
      {/* No Results State */}
      {!loading && filteredCandidates.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No candidates found</h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? `No results for "${searchTerm}". Try a different search term.` 
              : 'No candidates available. Upload resumes to get started.'}
          </p>
        </div>
      )}
      
      {/* Results Grid */}
      {!loading && filteredCandidates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map(candidate => (
            <CandidateCard 
              key={candidate.id}
              candidate={candidate}
              enrichedProfile={enrichedProfiles[candidate.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidateList; 