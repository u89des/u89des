export const STUDIO_PATH = "/studio";

const sectionForResource = (resource, detail = "") => {
  if (resource === "requests") return "requests";
  if (resource === "work-orders") return "work-orders";
  if (resource !== "projects") return "overview";
  if (detail === "brief") return "briefs";
  if (["quote", "contract"].includes(detail)) return "documents";
  if (detail === "finance") return "finance";
  return "projects";
};

export function isStudioPath(pathname = "") {
  return /^\/studio(?:\/|$)/.test(pathname);
}

export function studioHref(section = "overview", targetId = null) {
  const params = new URLSearchParams();
  if (section && section !== "overview") params.set("section", section);
  if (targetId) params.set("target", targetId);
  const query = params.toString();
  return query ? `${STUDIO_PATH}?${query}` : STUDIO_PATH;
}

export function normalizeStudioAction(actionUrl = "") {
  if (!actionUrl) return STUDIO_PATH;
  const url = new URL(actionUrl, "https://www.u89des.com");
  if (isStudioPath(url.pathname)) return `${url.pathname}${url.search}`;

  const legacy = url.pathname.match(/^\/(?:workspace|portal)\/(requests|projects|work-orders)\/([^/]+)(?:\/([^/]+))?/);
  if (!legacy) return STUDIO_PATH;
  return studioHref(sectionForResource(legacy[1], legacy[3]), legacy[2]);
}

export function readStudioLocation(locationLike = {}) {
  const pathname = locationLike.pathname || "";
  const search = locationLike.search || "";
  if (isStudioPath(pathname)) {
    const params = new URLSearchParams(search);
    return {
      studio: true,
      section: params.get("section") || "overview",
      targetId: params.get("target") || null,
    };
  }
  if (locationLike.hash === "#studio" || /^\/(?:workspace|portal)(?:\/|$)/.test(pathname)) {
    const normalized = normalizeStudioAction(`${pathname}${search}`);
    const url = new URL(normalized, "https://www.u89des.com");
    const params = new URLSearchParams(url.search);
    return {
      studio: true,
      section: params.get("section") || "overview",
      targetId: params.get("target") || null,
    };
  }
  return { studio: false, section: "overview", targetId: null };
}
