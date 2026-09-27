/// <reference types="cypress" />

/**
 * Responsive contract aligned with ui-responsive.css + research_sportsbook_ux.md
 * Breakpoints: 320, 375, 720, 980, 1280
 */

const ROUTES = ["/", "/matches", "/crash", "/wallet", "/account"] as const;

const VIEWPORTS = [
  { name: "iphone-se", width: 320, height: 568, isMobile: true },
  { name: "iphone-12", width: 390, height: 844, isMobile: true },
  { name: "tablet", width: 768, height: 1024, isMobile: true },
  { name: "laptop", width: 1280, height: 800, isMobile: false },
] as const;

function visitReady(path: string) {
  cy.visit(path, { failOnStatusCode: false });
  cy.get(".nexus-shell", { timeout: 20_000 }).should("exist");
}

describe("Responsive shell", () => {
  for (const vp of VIEWPORTS) {
    describe(vp.name, () => {
      beforeEach(() => {
        cy.viewport(vp.width, vp.height);
      });

      it(`home has no horizontal overflow @ ${vp.width}`, () => {
        visitReady("/");
        cy.assertNoHorizontalOverflow();
      });

      it(`bottom nav visibility @ ${vp.width}`, () => {
        visitReady("/");
        if (vp.width < 900) {
          cy.get(".mobile-bottom-nav").should("be.visible");
          cy.get(".mobile-bottom-nav a").should("have.length.at.least", 4);
        } else {
          cy.get(".mobile-bottom-nav").should("not.be.visible");
        }
      });

      it(`topbar is present and within viewport @ ${vp.width}`, () => {
        visitReady("/");
        cy.get(".topbar").should("be.visible");
        cy.get(".topbar").then(($el) => {
          const rect = $el[0].getBoundingClientRect();
          expect(rect.left).to.be.gte(-1);
          expect(rect.right).to.be.lte(vp.width + 1);
        });
      });
    });
  }
});

describe("Responsive routes — no overflow", () => {
  for (const path of ROUTES) {
    it(`${path} at 390px has no horizontal overflow`, () => {
      cy.viewport(390, 844);
      visitReady(path);
      cy.assertNoHorizontalOverflow();
      cy.get(".nexus-shell").should("be.visible");
    });
  }
});

describe("Touch targets (mobile)", () => {
  beforeEach(() => {
    cy.viewport(390, 844);
  });

  it("bottom nav links meet ~44px height", () => {
    visitReady("/");
    cy.get(".mobile-bottom-nav a").each(($a) => {
      const h = $a[0].getBoundingClientRect().height;
      expect(h, $a.text()).to.be.gte(44);
    });
  });

  it("login / primary header control is tappable", () => {
    visitReady("/");
    cy.get(".login-button, .header-actions button").first().then(($btn) => {
      const rect = $btn[0].getBoundingClientRect();
      expect(rect.height).to.be.gte(40);
      expect(rect.width).to.be.gte(40);
    });
  });
});

describe("Matches filters scroll container", () => {
  it("filter row does not expand page width at 320px", () => {
    cy.viewport(320, 568);
    visitReady("/matches");
    cy.assertNoHorizontalOverflow();
    cy.get("body").then(($body) => {
      if ($body.find(".filter-row, .league-filter-pills").length) {
        cy.get(".filter-row, .league-filter-pills").first().should(($el) => {
          expect($el[0].scrollWidth).to.be.gte($el[0].clientWidth - 1);
        });
      }
    });
  });
});

describe("Auth modal opens on mobile", () => {
  it("opens login dialog without page overflow", () => {
    cy.viewport(390, 844);
    visitReady("/");
    cy.get(".login-button").first().click({ force: true });
    cy.get(".auth-modal, [role='dialog']", { timeout: 10_000 }).should("be.visible");
    cy.assertNoHorizontalOverflow();
  });
});
