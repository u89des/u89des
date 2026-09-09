import assert from 'node:assert/strict';
import {normalizeVisit,trackingAllowed} from '../api/_lib/analytics.js';
import handler from '../api/analytics.js';
const body={id:'c62e2fc4-2a4e-40b2-9e42-cfc8f7c4d026',seq:1,consent:true,referrer:'https://google.com/search?q=private@email.com',depth:120,seconds:10000,sections:['work','secret','work'],last_section:'studio',email:'private@email.com',contact_open:true};
const normalized=normalizeVisit(body,{'user-agent':'iPhone Mobile Safari','x-vercel-ip-country':'SA'});
assert.equal(normalized.source,'google.com');assert.equal(normalized.device,'mobile');assert.equal(normalized.country,'SA');assert.equal(normalized.depth,100);assert.equal(normalized.seconds,7200);assert.deepEqual(normalized.sections,['work']);assert.equal(normalized.last_section,'work');assert(!JSON.stringify(normalized).includes('private'));
assert.throws(()=>normalizeVisit({...body,consent:false}));assert.throws(()=>normalizeVisit({...body,id:'not-an-id'}));
assert.equal(trackingAllowed({origin:'https://evil.example'}),false);assert.equal(trackingAllowed({origin:'https://www.u89des.com',dnt:'1'}),false);assert.equal(trackingAllowed({origin:'https://www.u89des.com','sec-gpc':'1'}),false);
process.env.SUPABASE_URL='https://analytics.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
let role='owner',writes=0;
globalThis.fetch=async (input,options={})=>{const url=new URL(String(input));if(url.pathname==='/auth/v1/user')return Response.json({id:'owner'});if(url.pathname.endsWith('/workspaces'))return Response.json({id:'workspace'});if(url.pathname.endsWith('/memberships'))return Response.json({role});if(url.pathname.endsWith('/record_site_visit')){writes++;return Response.json(true);}if(url.pathname.endsWith('/site_analytics_report'))return Response.json({visits:3});throw Error(`Unexpected ${url.pathname}`);};
async function call(method,headers={},payload,query={}) {const res={code:200,setHeader(){},status(code){this.code=code;return this;},json(value){this.body=value;return this;},end(){return this;}};await handler({method,headers,body:payload,query},res);return res;}
assert.equal((await call('GET')).code,401);
for(role of ['client','collaborator','accountant','manager'])assert.equal((await call('GET',{authorization:'Bearer test'})).code,403);
role='owner';assert.equal((await call('GET',{authorization:'Bearer test'})).body.visits,3);
assert.equal((await call('POST',{origin:'https://www.u89des.com'},body)).code,204);assert.equal(writes,1);
await call('POST',{origin:'https://www.u89des.com',dnt:'1'},body);await call('POST',{origin:'https://evil.example'},body);assert.equal(writes,1);
assert.equal((await call('POST',{origin:'https://www.u89des.com'},{...body,consent:false})).code,400);
console.log('Analytics consent, data minimization, bot/origin exclusion and owner-only reports passed.');
