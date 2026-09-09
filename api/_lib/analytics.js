export const sections = ['work','logos','campaigns','services','about','footer'];
const flags = ['contact_open','service_open','contact_sent','project_sent'];
export function normalizeVisit(body, headers = {}) {
  if (!body || body.consent !== true || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id || '')) throw new Error('Invalid visit');
  if (!Number.isInteger(body.seq) || body.seq < 1 || body.seq > 500) throw new Error('Invalid sequence');
  let source = 'direct';
  try { const url = new URL(body.referrer); if (/^https?:$/.test(url.protocol) && !['u89des.com','www.u89des.com'].includes(url.hostname)) source = url.hostname.slice(0,150); } catch {}
  const ua = String(headers['user-agent'] || '');
  const device = /ipad|tablet/i.test(ua) || (/macintosh/i.test(ua) && body.touch === true) ? 'tablet' : /mobile|iphone|android/i.test(ua) ? 'mobile' : 'desktop';
  const browser = /edg\//i.test(ua) ? 'Edge' : /opr\//i.test(ua) ? 'Opera' : /firefox|fxios/i.test(ua) ? 'Firefox' : /chrome|crios/i.test(ua) ? 'Chrome' : /safari/i.test(ua) ? 'Safari' : 'Other';
  const country = /^[A-Z]{2}$/.test(headers['x-vercel-ip-country'] || '') ? headers['x-vercel-ip-country'] : 'unknown';
  const bound = (v,max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
  return {id:body.id,seq:body.seq,source,country,device,browser,depth:bound(body.depth,100),seconds:bound(body.seconds,7200),last_section:sections.includes(body.last_section) ? body.last_section : 'work',sections:[...new Set((Array.isArray(body.sections) ? body.sections : []).filter(s=>sections.includes(s)))],...Object.fromEntries(flags.map(k=>[k,body[k]===true]))};
}

export function trackingAllowed(headers) {
  return ['https://u89des.com','https://www.u89des.com'].includes(headers.origin) && headers.dnt !== '1' && headers['sec-gpc'] !== '1' && !/bot|spider|crawler|headless|preview/i.test(headers['user-agent'] || '');
}
