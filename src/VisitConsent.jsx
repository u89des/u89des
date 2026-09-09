import {useEffect,useState} from 'react';
import {startVisitTracking} from './lib/visit-tracker';
import './analytics.css';

export default function VisitConsent({enabled}) {
  const [choice,setChoice]=useState(()=>{try{return localStorage.getItem('u89-analytics-consent') || '';}catch{return '';}});
  const [editing,setEditing]=useState(false);
  const protectedBrowser=navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true;
  useEffect(()=>{if(enabled && choice==='yes' && !protectedBrowser)return startVisitTracking();},[enabled,choice,protectedBrowser]);
  if(!enabled) return null;
  const save=value=>{try{localStorage.setItem('u89-analytics-consent',value);}catch{} setChoice(value);setEditing(false);};
  return <div className="visit-privacy">{(!choice&&!protectedBrowser)||editing ? <section className="visit-consent" aria-label="تفضيلات الخصوصية">
    <strong>خصوصيتك تهمنا</strong>
    <p>نستخدم تقنيات تحليل الزيارات لفهم استخدام الموقع وتحسين تجربتك. يمكنك قبولها أو المتابعة دونها.</p>
    <details><summary>تفاصيل الخصوصية</summary><p>بعد موافقتك، نقيس الأقسام التي تشاهدها ونوع الجهاز ومصدر الدخول والدولة التقريبية. دون اسم أو عنوان IP محفوظ، ودون تسجيل الشاشة أو محتوى رسالتك. نحتفظ بالإحصاءات 90 يوماً، ويمكنك تغيير اختيارك في أي وقت من «إعدادات الخصوصية».</p></details>
    {protectedBrowser&&<p>إعداد عدم التتبع في متصفحك مفعّل؛ لن نجمع بيانات زيارتك.</p>}
    <div><button className="button ghost small" onClick={()=>save('no')}>رفض</button><button className="button primary small" disabled={protectedBrowser} onClick={()=>save('yes')}>قبول</button></div>
  </section>:<button className="visit-privacy-link" onClick={()=>setEditing(true)}>إعدادات الخصوصية</button>}</div>;
}
