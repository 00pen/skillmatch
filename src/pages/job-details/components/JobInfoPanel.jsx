import React from 'react';
import Icon from '../../../components/AppIcon';

const JobInfoPanel = ({ job }) => {
  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUrgencyColor = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 3) return 'text-error';
    if (daysLeft <= 7) return 'text-warning';
    return 'text-text-secondary';
  };

  const infoItems = [
    {
      icon: 'Briefcase',
      label: 'Job Type',
      value: job?.type,
      color: 'text-text-primary'
    },
    {
      icon: 'TrendingUp',
      label: 'Experience Level',
      value: job?.experienceLevel,
      color: 'text-text-primary'
    },
    {
      icon: 'MapPin',
      label: 'Location',
      value: job?.location,
      color: 'text-text-primary'
    },
    {
      icon: 'DollarSign',
      label: 'Salary Range',
      value: job?.salaryRange?.min && job?.salaryRange?.max 
        ? `$${job?.salaryRange?.min?.toLocaleString()} - $${job?.salaryRange?.max?.toLocaleString()}`
        : 'Competitive',
      color: 'text-success'
    },
    {
      icon: 'Calendar',
      label: 'Posted Date',
      value: formatDate(job?.postedDate),
      color: 'text-text-secondary'
    },
    {
      icon: 'Clock',
      label: 'Application Deadline',
      value: job?.applicationDeadline ? formatDate(job?.applicationDeadline) : 'Not specified',
      color: job?.applicationDeadline ? getUrgencyColor(job?.applicationDeadline) : 'text-text-secondary'
    },
    {
      icon: 'Users',
      label: 'Applicants',
      value: `${job?.applicantCount || 0} applied`,
      color: 'text-text-secondary'
    },
    {
      icon: 'Eye',
      label: 'Views',
      value: `${job?.viewCount || 0} views`,
      color: 'text-text-secondary'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-card">
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Icon name="Info" size={20} />
        Job Information
      </h3>
      <div className="space-y-4">
        {infoItems && Array.isArray(infoItems) ? infoItems.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Icon name={item?.icon} size={16} className="text-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-secondary mb-1">
                {item?.label}
              </div>
              <div className={`text-sm font-medium ${item?.color} break-words`}>
                {item?.value}
              </div>
            </div>
          </div>
        )) : null}
      </div>
      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-secondary">
              {job?.matchScore || 85}%
            </div>
            <div className="text-xs text-text-secondary">Match Score</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-text-primary">
              {job?.company?.openPositions || 12}
            </div>
            <div className="text-xs text-text-secondary">Open Positions</div>
          </div>
        </div>
      </div>
      {/* Application Status */}
      {job?.applicationStatus && (
        <div className="mt-4 p-3 bg-accent rounded-lg">
          <div className="flex items-center gap-2">
            <Icon name="CheckCircle" size={16} className="text-secondary" />
            <span className="text-sm font-medium text-text-primary">
              Application Status: {job?.applicationStatus}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobInfoPanel;