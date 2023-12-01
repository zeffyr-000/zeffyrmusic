describe('Home page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('Checks if title is well initialized', () => {
    cy.title().should('eq', 'La musique gratuite, légale, en illimité - Zeffyr Music')
  })

  it('Checks if the search form is present', () => {
    cy.get('#input_search_header').should('exist')
  })
})