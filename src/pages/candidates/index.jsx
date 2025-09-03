import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase';
import RoleAdaptiveNavbar from '../../components/ui/RoleAdaptiveNavbar';
import NavigationBreadcrumbs from '../../components/ui/NavigationBreadcrumbs';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const CandidateBrowsing = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    keywords: '',
    location: '',
    experience_level: '',
    industry: '',
    availability: '',
    remote_preference: ''
  });

  const experienceLevels = [
    { value: '', label: 'All Experience Levels' },
    { value: '0-1', label: '0-1 years' },
    { value: '1-3', label: '1-3 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '5-10', label: '5-10 years' },
    { value: '10+', label: '10+ years' }
  ];

  const industries = [
    { value: '', label: 'All Industries' },
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'education', label: 'Education' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'retail', label: 'Retail' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'media', label: 'Media & Entertainment' },
    { value: 'nonprofit', label: 'Non-Profit' },
    { value: 'other', label: 'Other' }
  ];

  const remotePreferences = [
    { value: '', label: 'All Remote Preferences' },
    { value: 'on-site', label: 'On-site only' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'remote', label: 'Remote only' },
    { value: 'flexible', label: 'Flexible' }
  ];

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [candidates, filters]);

  const fetchCandidates = async () => {
    try {
      setIsLoading(true);
      // For now, we'll use mock data since we don't have user profiles endpoint
      // In a real app, this would fetch from Supabase
      const mockCandidates = [
        {
          id: 1,
          full_name: 'John Smith',
          current_job_title: 'Senior Software Engineer',
          location: 'San Francisco, CA',
          industry: 'technology',
          years_experience: '5-10',
          remote_work_preference: 'hybrid',
          bio: 'Experienced full-stack developer with expertise in React, Node.js, and cloud technologies.',
          skills: ['React', 'Node.js', 'JavaScript', 'Python', 'AWS'],
          availability: 'Available immediately',
          expected_salary_min: 120000,
          expected_salary_max: 150000,
          linkedin_url: 'https://linkedin.com/in/johnsmith',
          github_url: 'https://github.com/johnsmith',
          resume_url: 'john_smith_resume.pdf'
        },
        {
          id: 2,
          full_name: 'Sarah Johnson',
          current_job_title: 'Product Marketing Manager',
          location: 'New York, NY',
          industry: 'technology',
          years_experience: '3-5',
          remote_work_preference: 'remote',
          bio: 'Strategic marketing professional with a track record of launching successful products.',
          skills: ['Product Marketing', 'Analytics', 'A/B Testing', 'Salesforce', 'HubSpot'],
          availability: '2 weeks notice',
          expected_salary_min: 90000,
          expected_salary_max: 110000,
          linkedin_url: 'https://linkedin.com/in/sarahjohnson',
          portfolio_url: 'https://sarahjohnson.com',
          resume_url: 'sarah_johnson_resume.pdf'
        },
        {
          id: 3,
          full_name: 'Michael Chen',
          current_job_title: 'UX/UI Designer',
          location: 'Austin, TX',
          industry: 'technology',
          years_experience: '3-5',
          remote_work_preference: 'flexible',
          bio: 'Creative designer passionate about creating intuitive user experiences.',
          skills: ['Figma', 'Sketch', 'Adobe XD', 'Prototyping', 'User Research'],
          availability: '1 month notice',
          expected_salary_min: 75000,
          expected_salary_max: 95000,
          linkedin_url: 'https://linkedin.com/in/michaelchen',
          portfolio_url: 'https://michaelchen.design',
          resume_url: 'michael_chen_resume.pdf'
        },
        {
          id: 4,
          full_name: 'Emily Rodriguez',
          current_job_title: 'Data Scientist',
          location: 'Seattle, WA',
          industry: 'healthcare',
          years_experience: '1-3',
          remote_work_preference: 'remote',
          bio: 'Data scientist with expertise in machine learning and healthcare analytics.',
          skills: ['Python', 'R', 'Machine Learning', 'SQL', 'Tableau'],
          availability: 'Available immediately',
          expected_salary_min: 85000,
          expected_salary_max: 105000,
          linkedin_url: 'https://linkedin.com/in/emilyrodriguez',
          github_url: 'https://github.com/emilyrodriguez',
          resume_url: 'emily_rodriguez_resume.pdf'
        }
      ];
      
      setCandidates(mockCandidates);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = candidates;

    if (filters.keywords) {
      const keywords = filters.keywords.toLowerCase();
      filtered = filtered.filter(candidate =>
        candidate.full_name.toLowerCase().includes(keywords) ||
        candidate.current_job_title.toLowerCase().includes(keywords) ||
        candidate.bio.toLowerCase().includes(keywords) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(keywords))
      );
    }

    if (filters.location) {
      filtered = filtered.filter(candidate =>
        candidate.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.experience_level) {
      filtered = filtered.filter(candidate =>
        candidate.years_experience === filters.experience_level
      );
    }

    if (filters.industry) {
      filtered = filtered.filter(candidate =>
        candidate.industry === filters.industry
      );
    }

    if (filters.remote_preference) {
      filtered = filtered.filter(candidate =>
        candidate.remote_work_preference === filters.remote_preference
      );
    }

    setFilteredCandidates(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      keywords: '',
      location: '',
      experience_level: '',
      industry: '',
      availability: '',
      remote_preference: ''
    });
  };

  const formatSalaryRange = (min, max) => {
    if (!min && !max) return 'Salary not specified';
    if (!max) return `$${min?.toLocaleString()}+`;
    if (!min) return `Up to $${max?.toLocaleString()}`;
    return `$${min?.toLocaleString()} - $${max?.toLocaleString()}`;
  };

  if (!user || userProfile?.role !== 'employer') {
    return (
      <div className="min-h-screen bg-background">
        <RoleAdaptiveNavbar />
        <div className="pt-16 flex items-center justify-center">
          <div className="text-center">
            <Icon name="Users" size={48} className="mx-auto text-text-secondary mb-4" />
            <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
            <p className="text-text-secondary mb-6">Only employers can browse candidates.</p>
            <Button
              variant="default"
              onClick={() => navigate('/login')}
              iconName="LogIn"
              iconPosition="left"
            >
              Sign In as Employer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RoleAdaptiveNavbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NavigationBreadcrumbs className="mb-6" />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Browse Candidates</h1>
            <p className="text-text-secondary">
              Find qualified candidates for your open positions
            </p>
          </div>

          {/* Filters */}
          <div className="bg-card border border-border rounded-lg shadow-card p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <Input
                label="Keywords"
                type="text"
                placeholder="Job title, skills, name..."
                value={filters.keywords}
                onChange={(e) => handleFilterChange('keywords', e.target.value)}
              />
              
              <Input
                label="Location"
                type="text"
                placeholder="City, State, Country"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
              
              <Select
                label="Experience Level"
                options={experienceLevels}
                value={filters.experience_level}
                onChange={(value) => handleFilterChange('experience_level', value)}
              />
              
              <Select
                label="Industry"
                options={industries}
                value={filters.industry}
                onChange={(value) => handleFilterChange('industry', value)}
              />
              
              <Select
                label="Remote Preference"
                options={remotePreferences}
                value={filters.remote_preference}
                onChange={(value) => handleFilterChange('remote_preference', value)}
              />
              
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  iconName="X"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mb-4 flex justify-between items-center">
            <p className="text-text-secondary">
              {isLoading ? 'Loading...' : `${filteredCandidates.length} candidate${filteredCandidates.length !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-6 animate-pulse">
                  <div className="h-4 bg-border rounded mb-4"></div>
                  <div className="h-3 bg-border rounded mb-2"></div>
                  <div className="h-3 bg-border rounded mb-4"></div>
                  <div className="flex space-x-2 mb-4">
                    <div className="h-6 bg-border rounded px-3 py-1"></div>
                    <div className="h-6 bg-border rounded px-3 py-1"></div>
                  </div>
                  <div className="h-8 bg-border rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="Users" size={48} className="mx-auto text-text-secondary mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No candidates found</h3>
              <p className="text-text-secondary mb-4">
                Try adjusting your search criteria or filters.
              </p>
              <Button
                variant="outline"
                onClick={clearFilters}
                iconName="RefreshCw"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/candidate/${candidate.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary mb-1">
                        {candidate.full_name}
                      </h3>
                      <p className="text-sm text-text-secondary mb-2">
                        {candidate.current_job_title}
                      </p>
                      <div className="flex items-center text-sm text-text-secondary mb-2">
                        <Icon name="MapPin" size={14} className="mr-1" />
                        {candidate.location}
                      </div>
                      <div className="flex items-center text-sm text-text-secondary">
                        <Icon name="Clock" size={14} className="mr-1" />
                        {candidate.years_experience} years experience
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                    {candidate.bio}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {candidate.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 3 && (
                      <span className="inline-block px-2 py-1 text-xs bg-border text-text-secondary rounded">
                        +{candidate.skills.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Salary Range:</span>
                      <span className="text-text-primary font-medium">
                        {formatSalaryRange(candidate.expected_salary_min, candidate.expected_salary_max)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Availability:</span>
                      <span className="text-text-primary">
                        {candidate.availability}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Remote:</span>
                      <span className="text-text-primary capitalize">
                        {candidate.remote_work_preference}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      {candidate.linkedin_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(candidate.linkedin_url, '_blank');
                          }}
                          iconName="Linkedin"
                        />
                      )}
                      {candidate.github_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(candidate.github_url, '_blank');
                          }}
                          iconName="Github"
                        />
                      )}
                      {candidate.portfolio_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(candidate.portfolio_url, '_blank');
                          }}
                          iconName="ExternalLink"
                        />
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/candidate/${candidate.id}`);
                      }}
                      iconName="Eye"
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateBrowsing;