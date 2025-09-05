import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const RelatedJobs = ({ jobs = [], currentJobId }) => {
  const navigate = useNavigate();

  const filteredJobs = jobs && Array.isArray(jobs) ? jobs.filter(job => job?.id !== currentJobId).slice(0, 3) : [];

  if (filteredJobs?.length === 0) {
    return null;
  }

  const formatSalary = (min, max) => {
    if (min && max) {
      return `$${min?.toLocaleString()} - $${max?.toLocaleString()}`;
    } else if (min) {
      return `$${min?.toLocaleString()}+`;
    }
    return 'Competitive';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date?.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleJobClick = (jobId) => {
    // In a real app, this would navigate to the job details with the new job ID
    // For now, we'll just scroll to top to simulate navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Icon name="Briefcase" size={20} />
          Related Jobs
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/job-search-results')}
          iconName="ArrowRight"
          iconPosition="right"
        >
          View All
        </Button>
      </div>
      <div className="space-y-4">
        {filteredJobs && Array.isArray(filteredJobs) ? filteredJobs.map((job) => (
          <div
            key={job?.id}
            className="border border-border rounded-lg p-4 hover:shadow-card transition-shadow duration-150 cursor-pointer"
            onClick={() => handleJobClick(job?.id)}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-border flex-shrink-0">
                <Image
                  src={job?.company?.logo}
                  alt={`${job?.company?.name} logo`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-text-primary mb-1 line-clamp-1">
                  {job?.title}
                </h4>
                <div className="text-sm text-text-secondary mb-2">
                  {job?.company?.name}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary mb-2">
                  <div className="flex items-center gap-1">
                    <Icon name="MapPin" size={12} />
                    <span>{job?.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="Clock" size={12} />
                    <span>{formatDate(job?.postedDate)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="DollarSign" size={12} />
                    <span>{formatSalary(job?.salaryRange?.min, job?.salaryRange?.max)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 bg-accent rounded-full text-xs font-medium">
                      {job?.type}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 bg-muted rounded-full text-xs font-medium">
                      {job?.experienceLevel}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-secondary">
                    <Icon name="TrendingUp" size={12} />
                    <span>{job?.matchScore || 85}% match</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )) : null}
      </div>
      <div className="mt-6 pt-4 border-t border-border">
        <Button
          variant="outline"
          fullWidth
          onClick={() => navigate('/job-search-results')}
          iconName="Search"
          iconPosition="left"
        >
          Explore More Jobs
        </Button>
      </div>
    </div>
  );
};

export default RelatedJobs;