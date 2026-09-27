/// <reference types="cypress" />

/** Assert the document has no horizontal overflow at the current viewport. */
Cypress.Commands.add("assertNoHorizontalOverflow", () => {
  cy.document().then((doc) => {
    const el = doc.documentElement;
    const body = doc.body;
    const docWidth = Math.max(el.scrollWidth, body.scrollWidth);
    const viewWidth = el.clientWidth;
    expect(
      docWidth,
      `horizontal overflow: scrollWidth=${docWidth} clientWidth=${viewWidth}`,
    ).to.be.lte(viewWidth + 1);
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      assertNoHorizontalOverflow(): Chainable<void>;
    }
  }
}

export {};
