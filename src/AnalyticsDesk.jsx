import {useEffect,useState} from 'react';
import './analytics.css';
const labels={work:'بداية الموقع والعلامات',logos:'شبكة الشعارات',campaigns:'الحملات',services:'الخدمات',about:'النبذة',footer:'نهاية الصفحة',mobile:'جوال',tablet:'جهاز لوحي',desktop:'كمبيوتر',direct:'مباشر أو مصدر غير متاح',unknown:'غير معروف',Other:'أخرى'};
const n=value=>Number(value||0).toLocaleString('ar-SA');
const countryName=code=>{try{return code==='unknown'?'غير معروف':new Intl.DisplayNames(['ar'],{type:'region'}).of(code);}catch{return code;}};
function Breakdown({title,items=[],countries=false}) {return <section className="panel analytics-breakdown"><h2>{title}</h2>{items.length?<dl>{items.map(item=><div key={item.name}><dt>{countries?countryName(item.name):labels[item.name]||item.name}</dt><dd>{n(item.count)}</dd></div>)}</dl>:<p>لا توجد بيانات بعد.</p>}</section>;}
export default function AnalyticsDesk({access}) {
  const [days,setDays]=useState(7),[data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[reload,setReload]=useState(0);
  useEffect(()=>{
    if(!access)return; let active=true;const controller=new AbortController();setLoading(true);setError('');
    fetch(`/api/analytics?days=${days}`,{headers:{Authorization:`Bearer ${access.session.access_token}`},signal:controller.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'تعذر تحميل الإحصاءات');if(active)setData(d);}).catch(e=>{if(active&&e.name!=='AbortError')setError(e.message);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;controller.abort();};
  },[access?.session.access_token,days,reload]);
  if(!access)return <section className="panel"><h1>زيارات الموقع</h1><p>سجّل الدخول بحساب المالك لقراءة الإحصاءات.</p></section>;
  return <div className="dashboard-content page-stack analytics-desk"><header className="page-title"><div><h1>زيارات الموقع</h1><p>من أين وصلوا، ماذا شاهدوا، وأين كانت آخر مشاهدة مرصودة.</p></div><div className="live-actions"><label>الفترة<select value={days} onChange={e=>setDays(Number(e.target.value))}><option value={1}>اليوم</option><option value={7}>7 أيام</option><option value={30}>30 يوماً</option><option value={90}>90 يوماً</option></select></label><button className="button ghost" disabled={loading} onClick={()=>setReload(v=>v+1)}>تحديث</button></div></header>
    <p className="analytics-note">القياس يبدأ بعد موافقة الزائر، ويستثني لوحة التحكم. كل تحميل للصفحة يُعد زيارة وليس شخصاً فريداً. لا تُجمع الأسماء أو محتويات النماذج. الفترة حسب توقيت الرياض، والاحتفاظ 90 يوماً.</p>
    {loading&&<p role="status">جارٍ تحميل الإحصاءات...</p>}{error&&<p role="alert">{error}</p>}
    {data&&!error&&<><div className="analytics-metrics">{[['الزيارات المسجلة',n(data.visits)],['نشط خلال دقيقتين',n(data.active)],['متوسط الوقت المرصود',`${n(data.avgSeconds)} ثانية`],['متوسط عمق التصفح',`${n(data.avgDepth)}٪`]].map(([title,value])=><section className="panel" key={title}><p>{title}</p><strong>{value}</strong></section>)}</div>
      {!data.visits&&<section className="panel"><h2>بانتظار أول زيارة موافقة</h2><p>لا توجد أرقام تاريخية قبل تشغيل القياس. استخدامك وأنت مسجل الدخول لا يدخل في هذه الإحصاءات.</p></section>}
      <section className="panel"><h2>الزيارات حسب اليوم</h2><div className="analytics-days">{data.daily.map(d=><div key={d.day}><span>{d.day}</span><div style={{width:`${Math.max(2,d.count/Math.max(...data.daily.map(v=>v.count),1)*100)}%`}} aria-hidden="true"/><strong>{n(d.count)}</strong></div>)}</div></section>
      <section className="panel"><h2>من الاهتمام إلى التواصل</h2><div className="analytics-metrics">{[['فتح التواصل',data.contactOpen],['فتح نموذج المشروع',data.serviceOpen],['أرسل رسالة',data.contactSent],['أرسل طلب مشروع',data.projectSent]].map(([label,value])=><div key={label}><p>{label}</p><strong>{n(value)}</strong></div>)}</div><p>كل خطوة تحسب الزيارات التي فعلتها مرة واحدة. إرسال الرسالة وطلب المشروع مساران مختلفان، وليسا بالضرورة تسلسلاً واحداً.</p></section>
      <div className="analytics-grid"><Breakdown title="مصادر الدخول" items={data.sources}/><Breakdown title="الأجهزة" items={data.devices}/><Breakdown title="المتصفحات" items={data.browsers}/><Breakdown title="الدول التقريبية" items={data.countries} countries/><Breakdown title="الأقسام التي وصلوا إليها" items={data.reach}/><Breakdown title="آخر قسم قبل انقطاع الرصد" items={data.stops}/></div>
      <p className="analytics-note">توقف الرصد لأكثر من دقيقتين تقدير للخروج، وليس إثباتاً له أو لسببه. المتصفحات وحاجبات التتبع ورفض الموافقة قد تقلل الأعداد. تحديد الدولة تقريبي، ولا يكشف موقع الزائر الدقيق.</p>
      <section className="panel"><h2>آخر 30 زيارة مجهولة</h2><div className="analytics-table"><table><thead><tr>{['الوقت','المصدر','الدولة','الجهاز','آخر قسم','العمق','الوقت المرصود'].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>{data.recent.map((v,i)=><tr key={i}><td>{new Date(v.created_at).toLocaleString('ar-SA',{timeZone:'Asia/Riyadh'})}</td><td>{labels[v.source]||v.source}</td><td>{countryName(v.country)}</td><td>{labels[v.device]} / {v.browser}</td><td>{labels[v.last_section]}</td><td>{n(v.depth)}٪</td><td>{n(v.seconds)} ث</td></tr>)}</tbody></table></div></section>
    </>}
  </div>;
}
