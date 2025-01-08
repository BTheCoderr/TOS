class MockDataService {
  static companies = [
    {
      id: '1',
      name: 'Tech Corp',
      registrationNumber: 'TC123456',
      linkedInData: {
        followers: 5000,
        employeeCount: 150,
        founded: '2010',
        industry: 'Technology',
        locations: ['San Francisco, CA', 'New York, NY'],
        verificationScore: 85
      }
    },
    {
      id: '2',
      name: 'Innovation Labs',
      registrationNumber: 'IL789012',
      linkedInData: {
        followers: 2000,
        employeeCount: 50,
        founded: '2018',
        industry: 'Research',
        locations: ['Boston, MA'],
        verificationScore: 75
      }
    },
    {
      id: '3',
      name: 'Fake Company',
      registrationNumber: 'FC111111',
      linkedInData: {
        followers: 100,
        employeeCount: 5,
        founded: '2023',
        industry: 'Unknown',
        locations: [],
        verificationScore: 30
      }
    }
  ];

  static verificationHistory = [
    {
      companyId: '1',
      timestamp: new Date('2024-01-15'),
      status: 'Verified',
      source: 'LinkedIn',
      score: 85
    },
    {
      companyId: '2',
      timestamp: new Date('2024-01-16'),
      status: 'Pending',
      source: 'LinkedIn',
      score: 75
    }
  ];

  static async getCompanyByRegistration(registrationNumber) {
    return this.companies.find(c => c.registrationNumber === registrationNumber);
  }

  static async getCompanyVerificationHistory(companyId) {
    return this.verificationHistory.filter(h => h.companyId === companyId);
  }

  static async verifyCompany(companyData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const company = this.companies.find(
      c => c.registrationNumber === companyData.registrationNumber
    );

    if (!company) {
      return {
        status: 'Failed',
        trustScore: 0,
        message: 'Company not found'
      };
    }

    const score = company.linkedInData.verificationScore;
    return {
      status: score >= 80 ? 'Verified' : 'Pending',
      trustScore: score,
      companyData: company,
      verificationDetails: {
        linkedIn: company.linkedInData,
        lastVerified: new Date(),
        factors: [
          { name: 'Company Age', score: score > 70 ? 30 : 15 },
          { name: 'Employee Count', score: company.linkedInData.employeeCount > 100 ? 25 : 15 },
          { name: 'LinkedIn Presence', score: company.linkedInData.followers > 1000 ? 20 : 10 }
        ]
      }
    };
  }
}

module.exports = MockDataService; 