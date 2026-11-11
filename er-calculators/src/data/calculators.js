// All calculator definitions. Each: { id, cat, name, desc, note?, fields[], calc(values) -> {main,text,tone,rows} }
// Corrections relative to the Excel workbook are listed in README.md.
export const categories = ['Hemodynamics','Neurology','Sepsis','Respiratory','Metabolic','Cardiology','Surgery','Trauma','Burns']

const n = x => { const f = parseFloat(x); return Number.isFinite(f) ? f : NaN }
const bad = (...a) => a.some(Number.isNaN)
const R = (main, text, tone = 'ok', rows = []) => ({ main: String(main), text, tone, rows })
const NA = R('—', 'Enter valid values', 'muted')
const num = (k, label, def, unit, min) => ({ k, t: 'num', label, def: String(def), unit, min, neg: min !== undefined && +min < 0 })
const sel = (k, label, opts, def) => ({ k, t: 'sel', label, def, opts: opts.map(o => Array.isArray(o) ? [String(o[0]), o[1]] : [o, o]) })
const chk = (k, label) => ({ k, t: 'chk', label })
const list = (id, cat, name, desc, items, fn, note) => ({
  id, cat, name, desc, note,
  fields: items.map((it, i) => chk('c' + i, it[0])),
  calc: v => fn(items.reduce((a, it, i) => a + (v['c' + i] ? it[1] : 0), 0), v)
})
export const defaults = c => Object.fromEntries(c.fields.map(f =>
  [f.k, f.t === 'chk' ? false : f.def !== undefined ? f.def : f.t === 'sel' ? f.opts[0][0] : '']))

const GCS_E = [[4,'4 – Spontaneous'],[3,'3 – To sound'],[2,'2 – To pain'],[1,'1 – No response']]
const GCS_V = [[5,'5 – Oriented'],[4,'4 – Confused'],[3,'3 – Inappropriate words'],[2,'2 – Incomprehensible sounds'],[1,'1 – No response']]
const GCS_M = [[6,'6 – Obeys commands'],[5,'5 – Localizes pain'],[4,'4 – Withdraws from pain'],[3,'3 – Abnormal flexion (decorticate)'],[2,'2 – Abnormal extension (decerebrate)'],[1,'1 – No response']]
const TIMI_RISK = ['4.7%','4.7%','8.3%','13.2%','19.9%','26.2%','40.9%','40.9%']
const CHA_RISK = ['0%','1.3%','2.2%','3.2%','4.0%','6.7%','9.8%','9.6%','6.7%','15.2%']
const BURN = [['head','Head and neck',9],['chf','Chest – front',9],['chb','Chest / upper back – back',9],['abf','Abdomen – front',9],['abb','Abdomen / lower back – back',9],
  ['rua','Right upper limb',9],['lua','Left upper limb',9],['rll','Right lower limb',18],['lll','Left lower limb',18],['per','Perineum',1]]

export const calculators = [
{ id:'map', cat:'Hemodynamics', name:'Mean Arterial Pressure (MAP)', desc:'MAP = [SBP + 2 × DBP] / 3',
  fields:[num('sbp','Systolic BP',100,'mmHg'), num('dbp','Diastolic BP',60,'mmHg')],
  calc:v=>{const s=n(v.sbp),d=n(v.dbp); if(bad(s,d))return NA; const m=(s+2*d)/3, t=m.toFixed(1)
    return m<65?R(t,'Low – shock range (<65 mmHg)','risk'):m<100?R(t,'Normal (65–100 mmHg)','ok'):R(t,'High (≥100 mmHg)','warn')}},
{ id:'si', cat:'Hemodynamics', name:'Shock Index (SI)', desc:'SI = HR / SBP · normal 0.5–0.7',
  fields:[num('hr','Heart rate',90,'bpm'), num('sbp','Systolic BP',120,'mmHg')],
  calc:v=>{const h=n(v.hr),s=n(v.sbp); if(bad(h,s)||s<=0)return NA; const x=h/s, t=x.toFixed(2)
    return x<0.5?R(t,'Low','warn'):x<=0.7?R(t,'Normal','ok'):x<=0.9?R(t,'Borderline – reassess','warn'):R(t,'Elevated – early circulatory compromise','risk')}},
{ id:'msi', cat:'Hemodynamics', name:'Modified Shock Index (MSI)', desc:'MSI = HR / MAP · normal 0.7–1.3',
  fields:[num('hr','Heart rate',80,'bpm'), num('map','MAP',90,'mmHg')],
  calc:v=>{const h=n(v.hr),m=n(v.map); if(bad(h,m)||m<=0)return NA; const x=h/m, t=x.toFixed(2)
    return x<0.7?R(t,'Low','warn'):x<=1.3?R(t,'Normal','ok'):R(t,'Elevated – shock','risk')}},

{ id:'gcs', cat:'Neurology', name:'Glasgow Coma Scale (GCS)', desc:'Eye + Verbal + Motor response',
  fields:[sel('e','Eye opening',GCS_E), sel('vb','Verbal response',GCS_V), sel('m','Motor response',GCS_M)],
  calc:v=>{const e=+v.e,vb=+v.vb,m=+v.m,s=e+vb+m
    return R(s+' / 15', s>=13?'Mild (13–15)':s>=9?'Moderate (9–12)':'Severe (≤8)', s>=13?'ok':s>=9?'warn':'risk',[['Eye',e],['Verbal',vb],['Motor',m]])}},
{ id:'ottawa', cat:'Neurology', name:'Ottawa SAH Rule', desc:'Age >15 y, new severe non-traumatic headache peaking within 1 hour',
  fields:[chk('a','Age ≥40 years'),chk('b','Neck pain / stiffness'),chk('c','Witnessed loss of consciousness'),chk('d','Onset during exertion'),chk('e','Thunderclap headache'),chk('f','Limited neck flexion on examination')],
  calc:v=>{const p=['a','b','c','d','e','f'].some(k=>v[k]); return p?R('Positive','Further work-up needed','risk'):R('Negative','Low risk','ok')}},

{ id:'sofa', cat:'Sepsis', name:'SOFA Score', desc:'Sequential Organ Failure Assessment',
  note:'Respiratory scores 3–4 require mechanical ventilation. Severity bands (Mild/Moderate/High/Very high) follow your workbook.',
  fields:[num('pf','PaO₂/FiO₂ ratio',450,'mmHg'), chk('vent','On mechanical ventilation'), num('plt','Platelets',250,'×10³/µL'), num('bili','Bilirubin',0.8,'mg/dL'),
    num('map','MAP',80,'mmHg'), sel('pr','Vasopressors',[[0,'None'],[1,'Dopamine ≤5 or dobutamine'],[2,'Dopamine 5–15, or epi/NE ≤0.1'],[3,'Dopamine >15, or epi/NE >0.1']]),
    num('gcs','GCS',15,'','3'), num('cr','Creatinine',0.9,'mg/dL'), sel('uo','Urine output',[[0,'Normal / not assessed'],[3,'<500 mL/day'],[4,'<200 mL/day']])],
  calc:v=>{const pf=n(v.pf),pl=n(v.plt),bi=n(v.bili),mp=n(v.map),g=n(v.gcs),cr=n(v.cr); if(bad(pf,pl,bi,mp,g,cr))return NA
    const re=pf>=400?0:pf>=300?1:pf>=200?2:v.vent?(pf>=100?3:4):2
    const co=pl>=150?0:pl>=100?1:pl>=50?2:pl>=20?3:4
    const li=bi<1.2?0:bi<2?1:bi<6?2:bi<12?3:4
    const p=+v.pr, cv=p>0?p+1:mp<70?1:0
    const cn=g>=15?0:g>=13?1:g>=10?2:g>=6?3:4
    const rn=Math.max(cr<1.2?0:cr<2?1:cr<3.5?2:cr<5?3:4,+v.uo)
    const s=re+co+li+cv+cn+rn
    const lab=s===0?'Normal':s<=4?'Mild':s<=9?'Moderate':s<=14?'High':'Very high'
    return R(s+' / 24',lab,s<=4?'ok':s<=9?'warn':'risk',[['Respiratory',re],['Coagulation',co],['Liver',li],['Cardiovascular',cv],['CNS',cn],['Renal',rn]])}},
{ id:'qsofa', cat:'Sepsis', name:'qSOFA', desc:'Quick SOFA – bedside sepsis screen',
  fields:[num('rr','Respiratory rate',16,'/min'), num('gcs','GCS',15,'','3'), num('sbp','Systolic BP',120,'mmHg')],
  calc:v=>{const r=n(v.rr),g=n(v.gcs),s=n(v.sbp); if(bad(r,g,s))return NA
    const x=(r>=22?1:0)+(g<15?1:0)+(s<=100?1:0)
    return x>=2?R(x+' / 3','High risk of sepsis – urgent evaluation needed','risk'):R(x+' / 3','Low risk – monitor and reassess','ok')}},

list('curb65','Respiratory','CURB-65','Pneumonia severity',[
  ['Confusion – new disorientation (AMT <8 or GCS <15)',1],['Urea >7 mmol/L (BUN >19–20 mg/dL)',1],['Respiratory rate ≥30/min',1],['SBP <90 or DBP ≤60 mmHg',1],['Age ≥65 years',1]],
  s=>s<=1?R(s+' / 5','Low risk – outpatient','ok'):s===2?R(s+' / 5','Moderate risk – consider admission','warn'):R(s+' / 5','High risk – admit, consider ICU','risk'),
  'The 20 mg/dL cut-off in the workbook refers to BUN; urea >7 mmol/L ≈ BUN >19 mg/dL.'),
{ id:'pf', cat:'Respiratory', name:'P/F Ratio', desc:'PaO₂ / FiO₂',
  note:'ARDS categories also need acute onset, bilateral opacities and PEEP ≥5 (Berlin definition).',
  fields:[num('pao2','PaO₂',90,'mmHg'), num('fio2','FiO₂',21,'%')],
  calc:v=>{const p=n(v.pao2),f=n(v.fio2); if(bad(p,f)||f<=0)return NA; const x=p/(f/100), t=x.toFixed(0)
    return x>300?R(t,'Normal / mild hypoxia','ok'):x>200?R(t,'Mild ARDS range','warn'):x>100?R(t,'Moderate ARDS range – consider escalation (HFNC/NIV/intubation)','risk'):R(t,'Severe ARDS range – often ventilated, consider proning/paralysis','risk')}},

{ id:'abg', cat:'Metabolic', name:'ABG Interpretation', desc:'Acid–base, compensation, anion gap and delta ratio',
  fields:[num('ph','pH',7.4,'',0), num('pco2','pCO₂',40,'mmHg'), num('po2','pO₂',90,'mmHg'), num('hco3','HCO₃⁻',24,'mEq/L'), num('na','Na⁺',140,'mEq/L'), num('k','K⁺',4,'mEq/L'),
    num('cl','Cl⁻',102,'mEq/L'), num('be','Base excess',0,'mEq/L','-30'), num('lac','Lactate',1,'mmol/L'), sel('dur','Respiratory disorder duration',['Acute','Chronic'])],
  note:'Normal ranges used: K⁺ 3.5–5.0, Cl⁻ 95–105. Anion gap = Na − Cl − HCO₃ (not albumin-corrected).',
  calc:v=>{const ph=n(v.ph),pc=n(v.pco2),po=n(v.po2),hc=n(v.hco3),na=n(v.na),k=n(v.k),cl=n(v.cl),be=n(v.be),la=n(v.lac)
    if(bad(ph,pc,hc))return NA
    const acute=v.dur==='Acute'
    const prim=ph<7.35?(pc>45?'Respiratory acidosis':hc<22?'Metabolic acidosis':'Mixed / unclear'):ph>7.45?(pc<35?'Respiratory alkalosis':hc>26?'Metabolic alkalosis':'Mixed / unclear'):'Normal pH'
    const rows=[['Primary disorder',prim]]
    const add=(l,x,f)=>{if(!Number.isNaN(x))rows.push([l,f(x)])}
    const rng=(lo,hi,a,b)=>x=>x<lo?a:x>hi?b:'Normal'
    add('pCO₂',pc,rng(35,45,'Low','High')); add('pO₂',po,x=>x<60?'Severe hypoxemia':x<80?'Mild hypoxemia':'Normal')
    add('HCO₃⁻',hc,rng(22,26,'Low','High')); add('Na⁺',na,rng(135,145,'Hyponatremia','Hypernatremia'))
    add('K⁺',k,rng(3.5,5,'Hypokalemia','Hyperkalemia')); add('Cl⁻',cl,rng(95,105,'Hypochloremia','Hyperchloremia'))
    add('Base excess',be,x=>x<-2?'Metabolic acidosis':x>2?'Metabolic alkalosis':'Normal / compensated'); add('Lactate',la,x=>x>2?'High – shock / hypoxia?':'Normal')
    let fin=prim, ag=NaN
    if(!bad(na,cl)){ag=na-cl-hc; rows.push(['Anion gap',ag.toFixed(1)+(ag>12?' (high)':' (normal)')])}
    if(prim==='Metabolic acidosis'){
      const w=1.5*hc+8, lo=w-2, hi=w+2
      rows.push(["Expected pCO₂ (Winter's)",lo.toFixed(1)+' – '+hi.toFixed(1)])
      fin=(!Number.isNaN(ag)?(ag>12?'High anion gap ':'Normal anion gap '):'')+'metabolic acidosis'
      fin+=pc>hi?' + respiratory acidosis':pc<lo?' + respiratory alkalosis':' (appropriately compensated)'
      if(ag>12&&hc!==24){const d=(ag-12)/(24-hc); rows.push(['Delta ratio',d.toFixed(2)])
        fin+=d<0.4?' + predominant NAGMA':d<1?' + NAGMA (mixed)':d>2?' + metabolic alkalosis':''}
    } else if(prim==='Metabolic alkalosis'){
      const w=40+0.7*(hc-24); rows.push(['Expected pCO₂',(w-5).toFixed(1)+' – '+(w+5).toFixed(1)])
      fin+=pc>w+5?' + respiratory acidosis':pc<w-5?' + respiratory alkalosis':' (appropriately compensated)'
    } else if(prim.startsWith('Respiratory')){
      const eh=24+(pc>40?(acute?1:4)*(pc-40)/10:-(acute?2:5)*(40-pc)/10)
      rows.push(['Expected HCO₃⁻ ('+v.dur.toLowerCase()+')',eh.toFixed(1)])
      fin+=hc>eh+2?' + metabolic alkalosis':hc<eh-2?' + metabolic acidosis':' (appropriately compensated)'
    }
    return R(prim,fin,prim==='Normal pH'?'ok':(ph<7.2||ph>7.6)?'risk':'warn',rows)}},

{ id:'heart', cat:'Cardiology', name:'HEART Score', desc:'Chest pain – major adverse cardiac event risk',
  fields:[sel('h','History',[[0,'Slightly suspicious'],[1,'Moderately suspicious'],[2,'Highly suspicious']]), sel('e','ECG',[[0,'Normal'],[1,'Non-specific ST-T changes'],[2,'Significant ST-T changes']]),
    sel('a','Age',[[0,'<45 years'],[1,'45–65 years'],[2,'>65 years']]), sel('r','Risk factors',[[0,'No risk factors'],[1,'1 or 2 risk factors'],[2,'≥3 risk factors / known atherosclerotic disease']]),
    sel('t','Troponin',[[0,'Normal'],[1,'1–3 × normal'],[2,'>3 × normal']])],
  calc:v=>{const s=+v.h+ +v.e+ +v.a+ +v.r+ +v.t; return s<=3?R(s+' / 10','Low risk','ok'):s<=6?R(s+' / 10','Moderate risk','warn'):R(s+' / 10','High risk','risk')}},
list('timi','Cardiology','TIMI Risk – UA/NSTEMI','14-day death / MI / urgent revascularisation',[
  ['Age ≥65',1],['≥3 CAD risk factors / current smoker',1],['Known CAD (>50% stenosis)',1],['Aspirin use in last 7 days',1],['Severe angina (≥2 episodes in 24 h)',1],['ECG ST changes ≥0.5 mm',1],['Positive cardiac biomarker',1]],
  s=>R(s+' / 7','14-day event risk ≈ '+TIMI_RISK[s],s<=1?'ok':s<=3?'warn':'risk')),
{ id:'edacs', cat:'Cardiology', name:'EDACS (+ ADP)', desc:'Emergency Department Assessment of Chest pain Score',
  note:'EDACS is validated for age ≥18. The “known CAD / ≥3 risk factors” item scores only for age 18–50. Palpation scores −6 and inspiration −4 (these were swapped in the workbook).',
  fields:[num('age','Age',50,'years','18'), sel('sex','Sex',['Male','Female']), chk('cad','Known CAD or ≥3 risk factors'), chk('dia','Diaphoresis'), chk('rad','Pain radiates to arm, shoulder, neck or jaw'),
    chk('insp','Pain occurred or worsened with inspiration'), chk('palp','Pain reproduced by palpation'), sel('ecg','ECG',['No new ischemia','New ischemia']),
    sel('t0','0-hour troponin',['Negative','Positive']), sel('t2','2-hour troponin',['Negative','Positive'])],
  calc:v=>{const a=n(v.age); if(Number.isNaN(a)||a<18)return R('—','EDACS is validated for age ≥18','muted')
    const as=a<=45?2:a<=50?4:a<=55?6:a<=60?8:a<=65?10:a<=70?12:a<=75?14:a<=80?16:a<=85?18:20
    const s=as+(v.sex==='Male'?6:0)+(v.cad&&a<=50?4:0)+(v.dia?3:0)+(v.rad?5:0)+(v.insp?-4:0)+(v.palp?-6:0)
    const low=s<16&&v.ecg==='No new ischemia'&&v.t0==='Negative'&&v.t2==='Negative'
    return low?R(s,'Low risk – safe for discharge / early outpatient follow-up','ok'):R(s,'Not low risk – usual care and further observation','risk')}},
{ id:'cha2ds2', cat:'Cardiology', name:'CHA₂DS₂-VASc', desc:'Stroke risk in atrial fibrillation',
  note:'Anticoagulation rule follows your workbook (male ≥2, female ≥3). A score of 1 (male) or 2 (female) is borderline – individualise.',
  fields:[chk('chf','Congestive heart failure or LVEF <35%'), chk('htn','Hypertension'), sel('age','Age',[[0,'<65 years'],[1,'65–74 years'],[2,'≥75 years']]), chk('dm','Diabetes mellitus'),
    chk('stk','Prior stroke / TIA / systemic embolism'), chk('vasc','Vascular disease (MI / PAD / aortic plaque)'), sel('sex','Sex',['Male','Female'])],
  calc:v=>{const s=(v.chf?1:0)+(v.htn?1:0)+ +v.age+(v.dm?1:0)+(v.stk?2:0)+(v.vasc?1:0)+(v.sex==='Female'?1:0)
    const tx=v.sex==='Male'?s>=2:s>=3
    return tx?R(s+' / 9','Start anticoagulation · stroke risk ≈ '+CHA_RISK[s]+'/yr','risk'):R(s+' / 9','No anticoagulation · stroke risk ≈ '+CHA_RISK[s]+'/yr','ok')}},
list('perc','Cardiology','PERC Rule','Rule out PE when pre-test probability is low',[
  ['Age ≥50',1],['Heart rate ≥100',1],['SaO₂ <95% on room air',1],['Unilateral leg swelling',1],['Hemoptysis',1],['Surgery / trauma within 4 weeks',1],['Prior DVT / PE',1],['Hormone (estrogen) use',1]],
  s=>s===0?R('PERC negative','PE ruled out (if low pre-test probability)','ok'):R('PERC positive ('+s+')','Further work-up required','risk')),

list('alvarado','Surgery','Alvarado Score','Acute appendicitis likelihood',[
  ['Migratory right iliac fossa pain',1],['Anorexia',1],['Nausea / vomiting',1],['RIF tenderness',2],['Rebound tenderness',1],['Elevated temperature',1],['Leukocytosis (WBC >10,000/cmm)',2],['Left shift of neutrophils',1]],
  s=>s<=4?R(s+' / 10','Unlikely appendicitis (low risk)','ok'):s<=6?R(s+' / 10','Possible appendicitis (moderate risk)','warn'):s<=8?R(s+' / 10','Probable appendicitis (high risk)','risk'):R(s+' / 10','Very probable appendicitis','risk'),
  'The workbook’s interpretation read the last single item instead of the total; this version uses the total.'),

{ id:'rts', cat:'Trauma', name:'Revised Trauma Score (RTS)', desc:'Weighted RTS from GCS, SBP and RR',
  fields:[num('gcs','GCS',15,'','3'), num('sbp','Systolic BP',120,'mmHg'), num('rr','Respiratory rate',16,'/min')],
  calc:v=>{const g=n(v.gcs),s=n(v.sbp),r=n(v.rr); if(bad(g,s,r))return NA
    const G=g>=13?4:g>=9?3:g>=6?2:g>=4?1:0, S=s>89?4:s>=76?3:s>=50?2:s>=1?1:0, Rr=r>=10?(r<=29?4:3):r>=6?2:r>=1?1:0
    const w=0.9368*G+0.7326*S+0.2908*Rr, t=w.toFixed(4), rows=[['Coded GCS / SBP / RR',G+' / '+S+' / '+Rr]]
    return w>=4?R(t,'RTS ≥4: better survival probability','ok',rows):R(t,'RTS <4: poor prognosis, high mortality risk','risk',rows)}},

{ id:'burns', cat:'Burns', name:'Burn Area – Rule of Nines', desc:'Adult TBSA estimate – tick the burned body parts',
  note:'Tick only the regions that are burned (partial- or full-thickness, not simple erythema). Each ticked region adds its Rule-of-Nines %. Adult chart – use Lund-Browder for children. Severity cut-offs follow your workbook.',
  fields:BURN.map(([k,l,w])=>chk(k,l+' (+'+w+'%)')),
  calc:v=>{const t=BURN.reduce((a,[k,,w])=>a+(v[k]?w:0),0), tt=t+'% TBSA'
    return t===0?R(tt,'No region ticked','muted'):t<10?R(tt,'Mild · Ward / outpatient','ok'):t<=20?R(tt,'Moderate · Admit & monitor','warn'):R(tt,'Severe · ICU / burn centre referral','risk')}}
]
