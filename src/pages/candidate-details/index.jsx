import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import RoleAdaptiveNavbar from '../../components/ui/RoleAdaptiveNavbar';
import NavigationBreadcrumbs from '../../components/ui/NavigationBreadcrumbs';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const CandidateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCandidateDetails();
  }, [id]);

  const fetchCandidateDetails = async () => {
    try {
      setIsLoading(true);
      // Mock detailed candidate data
      const mockCandidate = {
        id: parseInt(id),
        full_name: 'John Smith',
        current_job_title: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        phone: '+1 (555) 123-4567',
        email: 'john.smith@email.com',
        industry: 'Technology',
        years_experience: '5-10',
        remote_work_preference: 'Hybrid',
        bio: 'Experienced full-stack developer with expertise in React, Node.js, and cloud technologies. Passionate about building scalable applications and leading development teams.',
        skills: ['React', 'Node.js', 'JavaScript', 'Python', 'AWS', 'Docker', 'PostgreSQL', 'GraphQL'],
        languages: [
          { language: 'English', proficiency: 'Native' },
          { language: 'Spanish', proficiency: 'Conversational' },
          { language: 'French', proficiency: 'Basic' }
        ],
        availability: 'Available immediately',
        notice_period: '2 weeks',
        expected_salary_min: 120000,
        expected_salary_max: 150000,
        salary_currency: 'USD',
        linkedin_url: 'https://linkedin.com/in/johnsmith',
        github_url: 'https://github.com/johnsmith',
        portfolio_url: 'https://johnsmith.dev',
        resume_url: 'john_smith_resume.pdf',
        education: [
          {
            institution: 'Stanford University',
            degree: 'Master of Science',
            field: 'Computer Science',
            start_date: '2016',
            end_date: '2018',
            gpa: '3.8'
          },
          {
            institution: 'UC Berkeley',
            degree: 'Bachelor of Science',
            field: 'Computer Engineering',
            start_date: '2012',
            end_date: '2016',
            gpa: '3.6'
          }
        ],
        work_experience: [
          {
            company: 'TechCorp Inc.',
            position: 'Senior Software Engineer',
            start_date: '2020',
            end_date: 'Present',
            description: 'Lead a team of 5 developers building scalable web applications. Implemented microservices architecture resulting in 40% performance improvement.',
            technologies: ['React', 'Node.js', 'AWS', 'Docker']
          },
          {
            company: 'StartupXYZ',
            position: 'Full Stack Developer',
            start_date: '2018',
            end_date: '2020',
            description: 'Built end-to-end web applications from concept to deployment. Worked directly with founders to define product requirements.',
            technologies: ['Vue.js', 'Python', 'PostgreSQL', 'Redis']
          }
        ],
        certifications: [
          {
            name: 'AWS Certified Solutions Architect',
            issuer: 'Amazon Web Services',
            date: '2021',
            credential_id: 'AWS-12345'
          },
          {
            name: 'Certified Kubernetes Administrator',
            issuer: 'Cloud Native Computing Foundation',
            date: '2020',
            credential_id: 'CKA-67890'
          }
        ],
        employment_type_preferences: ['full-time', 'contract'],
        date_of_birth: '1990-05-15',
        nationality: 'American'
      };
      
      setCandidate(mockCandidate);
    } catch (error) {
      console.error('Error fetching candidate details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSalaryRange = (min, max, currency) => {
    if (!min && !max) return 'Salary not specified';
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    if (!max) return `${symbol}${min?.toLocaleString()}+`;
    if (!min) return `Up to ${symbol}${max?.toLocaleString()}`;
    return `${symbol}${min?.toLocaleString()} - ${symbol}${max?.toLocaleString()}`;
  };

  const handleContact = () => {
    window.location.href = `mailto:${candidate.email}?subject=Opportunity at ${userProfile?.company_name || 'Our Company'}`;
  };

  const downloadResume = () => {
    // In a real app, this would download from Supabase storage
    alert('Resume download functionality would be implemented with Supabase storage');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <RoleAdaptiveNavbar />
        <div className="pt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-border rounded mb-4"></div>
              <div className="h-6 bg-border rounded mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-40 bg-border rounded"></div>
                  <div className="h-60 bg-border rounded"></div>
                </div>
                <div className="space-y-6">
                  <div className="h-40 bg-border rounded"></div>
                  <div className="h-40 bg-border rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-background">
        <RoleAdaptiveNavbar />
        <div className="pt-16 flex items-center justify-center">
          <div className="text-center">
            <Icon name="UserX" size={48} className="mx-auto text-text-secondary mb-4" />
            <h1 className="text-2xl font-bold text-text-primary mb-2">Candidate Not Found</h1>
            <p className="text-text-secondary mb-6">The candidate you're looking for doesn't exist.</p>
            <Button
              variant="default"
              onClick={() => navigate('/candidates')}
              iconName="ArrowLeft"
              iconPosition="left"
            >
              Back to Candidates
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NavigationBreadcrumbs className="mb-6" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="bg-card border border-border rounded-lg shadow-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">
                      {candidate.full_name}
                    </h1>
                    <p className="text-xl text-text-secondary mb-2">
                      {candidate.current_job_title}
                    </p>
                    <div className="flex items-center text-text-secondary mb-2">
                      <Icon name="MapPin" size={16} className="mr-2" />
                      {candidate.location}
                    </div>
                    <div className="flex items-center text-text-secondary">
                      <Icon name="Clock" size={16} className="mr-2" />
                      {candidate.years_experience} years experience
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {candidate.linkedin_url && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(candidate.linkedin_url, '_blank')}
                        iconName="Linkedin"
                      />
                    )}
                    {candidate.github_url && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(candidate.github_url, '_blank')}
                        iconName="Github"
                      />
                    )}
                    {candidate.portfolio_url && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(candidate.portfolio_url, '_blank')}
                        iconName="ExternalLink"
                      />
                    )}
                  </div>
                </div>

                <p className="text-text-secondary mb-6">
                  {candidate.bio}
                </p>

                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-block px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Work Experience */}
              <div className="bg-card border border-border rounded-lg shadow-card p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">Work Experience</h3>
                <div className="space-y-6">
                  {candidate.work_experience.map((job, index) => (
                    <div key={index} className="border-l-2 border-primary pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-medium text-text-primary">
                          {job.position}
                        </h4>
                        <span className="text-sm text-text-secondary">
                          {job.start_date} - {job.end_date}
                        </span>
                      </div>
                      <p className="text-text-secondary font-medium mb-2">{job.company}</p>
                      <p className="text-text-secondary mb-3">{job.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {job.technologies.map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="inline-block px-2 py-1 text-xs bg-border text-text-secondary rounded"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="bg-card border border-border rounded-lg shadow-card p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">Education</h3>
                <div className="space-y-4">
                  {candidate.education.map((edu, index) => (
                    <div key={index} className="border-l-2 border-success pl-4">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-lg font-medium text-text-primary">
                          {edu.degree} in {edu.field}
                        </h4>
                        <span className="text-sm text-text-secondary">
                          {edu.start_date} - {edu.end_date}
                        </span>
                      </div>
                      <p className="text-text-secondary">{edu.institution}</p>
                      {edu.gpa && (
                        <p className="text-sm text-text-secondary">GPA: {edu.gpa}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-card border border-border rounded-lg shadow-card p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">Certifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidate.certifications.map((cert, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium text-text-primary mb-1">{cert.name}</h4>
                      <p className="text-sm text-text-secondary mb-1">{cert.issuer}</p>
                      <p className="text-sm text-text-secondary">
                        Issued: {cert.date}
                      </p>
                      {cert.credential_id && (
                        <p className="text-xs text-text-secondary mt-1">
                          ID: {cert.credential_id}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Actions */}
              <div className="bg-card border border-border rounded-lg shadow-card p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Contact Candidate</h3>
                <div className="space-y-3">
                  <Button
                    variant="default"
                    onClick={handleContact}
                    iconName="Mail"
                    iconPosition="left"
                    className="w-full"
                  >
                    Send Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadResume}
                    iconName="Download"
                    iconPosition="left"
                    className="w-full"
                  >
                    Download Resume
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/candidates')}
                    iconName="ArrowLeft"
                    iconPosition="left"
                    className="w-full"
                  >
                    Back to Search
                  </Button>
                </div>
              </div>

              {/* Quick Details */}
              <div className="bg-card border border-border rounded-lg shadow-card p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Salary Range:</span>
                    <span className="text-text-primary font-medium">
                      {formatSalaryRange(candidate.expected_salary_min, candidate.expected_salary_max, candidate.salary_currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Availability:</span>
                    <span className="text-text-primary">{candidate.availability}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Notice Period:</span>
                    <span className="text-text-primary">{candidate.notice_period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Remote Work:</span>
                    <span className="text-text-primary capitalize">{candidate.remote_work_preference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Industry:</span>
                    <span className="text-text-primary">{candidate.industry}</span>
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div className="bg-card border border-border rounded-lg shadow-card p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Languages</h3>
                <div className="space-y-2">
                  {candidate.languages.map((lang, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-text-primary">{lang.language}</span>
                      <span className="text-text-secondary text-sm">{lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employment Preferences */}
              <div className="bg-card border border-border rounded-lg shadow-card p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Employment Preferences</h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.employment_type_preferences.map((type, index) => (
                    <span
                      key={index}
                      className="inline-block px-3 py-1 text-sm bg-success/10 text-success rounded-full capitalize"
                    >
                      {type.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetails;