import {createClient} from '@supabase/supabase-js';
import {timingSafeEqual} from 'node:crypto';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  const expected=Buffer.from(`Bearer ${process.env.CRON_SECRET||''}`),actual=Buffer.from(req.headers.authorization||'');
  if(!process.env.CRON_SECRET||actual.length!==expected.length||!timingSafeEqual(actual,expected))return res.status(401).json({error:'Unauthorized'});
  if(req.method!=='GET')return res.status(405).end();
  if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(503).end();
  const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error}=await db.from('site_visits').delete().lt('created_at',new Date(Date.now()-90*86400000).toISOString());
  return res.status(error?503:200).json({cleaned:!error});
}
