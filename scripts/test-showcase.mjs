import assert from "node:assert/strict";
import { portfolioCatalog, visiblePortfolio, originalLogos, originalCampaigns } from "../src/showcase-data.js";

const old = { portfolioProjects: [{ id: "legacy", name: "Brand" }], workVisibility: [false] };
assert.equal(portfolioCatalog(old).length, 48);
assert.equal(visiblePortfolio(old, "brand").length, 0);
assert.equal(visiblePortfolio(old, "logo").length, 43);
assert.equal(visiblePortfolio(old, "campaign").length, 4);
const migrated = { ...old, portfolioCollectionsInitialized: true, portfolioProjects: portfolioCatalog(old) };
assert.deepEqual(portfolioCatalog(migrated), migrated.portfolioProjects);
assert.equal(new Set(portfolioCatalog(migrated).map((item) => item.id)).size, 48);
migrated.workVisibility[1] = false;
assert.equal(visiblePortfolio(migrated, "logo").length, 42);
assert.deepEqual(visiblePortfolio({ portfolioCollectionsInitialized: true, portfolioProjects: [] }, "logo"), []);
assert(originalLogos.every((item) => item.cover.endsWith('.svg')));
assert(originalCampaigns.every((item) => item.kind === 'campaign'));
console.log('Showcase migration, legacy visibility, empty collections and section isolation passed.');
import { sectionIsVisible, homeSections } from '../src/section-visibility.js';
for (const section of homeSections) {
  if (sectionIsVisible({sectionVisibility:{[section.id]:false}},section.id)) throw Error('Hidden section visible');
  if (!sectionIsVisible({sectionVisibility:{[section.id]:true}},section.id)) throw Error('Enabled section hidden');
}
if (sectionIsVisible({},'campaigns') || sectionIsVisible({},'typography')) throw Error('Unprepared sections should default to hidden');
if (!sectionIsVisible({},'logos')) throw Error('Existing logo grid should remain visible');
