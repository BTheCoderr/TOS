export const mockPageData = {
  id: 'test-page-id',
  name: 'Test Company',
  vanityName: 'testcompany',
  description: 'Test Company Description',
  followerCount: 1000,
  postsLastMonth: 15,
  engagementRate: 0.05,
  websiteUrl: 'https://testcompany.com',
  industry: 'Technology',
  specialties: ['Software', 'AI', 'Cloud'],
  locations: ['San Francisco, CA'],
  employeeCount: '51-200',
  founded: '2020',
  isVerified: true
};

export const mockMemberData = {
  id: 'test-member-id',
  firstName: 'John',
  lastName: 'Doe',
  headline: 'Senior Recruiter at Test Company',
  title: 'Senior Recruiter',
  company: 'Test Company',
  connectionDegree: 'SECOND',
  profilePicture: 'https://example.com/profile.jpg',
  publicProfileUrl: 'https://linkedin.com/in/johndoe',
  email: 'john.doe@testcompany.com',
  verifiedProfile: true,
  experience: [
    {
      title: 'Senior Recruiter',
      company: 'Test Company',
      startDate: '2020-01',
      current: true
    },
    {
      title: 'Recruiter',
      company: 'Previous Company',
      startDate: '2018-01',
      endDate: '2019-12'
    }
  ],
  skills: ['Technical Recruiting', 'Talent Acquisition', 'HR Management']
};

export const mockJobData = {
  id: 'test-job-id',
  title: 'Senior Software Engineer',
  company: 'Test Company',
  companyId: 'test-page-id',
  location: 'San Francisco, CA',
  description: 'We are looking for a Senior Software Engineer...',
  employmentType: 'FULL_TIME',
  experienceLevel: 'SENIOR',
  postedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'ACTIVE',
  applicantCount: 25,
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
  benefits: ['Health Insurance', '401k', 'Remote Work'],
  salary: {
    min: 150000,
    max: 200000,
    currency: 'USD'
  },
  poster: {
    id: 'test-member-id',
    name: 'John Doe',
    title: 'Senior Recruiter'
  }
}; 