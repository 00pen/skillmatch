import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const JobCard = ({ job, onSaveJob, onQuickApply, isSaved = false, userRole = 'job-seeker' }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleViewDetails = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    navigate(`/job-details/${job?.id}`);
  };

  const handleSaveJob = async (e) => {
    e?.stopPropagation();
    setIsLoading(true);
    try {
      await onSaveJob(job?.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickApply = async (e) => {
    e?.stopPropagation();
    setIsApplying(true);
    try {
      if (onQuickApply) {
        await onQuickApply(job?.id);
      } else {
        // Navigate to job details for full application
        navigate(`/job-details/${job?.id}`);
      }
    } finally {
      setIsApplying(false);
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Salary not disclosed';
    if (min && max) return `$${min?.toLocaleString()} - $${max?.toLocaleString()}`;
    if (min) return `From $${min?.toLocaleString()}`;
    return `Up to $${max?.toLocaleString()}`;
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const posted = new Date(date);
    const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:shadow-card transition-shadow duration-150 group">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
        <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
            <Image
              src={job?.company?.logo}
              alt={`${job?.company?.name} logo`}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <button 
              className="text-base sm:text-lg font-semibold text-text-primary mb-1 group-hover:text-secondary transition-colors duration-150 cursor-pointer line-clamp-2 text-left w-full"
              onClick={handleViewDetails}
            >
              {job?.title}
            </button>
            <p className="text-sm sm:text-base text-text-secondary font-medium mb-2">{job?.company?.name}</p>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-text-secondary mb-3">
              <div className="flex items-center space-x-1">
                <Icon name="MapPin" size={12} className="sm:w-[14px] sm:h-[14px]" />
                <span className="truncate max-w-[120px] sm:max-w-none">{job?.location}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Icon name="Clock" size={12} className="sm:w-[14px] sm:h-[14px]" />
                <span>{getTimeAgo(job?.postedDate)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Icon name="Briefcase" size={12} className="sm:w-[14px] sm:h-[14px]" />
                <span className="capitalize">{job?.type}</span>
              </div>
              
              {job?.remote && (
                <div className="flex items-center space-x-1">
                  <Icon name="Wifi" size={12} className="sm:w-[14px] sm:h-[14px]" />
                  <span>Remote</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile actions - show on mobile only */}
        <div className="flex sm:hidden items-center justify-between mt-2">
          <div className="text-sm sm:text-lg font-semibold text-text-primary">
            {formatSalary(job?.salary?.min, job?.salary?.max)}
          </div>
          <div className="flex items-center space-x-1">
            {userRole === 'job-seeker' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSaveJob}
                loading={isLoading}
                className="text-text-secondary hover:text-secondary p-1 w-8 h-8"
                title={isSaved ? "Remove from saved jobs" : "Save job"}
              >
                <Icon 
                  name={isSaved ? "Heart" : "Heart"} 
                  size={16}
                  className={isSaved ? "fill-current text-secondary" : ""}
                />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Desktop layout - hidden on mobile */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-text-primary">
            {formatSalary(job?.salary?.min, job?.salary?.max)}
          </div>
          
          <div className="flex items-center space-x-2">
            {userRole === 'job-seeker' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSaveJob}
                  loading={isLoading}
                  className="text-text-secondary hover:text-secondary"
                  title={isSaved ? "Remove from saved jobs" : "Save job"}
                >
                  <Icon 
                    name={isSaved ? "Heart" : "Heart"} 
                    size={18}
                    className={isSaved ? "fill-current text-secondary" : ""}
                  />
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleQuickApply}
                  loading={isApplying}
                  iconName="Send"
                  iconSize={14}
                  iconPosition="left"
                >
                  {isApplying ? 'Applying...' : 'Quick Apply'}
                </Button>
              </>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
              iconName="ExternalLink"
              iconSize={14}
              iconPosition="right"
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
      
      {/* Description and Skills */}
      <div className="border-t border-border pt-3 sm:pt-4">
        <p className="text-text-secondary text-xs sm:text-sm line-clamp-2 mb-3">
          {job?.description}
        </p>
        
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-0">
          {job?.skills?.slice(0, 3)?.map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded-md font-medium"
            >
              {skill}
            </span>
          ))}
          {job?.skills?.length > 3 && (
            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
              +{job?.skills?.length - 3} more
            </span>
          )}
        </div>
        
        {/* Mobile action buttons */}
        <div className="flex sm:hidden space-x-2 mt-3">
          {userRole === 'job-seeker' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleQuickApply}
              loading={isApplying}
              iconName="Send"
              iconSize={14}
              iconPosition="left"
              className="flex-1 text-xs"
            >
              {isApplying ? 'Applying...' : 'Quick Apply'}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetails}
            iconName="ExternalLink"
            iconSize={14}
            iconPosition="right"
            className="flex-1 text-xs"
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;