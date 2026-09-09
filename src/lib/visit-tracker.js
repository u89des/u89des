const eventNames = new Set(['contact_open','service_open','contact_sent','project_sent']);
let currentTracker = null;
export function recordVisitAction(name) { if (eventNames.has(name)) currentTracker?.(name); }

export function startVisitTracking() {
  if (location.pathname !== '/' || location.hash === '#studio' || navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return () => {};
  const state = { id:crypto.randomUUID(),consent:true,seq:0,referrer:document.referrer ? new URL(document.referrer).origin : '',touch:navigator.maxTouchPoints>1,depth:0,seconds:0,last_section:'work',sections:[],contact_open:false,service_open:false,contact_sent:false,project_sent:false };
  let lastTick = performance.now();
  let wasVisible = document.visibilityState === 'visible';
  let frame = 0;
  let stopped = false;
  const tick = () => {
    const now = performance.now();
    if (wasVisible) state.seconds = Math.min(7200,state.seconds + Math.min(20,(now-lastTick)/1000));
    wasVisible = document.visibilityState === 'visible';
    lastTick=now;
  };
  const flush = () => {
    if (stopped || state.seq>=500) return;
    tick(); state.seq++;
    const payload = JSON.stringify({...state,seconds:Math.floor(state.seconds)});
    if (!navigator.sendBeacon?.('/api/analytics',new Blob([payload],{type:'application/json'}))) {
      fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:payload,keepalive:true}).catch(()=>{});
    }
  };
  const depth = () => { frame=0; const height=document.documentElement.scrollHeight-innerHeight; state.depth=Math.max(state.depth,height>0 ? Math.min(100,Math.round(scrollY/height*100)) : 100); };
  const onScroll = () => { if (!frame) frame=requestAnimationFrame(depth); };
  const observer = new IntersectionObserver(entries=>{
    for (const entry of entries) if (entry.isIntersecting) {
      const section = entry.target.tagName === 'FOOTER' ? 'footer' : entry.target.id;
      if (!state.sections.includes(section)) state.sections.push(section);
      state.last_section=section;
    }
  },{rootMargin:'-20% 0px -45% 0px',threshold:0});
  document.querySelectorAll('#work,#logos,#campaigns,#typography,#services,#about,footer').forEach(el=>observer.observe(el));
  currentTracker=name=>{state[name]=true;flush();};
  const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); else {lastTick=performance.now();wasVisible=true;} };
  const timer=setInterval(()=>{if(document.visibilityState==='visible')flush();},15000);
  depth(); flush();
  window.addEventListener('scroll',onScroll,{passive:true});
  document.addEventListener('visibilitychange',onVisibility);
  window.addEventListener('pagehide',flush);
  return () => { stopped=true; currentTracker=null; clearInterval(timer); cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll',onScroll); document.removeEventListener('visibilitychange',onVisibility); window.removeEventListener('pagehide',flush); };
}
