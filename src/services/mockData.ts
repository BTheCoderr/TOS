import { CompanyDetails, VerificationResult } from '../types/verification';

export const mockCompanies = [
  {
    name: 'Acme Corporation',
    registrationNumber: '12345678',
    jurisdiction: 'gb',
    status: 'active',
    incorporationDate: '2010-01-01',
    address: '123 Business Street, London, UK',
    officers: [
      { name: 'John Doe', role: 'Director', appointedOn: '2010-01-01' },
      { name: 'Jane Smith', role: 'Secretary', appointedOn: '2010-01-01' }
    ],
    filings: [
      { type: 'Annual Return', date: '2023-01-01' },
      { type: 'Accounts', date: '2023-01-01' }
    ]
  },
  {
    name: 'Tech Innovators Ltd',
    registrationNumber: '87654321',
    jurisdiction: 'us',
    status: 'active',
    incorporationDate: '2015-06-15',
    address: '456 Innovation Drive, San Francisco, CA, USA',
    officers: [
      { name: 'Sarah Johnson', role: 'CEO', appointedOn: '2015-06-15' },
      { name: 'Mike Wilson', role: 'CTO', appointedOn: '2015-06-15' }
    ],
    filings: [
      { type: 'Annual Report', date: '2023-06-15' },
      { type: 'Tax Return', date: '2023-06-15' }
    ]
  }
];

export function findMockCompany(query: CompanyDetails): VerificationResult | null {
  const company = mockCompanies.find(c => 
    c.name.toLowerCase().includes(query.name.toLowerCase()) ||
    (query.registrationNumber && c.registrationNumber === query.registrationNumber)
  );

  if (!company) return null;

  return {
    isVerified: true,
    details: {
      name: company.name,
      registrationNumber: company.registrationNumber,
      status: company.status as 'active' | 'inactive' | 'unknown',
      jurisdiction: company.jurisdiction,
      incorporationDate: company.incorporationDate,
      address: company.address
    },
    metadata: {
      verifiedAt: new Date().toISOString(),
      source: 'MOCK',
      confidence: 0.9
    }
  };
}

export function getMockVerificationResult(): VerificationResult {
  return {
    isVerified: true,
    details: {
      name: 'Mock Company Inc.',
      registrationNumber: 'MC123456',
      status: 'active',
      jurisdiction: 'US',
      incorporationDate: '2020-01-01',
      address: '123 Mock Street, Mock City, MC 12345',
      industry: 'Technology'
    },
    metadata: {
      verifiedAt: new Date().toISOString(),
      source: 'MOCK',
      confidence: 0.9
    }
  };
} 