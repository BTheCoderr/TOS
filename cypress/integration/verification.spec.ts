describe('Job Verification Flow', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/verify/job/*', {
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
    }).as('verifyJob');

    cy.visit('/verify');
  });

  it('successfully verifies a job posting', () => {
    // Fill in the form
    cy.findByLabelText(/company page id/i).type('company123');
    cy.findByLabelText(/job posting id/i).type('job123');

    // Submit the form
    cy.findByRole('button', { name: /verify/i }).click();

    // Check loading state
    cy.findByText(/verifying/i).should('be.visible');
    cy.findByRole('button', { name: /verifying/i }).should('be.disabled');

    // Wait for the API response
    cy.wait('@verifyJob');

    // Check the results
    cy.findByText('Verified').should('be.visible');
    cy.findByText('85%').should('be.visible');
    cy.findByText('Software Engineer').should('be.visible');
    cy.findByText('TechCorp').should('be.visible');
  });

  it('handles verification failure', () => {
    cy.intercept('POST', '/api/verify/job/*', {
      statusCode: 200,
      body: {
        verified: false,
        details: {
          failureReason: 'Job posting has expired',
        },
      },
    }).as('verifyJobFailure');

    // Fill in the form
    cy.findByLabelText(/company page id/i).type('invalid123');
    cy.findByLabelText(/job posting id/i).type('expired123');

    // Submit the form
    cy.findByRole('button', { name: /verify/i }).click();

    // Wait for the API response
    cy.wait('@verifyJobFailure');

    // Check error message
    cy.findByText('Failed').should('be.visible');
    cy.findByText('Job posting has expired').should('be.visible');
  });

  it('handles API errors', () => {
    cy.intercept('POST', '/api/verify/job/*', {
      statusCode: 500,
      body: {
        error: 'Internal server error',
      },
    }).as('verifyJobError');

    // Fill in the form
    cy.findByLabelText(/company page id/i).type('company123');
    cy.findByLabelText(/job posting id/i).type('job123');

    // Submit the form
    cy.findByRole('button', { name: /verify/i }).click();

    // Wait for the API response
    cy.wait('@verifyJobError');

    // Check error message
    cy.findByText(/internal server error/i).should('be.visible');
  });

  it('validates required fields', () => {
    // Try to submit without filling fields
    cy.findByRole('button', { name: /verify/i }).should('be.disabled');

    // Fill only company ID
    cy.findByLabelText(/company page id/i).type('company123');
    cy.findByRole('button', { name: /verify/i }).should('be.disabled');

    // Fill only job ID
    cy.findByLabelText(/company page id/i).clear();
    cy.findByLabelText(/job posting id/i).type('job123');
    cy.findByRole('button', { name: /verify/i }).should('be.disabled');

    // Fill both fields
    cy.findByLabelText(/company page id/i).type('company123');
    cy.findByRole('button', { name: /verify/i }).should('be.enabled');
  });

  it('preserves form state on page reload', () => {
    // Fill in the form
    cy.findByLabelText(/company page id/i).type('company123');
    cy.findByLabelText(/job posting id/i).type('job123');

    // Submit and get results
    cy.findByRole('button', { name: /verify/i }).click();
    cy.wait('@verifyJob');

    // Reload the page
    cy.reload();

    // Check if form fields are preserved
    cy.findByLabelText(/company page id/i).should('have.value', 'company123');
    cy.findByLabelText(/job posting id/i).should('have.value', 'job123');
  });
}); 