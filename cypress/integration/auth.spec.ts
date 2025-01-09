describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  describe('Email Login', () => {
    it('successfully logs in with valid credentials', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
          },
          token: 'test-token',
        },
      }).as('loginRequest');

      cy.findByLabelText(/email address/i).type('test@example.com');
      cy.findByLabelText(/password/i).type('password123');
      cy.findByRole('button', { name: /sign in/i }).click();

      cy.wait('@loginRequest');
      cy.url().should('eq', Cypress.config().baseUrl + '/verify');
    });

    it('shows error message with invalid credentials', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          error: 'Invalid email or password',
        },
      }).as('loginRequest');

      cy.findByLabelText(/email address/i).type('wrong@example.com');
      cy.findByLabelText(/password/i).type('wrongpassword');
      cy.findByRole('button', { name: /sign in/i }).click();

      cy.wait('@loginRequest');
      cy.findByText(/invalid email or password/i).should('be.visible');
    });

    it('validates required fields', () => {
      cy.findByRole('button', { name: /sign in/i }).click();
      
      cy.findByLabelText(/email address/i)
        .should('have.attr', 'aria-invalid', 'true');
      cy.findByLabelText(/password/i)
        .should('have.attr', 'aria-invalid', 'true');
    });
  });

  describe('LinkedIn Login', () => {
    it('successfully logs in with LinkedIn', () => {
      cy.mockLinkedInAuth();

      cy.findByText(/continue with linkedin/i).click();

      cy.wait('@linkedinInit');
      cy.wait('@linkedinCallback');

      cy.url().should('eq', Cypress.config().baseUrl + '/verify');
    });

    it('handles LinkedIn authentication failure', () => {
      cy.intercept('GET', '/auth/linkedin/init', {
        statusCode: 302,
        headers: {
          Location: '/auth/linkedin/callback?error=access_denied',
        },
      }).as('linkedinInit');

      cy.intercept('GET', '/auth/linkedin/callback*', {
        statusCode: 400,
        body: {
          error: 'LinkedIn authentication failed',
        },
      }).as('linkedinCallback');

      cy.findByText(/continue with linkedin/i).click();

      cy.wait('@linkedinInit');
      cy.wait('@linkedinCallback');

      cy.findByText(/linkedin authentication failed/i).should('be.visible');
    });
  });

  describe('Session Management', () => {
    it('preserves authentication state after page reload', () => {
      // Login first
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
          },
          token: 'test-token',
        },
      }).as('loginRequest');

      cy.findByLabelText(/email address/i).type('test@example.com');
      cy.findByLabelText(/password/i).type('password123');
      cy.findByRole('button', { name: /sign in/i }).click();

      cy.wait('@loginRequest');
      cy.url().should('include', '/verify');

      // Reload the page
      cy.reload();

      // Should still be on the verify page
      cy.url().should('include', '/verify');
    });

    it('redirects to login when session expires', () => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 401,
        body: {
          error: 'Session expired',
        },
      }).as('sessionCheck');

      cy.visit('/verify');

      cy.wait('@sessionCheck');
      cy.url().should('include', '/login');
      cy.findByText(/session expired/i).should('be.visible');
    });
  });
}); 