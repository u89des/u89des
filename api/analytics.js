import { createClient } from '@supabase/supabase-js';
import { normalizeVisit, trackingAllowed } from './_lib/analytics.js';

export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if (!['GET','POST'].includes(req.method)) return res.status(405).json({error:'Method not allowed'});
  if (req.method === 'POST' && !trackingAllowed(req.headers)) return res.status(204).end();
  let visit;
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (JSON.stringify(body).length > 2500) throw new Error('Large payload');
      visit = normalizeVisit(body,req.headers);
    } catch { return res.status(400).json({error:'Invalid visit'}); }
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({error:'الإحصاءات غير مهيأة'});
  const db = createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  if (req.method === 'POST') {
    const {data,error} = await db.rpc('record_site_visit',{p:visit});
    if (error) return res.status(503).json({error:'تعذر حفظ الإحصاءات'});
    return res.status(data ? 204 : 429).end();
  }
  const token = req.headers.authorization?.replace(/^Bearer\s+/i,'');
  if (!token) return res.status(401).json({error:'سجّل الدخول'});
  const {data:auth,error:authError} = await db.auth.getUser(token);
  if (authError || !auth.user) return res.status(401).json({error:'انتهت الجلسة'});
  const {data:w} = await db.from('workspaces').select('id').eq('slug','u89').single();
  if (!w) return res.status(503).json({error:'تعذر تحميل المساحة'});
  const {data:m} = await db.from('memberships').select('role').eq('workspace_id',w.id).eq('user_id',auth.user.id).eq('status','active').maybeSingle();
  if (m?.role !== 'owner') return res.status(403).json({error:'الإحصاءات متاحة للمالك فقط'});
  const days = [1,7,30,90].includes(Number(req.query?.days)) ? Number(req.query.days) : 7;
  const {data,error} = await db.rpc('site_analytics_report',{p_days:days});
  if (error) return res.status(503).json({error:'تعذر تحميل الإحصاءات. تأكد من تطبيق ترحيل قاعدة البيانات.'});
  return res.json({...data,days});
}
