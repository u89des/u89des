import {useEffect,useState} from 'react';
import {startVisitTracking} from './lib/visit-tracker';
import './analytics.css';

export default function VisitConsent({enabled}) {
  const [choice,setChoice]=useState(()=>{try{return localStorage.getItem('u89-analytics-consent') || '';}catch{return '';}});
  const protectedBrowser=navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true;
  useEffect(()=>{if(enabled && choice==='yes' && !protectedBrowser)return startVisitTracking();},[enabled,choice,protectedBrowser]);
  if(!enabled || choice || protectedBrowser) return null;
  const save=value=>{try{localStorage.setItem('u89-analytics-consent',value);}catch{} setChoice(value);};
  return <div className="visit-privacy"><section className="visit-consent" aria-label="تفضيلات الخصوصية">
    <strong>خصوصيتك تهمنا</strong>
    <p>نستخدم تقنيات تحليل الزيارات لفهم استخدام الموقع وتحسين تجربتك. يمكنك قبولها أو المتابعة دونها.</p>
    <div><button className="button ghost small" onClick={()=>save('no')}>رفض</button><button className="button primary small" disabled={protectedBrowser} onClick={()=>save('yes')}>قبول</button></div>
  </section></div>;
}
