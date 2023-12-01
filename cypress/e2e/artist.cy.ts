describe('Artist page - Johnny Hallyday', () => {
    beforeEach(() => {
        cy.visit('/artist/502')
    })

    it('Checks if artist name is correct', () => {
        cy.get('#artist_haut_titre>h1').should('exist')
        cy.get('#artist_haut_titre>h1').should('contain', 'Johnny Hallyday')
    })

    it('Checks if artist image is present', () => {
        cy.get('#artist_img_big').should('exist')
        cy.get('#artist_img_big').should('have.attr', 'src', 'https://api.deezer.com/artist/1060/image?size=big')
    })
})