describe('Top 1 page', () => {
    beforeEach(() => {
        cy.visit('/top/1')
    })

    it('Checks if title is correct', () => {
        cy.title().should('eq', 'La Hit List - Zeffyr Music')
    })

    it('Checks if image is present', () => {
        cy.get('#playlist_img_big').should('exist')
    })

    it('Checks if title is present', () => {
        cy.get('#playlist_haut_titre>h1').should('exist')
        cy.get('#playlist_haut_titre>h1').should('contain', 'La Hit List')
    })

    it('Checksplaylist description is present', () => {
        cy.get('#playlist_haut_titre>p').should('exist')
        cy.get('#playlist_haut_titre>p').should('contain', 'Un condensé des plus gros hits du moment.')
    })
})