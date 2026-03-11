import { useState, useEffect, useCallback } from 'react'
import { db } from './firebase'
import { ref, onValue, set } from 'firebase/database'

const T='#2a5caa',TL='#e8eef8',D='#b84c1e',DL='#faeee8',G='#2d7a45',GOLD='#c8960c',RED='#c0392b'
const CAT_COL={'Platform Fee':'#b84c1e','Staff / Freelancer':'#2d7a45','Tools & Software':'#c8960c','Domain / Hosting':'#2a5caa','Subscription':'#7a4fcf','Other':'#888'}
const WORK_TYPES=['Website Development','3D Modelling','Rendering','Product Visualization','Motion Graphics','UI/UX Design','Other']
const STATUS_COL={Active:G,'Pending Payment':GOLD,Completed:T,Cancelled:RED}

const fmt  = n => '₹'+Math.abs(Math.round(n)).toLocaleString('en-IN')
const ts   = () => new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})
const today= () => new Date().toISOString().split('T')[0]

function calcFinance(expenses=[], income={tusharReceived:0,dheerajReceived:0}) {
  const tP=expenses.filter(e=>e.paidBy==='Tushar').reduce((s,e)=>s+e.amount,0)
  const dP=expenses.filter(e=>e.paidBy==='Dheeraj').reduce((s,e)=>s+e.amount,0)
  const tot=tP+dP, sh=tot/2
  const tR=income.tusharReceived||0, dR=income.dheerajReceived||0
  const totR=tR+dR, profit=totR-tot, ps=profit/2
  const np=(tP-sh)-(tR-totR/2)
  return {tP,dP,tot,sh,tR,dR,totR,profit,ps,
    s:{amt:Math.abs(np),from:np>0?'Dheeraj':'Tushar',to:np>0?'Tushar':'Dheeraj'}}
}

const btnD ={background:'#1a1a18',color:'#f5f2eb',border:'none',padding:'0.6rem 1.4rem',fontFamily:"'DM Mono',monospace",fontSize:'0.63rem',letterSpacing:'0.18em',cursor:'pointer'}
const btnG ={background:'transparent',border:'1px solid #d8d5cc',color:'#7a7870',padding:'0.6rem 1rem',fontFamily:"'DM Mono',monospace",fontSize:'0.63rem',cursor:'pointer'}
const btnGr={background:G,color:'#fff',border:'none',padding:'0.6rem 1.4rem',fontFamily:"'DM Mono',monospace",fontSize:'0.63rem',letterSpacing:'0.18em',cursor:'pointer'}
const fi   ={background:'#eceae0',border:'1px solid #d8d5cc',padding:'0.55rem 0.8rem',fontFamily:"'DM Mono',monospace",fontSize:'0.73rem',color:'#1a1a18',width:'100%'}
const fl   ={fontSize:'0.58rem',letterSpacing:'0.2em',color:'#7a7870',marginBottom:4,display:'block'}

// ── Shared section label ──────────────────────────────────────
const SL=({children})=>(
  <div style={{padding:'0 1.5rem',margin:'1.2rem 0 0.6rem',fontSize:'0.58rem',letterSpacing:'0.3em',color:'#7a7870',textTransform:'uppercase',display:'flex',alignItems:'center',gap:'0.8rem'}}>
    {children}<span style={{flex:1,height:1,background:'#d8d5cc'}}/>
  </div>
)

// ── Shared modal wrapper ──────────────────────────────────────
const Overlay=({onClose,children,wide})=>(
  <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}
    onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div style={{background:'#f5f2eb',padding:'2rem',width:wide?'min(640px,94vw)':'min(520px,92vw)',maxHeight:'92vh',overflowY:'auto',position:'relative',boxShadow:'0 8px 40px rgba(0,0,0,0.2)',animation:'fadeUp 0.2s ease'}}>
      <button onClick={onClose} style={{position:'absolute',top:'1.2rem',right:'1.4rem',background:'none',border:'none',fontSize:'1.3rem',color:'#7a7870',cursor:'pointer',lineHeight:1}}>×</button>
      {children}
    </div>
  </div>
)

const APP_PASSWORD = 'Helixfr@mes2026'

// ══════════════════════════════════════════════════════════════
export default function App() {
  const [authed,setAuthed]   = useState(()=>localStorage.getItem('hf-authed')==='1')
  const [pwInput,setPwInput] = useState('')
  const [pwError,setPwError] = useState(false)
  const [user,setUser]       = useState(()=>localStorage.getItem('hf-user')||null)
  const [data,setData]       = useState(null)
  const [page,setPage]       = useState('finance')
  const [saving,setSaving]   = useState(false)
  const [online,setOnline]   = useState(true)
  const [lastSync,setLastSync] = useState(null)
  const [toast,setToast]     = useState(null)

  const showToast=(msg,ok=true)=>{setToast({msg,ok});setTimeout(()=>setToast(null),3500)}

  useEffect(()=>{
    const dbRef=ref(db,'helixframe')
    const unsub=onValue(dbRef,snap=>{
      const val=snap.val()
      if(val){ setData({months:val.months||{'Feb 2026':{expenses:[],income:{tusharReceived:0,dheerajReceived:0}}},clients:val.clients||[]}) }
      else { const s={months:{'Feb 2026':{expenses:[],income:{tusharReceived:0,dheerajReceived:0}}},clients:[]}; set(dbRef,s); setData(s) }
      setLastSync(ts()); setOnline(true)
    },()=>setOnline(false))
    return ()=>unsub()
  },[])

  const write=useCallback(async(nd)=>{
    setSaving(true)
    try{ await set(ref(db,'helixframe'),nd); showToast('Saved & synced ✓') }
    catch{ showToast('Save failed',false) }
    setSaving(false)
  },[])

  const submitPassword=()=>{
    if(pwInput===APP_PASSWORD){ localStorage.setItem('hf-authed','1'); setAuthed(true); setPwError(false) }
    else{ setPwError(true); setPwInput('') }
  }

  if(!authed) return(
    <div style={{background:'#0f1510',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'1.5rem',fontFamily:"'DM Mono',monospace"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:'2.2rem',fontWeight:300,color:'#7fff72',letterSpacing:'0.05em'}}>Helix Frame</div>
      <div style={{color:'#6b7a62',fontSize:'0.62rem',letterSpacing:'0.35em'}}>ENTER PASSWORD TO CONTINUE</div>
      <div style={{display:'flex',flexDirection:'column',gap:'0.75rem',alignItems:'center',width:260}}>
        <input type="password" value={pwInput} onChange={e=>{setPwInput(e.target.value);setPwError(false)}}
          onKeyDown={e=>e.key==='Enter'&&submitPassword()} placeholder="Password" autoFocus
          style={{background:'#1a2a1a',border:`1px solid ${pwError?RED:'#2a4a2a'}`,padding:'0.75rem 1rem',fontFamily:"'DM Mono',monospace",fontSize:'0.85rem',color:'#f5f2eb',width:'100%',outline:'none',letterSpacing:'0.1em',textAlign:'center'}}/>
        {pwError&&<div style={{color:RED,fontSize:'0.62rem',letterSpacing:'0.2em'}}>INCORRECT PASSWORD</div>}
        <button onClick={submitPassword}
          style={{background:'transparent',border:'2px solid #7fff72',color:'#7fff72',padding:'0.75rem 2rem',fontFamily:"'DM Mono',monospace",fontSize:'0.75rem',letterSpacing:'0.25em',cursor:'pointer',width:'100%'}}>
          ENTER
        </button>
      </div>
    </div>
  )

  if(!user) return(
    <div style={{background:'#0f1510',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'2rem',fontFamily:"'DM Mono',monospace"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:'2.2rem',fontWeight:300,color:'#7fff72',letterSpacing:'0.05em'}}>Helix Frame</div>
      <div style={{color:'#6b7a62',fontSize:'0.62rem',letterSpacing:'0.35em'}}>WHO ARE YOU?</div>
      <div style={{display:'flex',gap:'1rem'}}>
        {['Tushar','Dheeraj'].map(p=>(
          <button key={p} onClick={()=>{localStorage.setItem('hf-user',p);setUser(p)}}
            style={{background:'transparent',border:`2px solid ${p==='Tushar'?T:D}`,color:p==='Tushar'?T:D,padding:'0.9rem 2.5rem',fontFamily:"'DM Mono',monospace",fontSize:'0.85rem',letterSpacing:'0.2em',cursor:'pointer'}}>
            {p}
          </button>
        ))}
      </div>
    </div>
  )

  if(!data) return(
    <div style={{background:'#f5f2eb',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Mono',monospace",color:'#7a7870',fontSize:'0.75rem',letterSpacing:'0.25em'}}>
      CONNECTING TO FIREBASE…
    </div>
  )

  return(
    <div style={{background:'#f5f2eb',minHeight:'100vh',fontFamily:"'DM Mono',monospace",fontSize:13}}>
      {toast&&<div style={{position:'fixed',top:'1rem',right:'1rem',zIndex:999,background:toast.ok?G:RED,color:'#fff',padding:'0.7rem 1.2rem',fontFamily:"'DM Mono',monospace",fontSize:'0.68rem',letterSpacing:'0.15em',boxShadow:'0 4px 20px rgba(0,0,0,0.25)',animation:'fadeUp 0.2s ease'}}>{toast.msg}</div>}

      {/* HEADER */}
      <div style={{background:'#1a1a18',color:'#f5f2eb',padding:'1.3rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.5rem',fontWeight:400}}>
            Helix Frame <span style={{color:user==='Tushar'?T:D,fontSize:'1rem'}}>· {user}</span>
          </div>
          <div style={{fontSize:'0.6rem',opacity:0.45,letterSpacing:'0.22em',marginTop:3}}>INTERNAL DASHBOARD · 50/50 PARTNERSHIP</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
          <div style={{fontSize:'0.6rem',display:'flex',alignItems:'center',gap:6,color:online?'#7fff72':'#e74c3c',letterSpacing:'0.15em'}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:online?'#7fff72':'#e74c3c',animation:saving?'pulse 0.8s infinite':'pulse 3s infinite'}}/>
            {saving?'SAVING…':online?`LIVE · ${lastSync||''}`:'OFFLINE'}
          </div>
          <button style={{background:'transparent',border:'1px solid #333',color:'#aaa',padding:'3px 10px',fontFamily:"'DM Mono',monospace",fontSize:'0.55rem',cursor:'pointer'}}
            onClick={()=>{localStorage.removeItem('hf-user');localStorage.removeItem('hf-authed');setUser(null);setAuthed(false)}}>Lock & Exit</button>
        </div>
      </div>

      {/* NAV */}
      <div style={{display:'flex',background:'#1a1a18',borderTop:'1px solid #2a2a28',padding:'0 2rem'}}>
        {[['finance','📊 Finance'],['clients','🤝 Clients']].map(([k,lbl])=>(
          <button key={k} onClick={()=>setPage(k)} style={{background:'transparent',border:'none',color:page===k?'#7fff72':'#555',padding:'0.75rem 1.2rem',fontFamily:"'DM Mono',monospace",fontSize:'0.63rem',letterSpacing:'0.18em',cursor:'pointer',borderBottom:page===k?'2px solid #7fff72':'2px solid transparent',transition:'color 0.2s'}}>
            {lbl}
          </button>
        ))}
      </div>

      {page==='finance'
        ? <FinancePage data={data} setData={setData} write={write} user={user} showToast={showToast}/>
        : <ClientsPage data={data} setData={setData} write={write} user={user} showToast={showToast}/>}

      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}*{box-sizing:border-box;}`}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  FINANCE PAGE
// ══════════════════════════════════════════════════════════════
function FinancePage({data,setData,write,user,showToast}){
  const months=data.months||{}
  const [active,setActive]=useState(()=>Object.keys(months)[0]||'Feb 2026')
  const [expModal,setExpModal]=useState(false)
  const [editId,setEditId]=useState(null)
  const [form,setForm]=useState({name:'',amount:'',paidBy:'Tushar',category:'Platform Fee',type:'monthly'})
  const [delModal,setDelModal]=useState(false)
  const [delId,setDelId]=useState(null),[delDesc,setDelDesc]=useState('')

  useEffect(()=>{ if(!months[active]) setActive(Object.keys(months)[0]) },[months])

  const md=months[active]||{expenses:[],income:{tusharReceived:0,dheerajReceived:0}}
  const c=calcFinance(md.expenses,md.income)
  const tE=md.expenses.filter(e=>e.paidBy==='Tushar')
  const dE=md.expenses.filter(e=>e.paidBy==='Dheeraj')

  const saveExp=async()=>{
    if(!form.name.trim()||!form.amount||isNaN(+form.amount)||+form.amount<=0){showToast('Fill in all fields',false);return}
    const obj={name:form.name.trim(),amount:+form.amount,paidBy:form.paidBy,category:form.category,type:form.type,addedBy:user}
    const arr=[...md.expenses]
    if(editId!==null){const i=arr.findIndex(x=>x.id===editId);if(i>-1)arr[i]={...arr[i],...obj}}
    else arr.push({id:Date.now(),...obj})
    const nd={...data,months:{...months,[active]:{...md,expenses:arr}}}
    setData(nd); setExpModal(false); await write(nd)
  }

  const openEdit=id=>{const e=md.expenses.find(x=>x.id===id);if(!e)return;setEditId(id);setForm({name:e.name,amount:e.amount,paidBy:e.paidBy,category:e.category,type:e.type});setExpModal(true)}
  const openDel=id=>{const e=md.expenses.find(x=>x.id===id);if(!e)return;setDelId(id);setDelDesc(`"${e.name}" — ${fmt(e.amount)} (${e.paidBy})`);setDelModal(true)}
  const confirmDel=async()=>{
    const nd={...data,months:{...months,[active]:{...md,expenses:md.expenses.filter(x=>x.id!==delId)}}}
    setData(nd);setDelModal(false);await write(nd)
  }
  const setIncome=async(who,val)=>{
    const v=parseFloat(val);if(isNaN(v)||v<0){showToast('Enter a valid amount',false);return}
    const key=who==='Tushar'?'tusharReceived':'dheerajReceived'
    const nd={...data,months:{...months,[active]:{...md,income:{...md.income,[key]:v}}}}
    setData(nd);await write(nd)
  }
  const addMonth=async()=>{
    const n=prompt('New month name (e.g. Mar 2026):');if(!n?.trim())return
    const nm=n.trim();if(months[nm]){showToast('Already exists',false);return}
    const nd={...data,months:{...months,[nm]:{expenses:[],income:{tusharReceived:0,dheerajReceived:0}}}}
    setData(nd);setActive(nm);await write(nd)
  }
  const delMonth=async()=>{
    if(Object.keys(months).length<=1){showToast("Can't delete last month",false);return}
    if(!confirm(`Delete "${active}"?`))return
    const nm={...months};delete nm[active]
    const nd={...data,months:nm};setData(nd);setActive(Object.keys(nm)[0]);await write(nd)
  }
  const exportCSV=()=>{
    let csv='Type,Description,Amount,Paid By,Category,Recurrence\n'
    md.expenses.forEach(e=>{csv+=`Expense,"${e.name}",${e.amount},${e.paidBy},"${e.category}",${e.type}\n`})
    csv+=`Income,Tushar,${c.tR},Tushar,Income,-\nIncome,Dheeraj,${c.dR},Dheeraj,Income,-\n`
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`HF-${active.replace(' ','-')}.csv`;a.click()
  }

  const sf=c.s.from,st=c.s.to
  const pbr=(l,v,col)=>(<div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',padding:'0.35rem 0',borderBottom:'1px solid #d8d5cc'}}><span style={{color:'#7a7870'}}>{l}</span><span style={{color:col||'#1a1a18',fontWeight:col?500:400}}>{v}</span></div>)
  const ExpRow=({e,who})=>{
    const col=CAT_COL[e.category]||'#888'
    return(<div style={{display:'flex',alignItems:'center',padding:'0.65rem 1.4rem',borderBottom:'1px solid #d8d5cc',gap:'0.8rem'}} onMouseEnter={ev=>ev.currentTarget.style.background='#eceae0'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:'0.72rem',color:'#1a1a18',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.name}</div>
        <div style={{fontSize:'0.55rem',color:'#7a7870',marginTop:2,display:'flex',gap:6,flexWrap:'wrap'}}>
          <span style={{background:col+'20',color:col,padding:'1px 5px',borderRadius:2}}>{e.category}</span>
          <span>{e.type}</span>{e.addedBy&&<span style={{color:'#bbb'}}>· {e.addedBy}</span>}
        </div>
      </div>
      <div style={{fontSize:'0.8rem',fontWeight:500,color:who==='T'?T:D,whiteSpace:'nowrap'}}>{fmt(e.amount)}</div>
      <div style={{display:'flex',gap:4}}>
        {[['Edit',()=>openEdit(e.id),T],['Del',()=>openDel(e.id),RED]].map(([l,fn,hc])=>(
          <button key={l} onClick={fn} style={{background:'transparent',border:'1px solid #d8d5cc',color:'#7a7870',padding:'3px 9px',fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',cursor:'pointer'}}
            onMouseEnter={ev=>{ev.target.style.borderColor=hc;ev.target.style.color=hc}}
            onMouseLeave={ev=>{ev.target.style.borderColor='#d8d5cc';ev.target.style.color='#7a7870'}}>{l}</button>
        ))}
      </div>
    </div>)
  }

  return(<>
    {expModal&&<Overlay onClose={()=>setExpModal(false)}>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.2rem',fontWeight:400,marginBottom:'1.4rem'}}>{editId?'Edit':'Add'} Expense</h2>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.9rem'}}>
        <div style={{gridColumn:'1/-1'}}><label style={fl}>DESCRIPTION</label><input style={fi} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Figma" autoFocus/></div>
        <div><label style={fl}>AMOUNT (₹)</label><input style={fi} type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0"/></div>
        <div><label style={fl}>PAID BY</label><select style={fi} value={form.paidBy} onChange={e=>setForm(f=>({...f,paidBy:e.target.value}))}><option>Tushar</option><option>Dheeraj</option></select></div>
        <div><label style={fl}>CATEGORY</label><select style={fi} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{Object.keys(CAT_COL).map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label style={fl}>TYPE</label><select style={fi} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="one-off">One-off</option></select></div>
      </div>
      <div style={{display:'flex',gap:'0.75rem',marginTop:'1.4rem'}}><button style={btnD} onClick={saveExp}>SAVE</button><button style={btnG} onClick={()=>setExpModal(false)}>Cancel</button></div>
    </Overlay>}

    {delModal&&<Overlay onClose={()=>setDelModal(false)}>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.1rem',fontWeight:400,marginBottom:'0.5rem'}}>Delete entry?</h2>
      <p style={{fontSize:'0.68rem',color:'#7a7870',marginBottom:'1.4rem',lineHeight:1.7}}>{delDesc}</p>
      <div style={{display:'flex',gap:'0.75rem'}}><button style={{...btnD,background:RED}} onClick={confirmDel}>DELETE</button><button style={btnG} onClick={()=>setDelModal(false)}>Cancel</button></div>
    </Overlay>}

    {/* TABS */}
    <div style={{display:'flex',gap:6,flexWrap:'wrap',padding:'1rem 2rem',background:'#eceae0',borderBottom:'1px solid #d8d5cc'}}>
      {Object.keys(months).map(m=><button key={m} onClick={()=>setActive(m)} style={{background:m===active?'#1a1a18':'transparent',color:m===active?'#f5f2eb':'#7a7870',border:'1px solid',borderColor:m===active?'#1a1a18':'#d8d5cc',padding:'0.35rem 0.9rem',fontFamily:"'DM Mono',monospace",fontSize:'0.62rem',cursor:'pointer'}}>{m}</button>)}
      <button style={{background:'transparent',border:'1px solid #d8d5cc',color:'#7a7870',padding:'0.35rem 0.9rem',fontFamily:"'DM Mono',monospace",fontSize:'0.62rem',cursor:'pointer'}} onClick={addMonth}>+ NEW MONTH</button>
    </div>

    {/* SUMMARY */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:1,background:'#d8d5cc',margin:'1.5rem',border:'1px solid #d8d5cc'}}>
      {[{l:'Total Expenses',v:fmt(c.tot),col:null,s:'Combined'},{l:'Tushar Paid',v:fmt(c.tP),col:T,s:`Share ${fmt(c.sh)} · ${c.tP>=c.sh?`+${fmt(c.tP-c.sh)}`:`-${fmt(c.sh-c.tP)}`}`},{l:'Dheeraj Paid',v:fmt(c.dP),col:D,s:`Share ${fmt(c.sh)} · ${c.dP>=c.sh?`+${fmt(c.dP-c.sh)}`:`-${fmt(c.sh-c.dP)}`}`},{l:'Total Income',v:fmt(c.totR),col:G,s:`T:${fmt(c.tR)} D:${fmt(c.dR)}`},{l:'Net Profit',v:fmt(c.profit),col:GOLD,s:`${fmt(c.ps)} each`}]
        .map(card=><div key={card.l} style={{background:'#f5f2eb',padding:'1.2rem 1.4rem'}}><div style={{fontSize:'0.58rem',letterSpacing:'0.22em',color:'#7a7870',textTransform:'uppercase'}}>{card.l}</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.7rem',color:card.col||'#1a1a18',lineHeight:1,margin:'5px 0 3px'}}>{card.v}</div><div style={{fontSize:'0.58rem',color:'#7a7870'}}>{card.s}</div></div>)}
    </div>

    {/* SETTLEMENT */}
    <div style={{margin:'0 1.5rem 1.5rem',background:'#1a1a18',color:'#f5f2eb',padding:'1.2rem 1.8rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem'}}>
      <div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1rem',fontStyle:'italic'}}>
          <strong style={{fontStyle:'normal',color:sf===T?T:D}}>{sf}</strong> pays <strong style={{fontStyle:'normal',color:st===T?T:D}}>{st}</strong> to settle this month
        </div>
        <div style={{fontSize:'0.58rem',opacity:0.4,marginTop:5,letterSpacing:'0.15em'}}>Balances expense overpay + income difference</div>
      </div>
      <div style={{textAlign:'right'}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:'2rem',color:'#7fff72'}}>{fmt(c.s.amt)}</div><div style={{fontSize:'0.6rem',opacity:0.5,letterSpacing:'0.2em',marginTop:3}}>{sf.toUpperCase()} → {st.toUpperCase()}</div></div>
    </div>

    {/* EXPENSE PANELS */}
    <SL>Expenses by Partner</SL>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'#d8d5cc',margin:'0 1.5rem',border:'1px solid #d8d5cc'}}>
      {[{who:'T',name:'Tushar',exps:tE,paid:c.tP},{who:'D',name:'Dheeraj',exps:dE,paid:c.dP}].map(p=>(
        <div key={p.who} style={{background:'#f5f2eb'}}>
          <div style={{padding:'0.9rem 1.4rem',borderBottom:'1px solid #d8d5cc',display:'flex',justifyContent:'space-between',alignItems:'center',background:p.who==='T'?TL:DL}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.05rem',color:p.who==='T'?T:D}}>{p.name}</div>
            <span style={{fontSize:'0.58rem',color:p.who==='T'?T:D,background:'#fff',padding:'2px 8px'}}>{p.exps.length} items</span>
          </div>
          {p.exps.length===0&&<div style={{padding:'1.5rem',fontSize:'0.65rem',color:'#bbb'}}>No expenses yet.</div>}
          {p.exps.map(e=><ExpRow key={e.id} e={e} who={p.who}/>)}
          <div style={{padding:'0.85rem 1.4rem',background:'#eceae0',borderTop:'2px solid #d8d5cc',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'0.6rem',letterSpacing:'0.2em',color:'#7a7870'}}>TOTAL PAID</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:'1.2rem',fontWeight:700,color:p.who==='T'?T:D}}>{fmt(p.paid)}</span>
          </div>
        </div>
      ))}
    </div>

    <div style={{margin:'1rem 1.5rem 0'}}>
      <button style={{...btnD,width:'100%',padding:'0.85rem',textAlign:'left',display:'flex',justifyContent:'space-between'}}
        onClick={()=>{setEditId(null);setForm({name:'',amount:'',paidBy:'Tushar',category:'Platform Fee',type:'monthly'});setExpModal(true)}}>
        <span>+ ADD EXPENSE</span><span>→</span>
      </button>
    </div>

    {/* INCOME (read-only with override) */}
    <SL>Income Received</SL>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:1,background:'#d8d5cc',margin:'0 1.5rem',border:'1px solid #d8d5cc'}}>
      {[{who:'Tushar',val:c.tR,col:T,id:'tInc'},{who:'Dheeraj',val:c.dR,col:D,id:'dInc'}].map(p=>(
        <div key={p.who} style={{background:'#f5f2eb',padding:'1.1rem 1.4rem'}}>
          <div style={{fontSize:'0.58rem',letterSpacing:'0.2em',color:'#7a7870',marginBottom:4}}>{p.who.toUpperCase()} RECEIVED</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',color:p.col}}>{fmt(p.val)}</div>
          <div style={{fontSize:'0.58rem',color:'#7a7870',marginTop:3,marginBottom:8}}>Auto-synced from Clients page</div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <input id={p.id} type="number" defaultValue={p.val||''} placeholder="Manual override"
              style={{background:'#eceae0',border:'1px solid #d8d5cc',padding:'5px 8px',fontFamily:"'DM Mono',monospace",fontSize:'0.7rem',color:'#1a1a18',width:140,outline:'none'}}/>
            <button style={{...btnD,padding:'5px 10px',fontSize:'0.6rem'}} onClick={()=>setIncome(p.who,document.getElementById(p.id).value)}>SET</button>
          </div>
        </div>
      ))}
      <div style={{background:'#f5f2eb',padding:'1.1rem 1.4rem'}}>
        <div style={{fontSize:'0.58rem',letterSpacing:'0.2em',color:'#7a7870',marginBottom:4}}>TOTAL INCOME</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem'}}>{fmt(c.totR)}</div>
      </div>
      <div style={{background:'#f5f2eb',padding:'1.1rem 1.4rem'}}>
        <div style={{fontSize:'0.58rem',letterSpacing:'0.2em',color:'#7a7870',marginBottom:4}}>NET PROFIT</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',color:G}}>{fmt(c.profit)}</div>
        <div style={{fontSize:'0.58rem',color:'#7a7870',marginTop:3}}>{fmt(c.ps)} each (50/50)</div>
      </div>
    </div>

    {/* PROFIT BREAKDOWN */}
    <SL>Final Account Breakdown</SL>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'#d8d5cc',margin:'0 1.5rem 1.5rem',border:'1px solid #d8d5cc'}}>
      {[{name:'Tushar',paid:c.tP,rec:c.tR,col:T},{name:'Dheeraj',paid:c.dP,rec:c.dR,col:D}].map(p=>(
        <div key={p.name} style={{background:'#f5f2eb',padding:'1.4rem'}}>
          <div style={{fontSize:'0.58rem',letterSpacing:'0.25em',color:'#7a7870',marginBottom:'0.8rem'}}>{p.name.toUpperCase()}</div>
          {pbr('Expenses paid',fmt(p.paid),p.col)}
          {pbr('Fair share',fmt(c.sh))}
          {pbr('Expense difference',(p.paid>=c.sh?'+':'-')+fmt(Math.abs(p.paid-c.sh)),p.paid>=c.sh?G:RED)}
          {pbr('Income received',fmt(p.rec),p.col)}
          {pbr('Profit share (50%)',fmt(c.ps),G)}
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.72rem',padding:'0.35rem 0',fontWeight:500}}><span style={{color:'#7a7870'}}>Should receive</span><span style={{color:G}}>{fmt(c.sh+c.ps)}</span></div>
        </div>
      ))}
    </div>

    <div style={{margin:'1.5rem',paddingTop:'1rem',borderTop:'1px solid #d8d5cc',display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
      <p style={{fontSize:'0.58rem',color:'#7a7870',letterSpacing:'0.15em'}}>Helix Frame · 50/50 · Firebase · INR</p>
      <div style={{display:'flex',gap:8}}>
        <button style={{...btnG,fontSize:'0.6rem'}} onClick={delMonth}>🗑 Delete Month</button>
        <button style={{...btnG,fontSize:'0.6rem'}} onClick={exportCSV}>↓ Export CSV</button>
      </div>
    </div>
  </>)
}

// ══════════════════════════════════════════════════════════════
//  CLIENTS PAGE
// ══════════════════════════════════════════════════════════════
function ClientsPage({data,setData,write,user,showToast}){
  const clients=data.clients||[]
  const months=data.months||{}
  const [modal,setModal]=useState(false)
  const [editId,setEditId]=useState(null)
  const [delModal,setDelModal]=useState(false)
  const [delId,setDelId]=useState(null)
  const [filter,setFilter]=useState('All')
  const [search,setSearch]=useState('')

  const ef={clientName:'',contact:'',workType:'Website Development',description:'',projectValue:'',amountReceived:'',receivedBy:'Tushar',status:'Active',startDate:today(),month:Object.keys(months)[0]||'Feb 2026'}
  const [form,setForm]=useState(ef)

  const totalVal =clients.reduce((s,c)=>s+(+c.projectValue||0),0)
  const totalRec =clients.reduce((s,c)=>s+(+c.amountReceived||0),0)
  const totalPend=totalVal-totalRec
  const tRec=clients.filter(c=>c.receivedBy==='Tushar').reduce((s,c)=>s+(+c.amountReceived||0),0)
  const dRec=clients.filter(c=>c.receivedBy==='Dheeraj').reduce((s,c)=>s+(+c.amountReceived||0),0)

  // auto-sync: recalculate income per month from clients
  const syncAndSave=async(newClients)=>{
    const updMonths={...months}
    Object.keys(updMonths).forEach(mn=>{
      const mc=newClients.filter(c=>c.month===mn)
      const tR=mc.filter(c=>c.receivedBy==='Tushar').reduce((s,c)=>s+(+c.amountReceived||0),0)
      const dR=mc.filter(c=>c.receivedBy==='Dheeraj').reduce((s,c)=>s+(+c.amountReceived||0),0)
      updMonths[mn]={...updMonths[mn],income:{tusharReceived:tR,dheerajReceived:dR}}
    })
    const nd={...data,months:updMonths,clients:newClients}
    setData(nd); await write(nd)
  }

  const openAdd=()=>{setEditId(null);setForm({...ef,month:Object.keys(months)[0]||'Feb 2026'});setModal(true)}
  const openEdit=id=>{const c=clients.find(x=>x.id===id);if(!c)return;setEditId(id);setForm({...ef,...c,projectValue:c.projectValue||'',amountReceived:c.amountReceived||''});setModal(true)}

  const saveClient=async()=>{
    if(!form.clientName.trim()){showToast('Client name required',false);return}
    const obj={...form,projectValue:+form.projectValue||0,amountReceived:+form.amountReceived||0,updatedBy:user,updatedAt:today()}
    const nc=editId!==null?clients.map(c=>c.id===editId?{...c,...obj}:c):[...clients,{id:Date.now(),...obj}]
    setModal(false); await syncAndSave(nc); showToast('Client saved & income synced ✓')
  }

  const confirmDel=async()=>{setDelModal(false);await syncAndSave(clients.filter(c=>c.id!==delId))}

  const filtered=clients
    .filter(c=>filter==='All'||c.status===filter)
    .filter(c=>!search||c.clientName.toLowerCase().includes(search.toLowerCase())||c.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>(b.id||0)-(a.id||0))

  const fv=v=>setForm(f=>({...f,...v}))

  return(<>
    {/* MODAL */}
    {modal&&<Overlay onClose={()=>setModal(false)} wide>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.2rem',fontWeight:400,marginBottom:'1.4rem'}}>{editId?'Edit Client':'Add Client / Project'}</h2>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.9rem'}}>
        <div style={{gridColumn:'1/-1'}}><label style={fl}>CLIENT NAME *</label><input style={fi} value={form.clientName} onChange={e=>fv({clientName:e.target.value})} placeholder="e.g. Acme Corp" autoFocus/></div>
        <div><label style={fl}>CONTACT (EMAIL/PHONE)</label><input style={fi} value={form.contact} onChange={e=>fv({contact:e.target.value})} placeholder="optional"/></div>
        <div><label style={fl}>WORK TYPE</label><select style={fi} value={form.workType} onChange={e=>fv({workType:e.target.value})}>{WORK_TYPES.map(w=><option key={w}>{w}</option>)}</select></div>
        <div style={{gridColumn:'1/-1'}}><label style={fl}>WORK DESCRIPTION</label><input style={fi} value={form.description} onChange={e=>fv({description:e.target.value})} placeholder="Brief description of the work done"/></div>
        <div><label style={fl}>PROJECT VALUE (₹)</label><input style={fi} type="number" value={form.projectValue} onChange={e=>fv({projectValue:e.target.value})} placeholder="0"/></div>
        <div><label style={fl}>AMOUNT RECEIVED (₹)</label><input style={fi} type="number" value={form.amountReceived} onChange={e=>fv({amountReceived:e.target.value})} placeholder="0"/></div>
        <div><label style={fl}>PAYMENT RECEIVED BY</label><select style={fi} value={form.receivedBy} onChange={e=>fv({receivedBy:e.target.value})}><option>Tushar</option><option>Dheeraj</option></select></div>
        <div><label style={fl}>STATUS</label><select style={fi} value={form.status} onChange={e=>fv({status:e.target.value})}><option>Active</option><option>Pending Payment</option><option>Completed</option><option>Cancelled</option></select></div>
        <div><label style={fl}>START DATE</label><input style={fi} type="date" value={form.startDate} onChange={e=>fv({startDate:e.target.value})}/></div>
        <div><label style={fl}>FINANCE MONTH (for sync)</label><select style={fi} value={form.month} onChange={e=>fv({month:e.target.value})}>{Object.keys(months).map(m=><option key={m}>{m}</option>)}</select></div>
      </div>
      <div style={{background:'#e8f4ec',border:'1px solid #b8ddc4',padding:'0.75rem 1rem',marginTop:'1rem',fontSize:'0.62rem',color:G,lineHeight:1.6}}>
        💡 Amount Received will automatically update the <strong>Income section</strong> on the Finance page for the selected month.
      </div>
      <div style={{display:'flex',gap:'0.75rem',marginTop:'1.2rem'}}><button style={btnGr} onClick={saveClient}>SAVE CLIENT</button><button style={btnG} onClick={()=>setModal(false)}>Cancel</button></div>
    </Overlay>}

    {delModal&&<Overlay onClose={()=>setDelModal(false)}>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.1rem',fontWeight:400,marginBottom:'0.5rem'}}>Delete this client?</h2>
      <p style={{fontSize:'0.68rem',color:'#7a7870',marginBottom:'1.2rem',lineHeight:1.7}}>Their payment amount will also be removed from the Finance income total.</p>
      <div style={{display:'flex',gap:'0.75rem'}}><button style={{...btnD,background:RED}} onClick={confirmDel}>DELETE</button><button style={btnG} onClick={()=>setDelModal(false)}>Cancel</button></div>
    </Overlay>}

    {/* SUMMARY CARDS */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:1,background:'#d8d5cc',margin:'1.5rem',border:'1px solid #d8d5cc'}}>
      {[{l:'Total Clients',v:clients.length,col:null,s:'All time'},{l:'Total Project Value',v:fmt(totalVal),col:GOLD,s:'All projects'},{l:'Total Received',v:fmt(totalRec),col:G,s:'Collected'},{l:'Pending',v:fmt(totalPend),col:totalPend>0?RED:'#1a1a18',s:'To collect'},{l:'Tushar Collected',v:fmt(tRec),col:T,s:'Direct'},{l:'Dheeraj Collected',v:fmt(dRec),col:D,s:'Direct'}]
        .map(card=><div key={card.l} style={{background:'#f5f2eb',padding:'1.2rem 1.4rem'}}><div style={{fontSize:'0.58rem',letterSpacing:'0.22em',color:'#7a7870',textTransform:'uppercase'}}>{card.l}</div><div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.6rem',color:card.col||'#1a1a18',lineHeight:1,margin:'5px 0 3px'}}>{card.v}</div><div style={{fontSize:'0.58rem',color:'#7a7870'}}>{card.s}</div></div>)}
    </div>

    {/* TOOLBAR */}
    <div style={{margin:'0 1.5rem 1rem',display:'flex',gap:'0.75rem',flexWrap:'wrap',alignItems:'center'}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search clients…" style={{...fi,width:200,padding:'0.5rem 0.8rem'}}/>
      {['All','Active','Pending Payment','Completed','Cancelled'].map(f=>(
        <button key={f} onClick={()=>setFilter(f)} style={{background:filter===f?'#1a1a18':'transparent',color:filter===f?'#f5f2eb':'#7a7870',border:'1px solid',borderColor:filter===f?'#1a1a18':'#d8d5cc',padding:'0.35rem 0.8rem',fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',cursor:'pointer'}}>{f}</button>
      ))}
      <button style={{...btnGr,marginLeft:'auto'}} onClick={openAdd}>+ ADD CLIENT</button>
    </div>

    {/* CLIENT LIST */}
    <SL>Client & Project Database ({filtered.length})</SL>
    <div style={{margin:'0 1.5rem 2rem',border:'1px solid #d8d5cc'}}>
      {filtered.length===0&&<div style={{padding:'3rem',textAlign:'center',fontSize:'0.68rem',color:'#bbb'}}>{clients.length===0?'No clients yet — click + ADD CLIENT to start':'No clients match your filter.'}</div>}
      {filtered.map((c,i)=>{
        const sc=STATUS_COL[c.status]||'#888'
        const pend=(+c.projectValue||0)-(+c.amountReceived||0)
        return(
          <div key={c.id} style={{background:i%2===0?'#f5f2eb':'#faf9f5',borderBottom:'1px solid #d8d5cc',padding:'1.1rem 1.4rem',display:'flex',gap:'1rem',flexWrap:'wrap',alignItems:'flex-start'}}
            onMouseEnter={ev=>ev.currentTarget.style.background='#eceae0'}
            onMouseLeave={ev=>ev.currentTarget.style.background=i%2===0?'#f5f2eb':'#faf9f5'}>
            {/* client info */}
            <div style={{flex:'2',minWidth:200}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1rem'}}>{c.clientName}</div>
                <span style={{background:sc+'18',color:sc,fontSize:'0.55rem',padding:'2px 7px',borderRadius:2,letterSpacing:'0.1em'}}>{c.status}</span>
                <span style={{background:'#eceae0',color:'#7a7870',fontSize:'0.55rem',padding:'2px 7px',borderRadius:2}}>{c.workType}</span>
              </div>
              {c.description&&<div style={{fontSize:'0.68rem',color:'#555',marginBottom:4,lineHeight:1.5}}>{c.description}</div>}
              {c.contact&&<div style={{fontSize:'0.6rem',color:'#aaa',marginBottom:3}}>📧 {c.contact}</div>}
              <div style={{fontSize:'0.58rem',color:'#bbb'}}>
                {c.startDate&&`${c.startDate} · `}Finance: {c.month}{c.updatedBy&&` · by ${c.updatedBy}`}
              </div>
            </div>
            {/* financials */}
            <div style={{flex:'1',minWidth:160}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
                {[{l:'Project Value',v:fmt(c.projectValue||0),col:GOLD},{l:'Received',v:fmt(c.amountReceived||0),col:G},{l:'Pending',v:fmt(pend),col:pend>0?RED:G},{l:'Received by',v:c.receivedBy,col:c.receivedBy==='Tushar'?T:D}].map(r=>(
                  <div key={r.l} style={{background:'#eceae0',padding:'6px 8px',borderRadius:2}}>
                    <div style={{fontSize:'0.52rem',color:'#7a7870',letterSpacing:'0.1em'}}>{r.l}</div>
                    <div style={{fontSize:'0.78rem',fontWeight:500,color:r.col,marginTop:2}}>{r.v}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* actions */}
            <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
              {[['Edit',()=>openEdit(c.id),T],['Delete',()=>{setDelId(c.id);setDelModal(true)},RED]].map(([l,fn,hc])=>(
                <button key={l} onClick={fn} style={{background:'transparent',border:'1px solid #d8d5cc',color:'#7a7870',padding:'4px 12px',fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',cursor:'pointer'}}
                  onMouseEnter={ev=>{ev.target.style.borderColor=hc;ev.target.style.color=hc}}
                  onMouseLeave={ev=>{ev.target.style.borderColor='#d8d5cc';ev.target.style.color='#7a7870'}}>{l}</button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  </>)
}
