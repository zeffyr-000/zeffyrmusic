describe('Home page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('Checks if title is well initialized', () => {
    cy.title().should('eq', 'Écoutez de la Musique Gratuite et Sans Pub - ZeffyrMusic')
  })

  it('Checks if the search form is present', () => {
    cy.get('#input_search_header').should('exist')
  })
})