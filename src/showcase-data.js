import { portfolioProjects } from "./portfolio-data.js";

export const originalLogos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 22, 23, 24, 25, 26, 27, 28, 29, 30, 36, 37, 38, 41, 42, 43, 46, 49, 62, 63, 73, 80, 83, 85, 99].map((number) => ({
  id: `logo-original-${number}`, kind: "logo", name: `شعار ${number}`, cover: `/logos-original/Artboard ${number}-2.svg`, gallery: [],
}));
export const originalCampaigns = [
  ["bukhary-posters", "ملصقات بخاري أختر"],
  ["spices-billboard", "حملة قصر التوابل"],
  ["tashkeela-van", "حملة ششاي على المركبة"],
  ["bukhary-billboard", "لوحة بخاري أختر الإعلانية"],
].map(([id, name]) => ({ id: `campaign-${id}`, kind: "campaign", name, cover: `/portfolio/${id}.webp`, gallery: [] }));

// Append the existing public assets once, preserving legacy visibility indices.
export function portfolioCatalog(content = {}) {
  const projects = Array.isArray(content.portfolioProjects) ? content.portfolioProjects : portfolioProjects;
  if (content.portfolioCollectionsInitialized === true) return projects;
  const ids = new Set(projects.map((item) => item.id));
  return [...projects, ...[...originalLogos, ...originalCampaigns].filter((item) => !ids.has(item.id))];
}

export function visiblePortfolio(content = {}, kind = "brand") {
  return portfolioCatalog(content).filter((item, index) => (item.kind || "brand") === kind && content.workVisibility?.[index] !== false);
}
