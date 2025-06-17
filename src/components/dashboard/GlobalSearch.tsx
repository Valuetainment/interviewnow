import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building, User, Briefcase, FileText, Calendar, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'company' | 'candidate' | 'position' | 'interview' | 'transcript';
  title: string;
  subtitle?: string;
  metadata?: string;
  route: string;
}

const GlobalSearch: React.FC = () => {
  const { tenantId } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Handle clicks outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      performSearch();
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, tenantId]);

  const performSearch = async () => {
    if (!tenantId || !query.trim()) return;

    setLoading(true);
    console.log('Searching for:', query, 'with tenantId:', tenantId);
    
    try {
      const allResults: SearchResult[] = [];

      // Search companies
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .ilike('name', `%${query}%`)
        .limit(5);

      console.log('Companies search result:', companies, 'Error:', companiesError);

      if (companies) {
        allResults.push(...companies.map(company => ({
          id: company.id,
          type: 'company' as const,
          title: company.name,
          subtitle: 'Company',
          metadata: undefined,
          route: `/companies/${company.id}`
        })));
      }

      // Search candidates
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('id, first_name, last_name, email, full_name')
        .eq('tenant_id', tenantId)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(5);

      console.log('Candidates search result:', candidates, 'Error:', candidatesError);

      if (candidates) {
        allResults.push(...candidates.map(candidate => ({
          id: candidate.id,
          type: 'candidate' as const,
          title: candidate.first_name && candidate.last_name 
            ? `${candidate.first_name} ${candidate.last_name}` 
            : candidate.full_name || 'Unknown Candidate',
          subtitle: candidate.email,
          metadata: undefined,
          route: `/candidates/${candidate.id}`
        })));
      }

      // Search positions
      const { data: positions, error: positionsError } = await supabase
        .from('positions')
        .select(`
          id, 
          title, 
          description,
          company_id,
          companies(id, name)
        `)
        .eq('tenant_id', tenantId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(5);

      console.log('Positions search result:', positions, 'Error:', positionsError);

      if (positions) {
        allResults.push(...positions.map(position => ({
          id: position.id,
          type: 'position' as const,
          title: position.title,
          subtitle: (position as any).companies?.name || 'Position',
          metadata: undefined,
          route: `/positions/${position.id}`
        })));
      }

      // Search interview sessions
      const { data: interviews } = await supabase
        .from('interview_sessions')
        .select(`
          id,
          scheduled_at,
          status,
          candidate_id,
          position_id,
          candidates(id, first_name, last_name, full_name),
          positions(id, title)
        `)
        .eq('tenant_id', tenantId)
        .limit(10);

      if (interviews) {
        // Filter in memory for candidate/position matches
        const filteredInterviews = interviews.filter(interview => {
          const candidate = (interview as any).candidates;
          const position = (interview as any).positions;
          const searchLower = query.toLowerCase();
          
          return (
            candidate?.first_name?.toLowerCase().includes(searchLower) ||
            candidate?.last_name?.toLowerCase().includes(searchLower) ||
            candidate?.full_name?.toLowerCase().includes(searchLower) ||
            position?.title?.toLowerCase().includes(searchLower)
          );
        });

        allResults.push(...filteredInterviews.slice(0, 5).map(interview => {
          const candidate = (interview as any).candidates;
          const position = (interview as any).positions;
          const candidateName = candidate?.first_name && candidate?.last_name
            ? `${candidate.first_name} ${candidate.last_name}`
            : candidate?.full_name || 'Unknown Candidate';
            
          return {
            id: interview.id,
            type: 'interview' as const,
            title: `Interview: ${candidateName}`,
            subtitle: position?.title || 'Interview',
            metadata: interview.scheduled_at ? format(new Date(interview.scheduled_at), 'MMM d, yyyy h:mm a') : interview.status,
            route: `/sessions/${interview.id}`
          };
        }));
      }

      // Search transcripts (through interview sessions with transcript entries)
      const { data: transcripts } = await supabase
        .from('transcript_entries')
        .select(`
          id,
          text,
          session_id,
          interview_sessions!session_id(
            id,
            candidate_id,
            position_id,
            candidates(id, first_name, last_name, full_name),
            positions(id, title)
          )
        `)
        .ilike('text', `%${query}%`)
        .limit(10);

      if (transcripts && transcripts.length > 0) {
        // Deduplicate by interview session ID
        const sessionMap = new Map();
        transcripts.forEach(entry => {
          const session = (entry as any).interview_sessions;
          if (session && !sessionMap.has(session.id)) {
            sessionMap.set(session.id, session);
          }
        });
        
        const uniqueSessions = Array.from(sessionMap.values());
        allResults.push(...uniqueSessions.slice(0, 5).map(session => {
          const candidateName = session.candidates?.first_name && session.candidates?.last_name
            ? `${session.candidates.first_name} ${session.candidates.last_name}`
            : session.candidates?.full_name || 'Unknown Candidate';
          
          return {
            id: session.id,
            type: 'transcript' as const,
            title: `Transcript: ${candidateName}`,
            subtitle: session.positions?.title || 'Transcript',
            metadata: 'Contains matching text',
            route: `/sessions/${session.id}`
          };
        }));
      }

      console.log('Total search results:', allResults.length, allResults);
      setResults(allResults);
      setShowResults(allResults.length > 0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.route);
    setQuery('');
    setShowResults(false);
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'company':
        return Building;
      case 'candidate':
        return User;
      case 'position':
        return Briefcase;
      case 'interview':
        return Calendar;
      case 'transcript':
        return FileText;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'company':
        return 'Company';
      case 'candidate':
        return 'Candidate';
      case 'position':
        return 'Position';
      case 'interview':
        return 'Interview';
      case 'transcript':
        return 'Transcript';
    }
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<SearchResult['type'], SearchResult[]>);

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search companies, candidates, positions..."
          className="h-9 w-full bg-background pl-8 md:w-[300px] lg:w-[400px]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && results.length > 0 && setShowResults(true)}
        />
      </div>

      {showResults && (
        <Card className="absolute top-full mt-2 w-full max-h-[500px] overflow-auto shadow-lg z-50">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(groupedResults).map(([type, typeResults]) => (
                  <div key={type} className="mb-2 last:mb-0">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      {getTypeLabel(type as SearchResult['type'])}s
                    </div>
                    {typeResults.map((result) => {
                      const Icon = getIcon(result.type);
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          className="w-full px-3 py-2 hover:bg-accent/50 transition-colors text-left"
                          onClick={() => handleResultClick(result)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {result.title}
                              </div>
                              {result.subtitle && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {result.subtitle}
                                </div>
                              )}
                              {result.metadata && (
                                <div className="text-xs text-muted-foreground/70 truncate mt-0.5">
                                  {result.metadata}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GlobalSearch; 