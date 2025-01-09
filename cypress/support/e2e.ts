import '@testing-library/cypress/add-commands';

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      mockLinkedInAuth(): Chainable<void>;
      mockVerificationAPI(status: 'success' | 'failure' | 'error'): Chainable<void>;
    }
  }
}

// Custom command to handle login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.findByLabelText(/email/i).type(email);
    cy.findByLabelText(/password/i).type(password);
    cy.findByRole('button', { name: /sign in/i }).click();
    cy.url().should('not.include', '/login');
  });
});

// Custom command to mock LinkedIn OAuth
Cypress.Commands.add('mockLinkedInAuth', () => {
  cy.intercept('GET', '/auth/linkedin/init', {
    statusCode: 302,
    headers: {
      Location: '/auth/linkedin/callback?code=test_code&state=test_state',
    },
  }).as('linkedinInit');

  cy.intercept('GET', '/auth/linkedin/callback*', {
    statusCode: 200,
    body: {
      success: true,
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    },
  }).as('linkedinCallback');
});

// Custom command to mock verification API responses
Cypress.Commands.add('mockVerificationAPI', (status) => {
  const responses = {
    success: {
      statusCode: 200,
      body: {
        verified: true,
        trustScore: 85,
        details: {
          job: {
            title: 'Software Engineer',
            company: 'TechCorp',
            postedDate: new Date().toISOString(),
          },
          page: {
            name: 'TechCorp',
            followersCount: 5000,
            verified: true,
          },
        },
      },
    },
    failure: {
      statusCode: 200,
      body: {
        verified: false,
        details: {
          failureReason: 'Job posting has expired',
        },
      },
    },
    error: {
      statusCode: 500,
      body: {
        error: 'Internal server error',
      },
    },
  };

  cy.intercept('POST', '/api/verify/job/*', responses[status]).as('verifyJob');
}); 