import { useState, useEffect, useCallback } from 'react'
import { db } from './firebase'
import { ref, onValue, set } from 'firebase/database'

// ── colours ───────────────────────────────────────────────────
const T='#2a5caa',TL='#e8eef8',D='#b84c1e',DL='#faeee8',G='#2d7a45',GOLD='#c8960c',RED='#c0392b'
const CAT_COL={'Platform Fee':'#b84c1e','Staff / Freelancer':'#2d7a45','Tools & Software':'#c8960c','Domain / Hosting':'#2a5caa','Subscription':'#7a4fcf','Other':'#888'}

// ── helpers ───────────────────────────────────────────────────
const fmt = n => '₹'+Math.abs(Math.round(n)).toLocaleString('en-IN')
const ts  = () => new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})

function calc(expenses=[], income={tusharReceived:0,dheerajReceived:0}) {
  const tP=expenses.filter(e=>e.paidBy==='Tushar').reduce((s,e)=>s+e.amount,0)
  const dP=expenses.filter(e=>e.paidBy==='Dheeraj').reduce((s,e)=>s+e.amount,0)
  const tot=tP+dP, sh=tot/2
  const tR=income.tusharReceived||0, dR=income.dheerajReceived||0
  const totR=tR+dR, profit=totR-tot, ps=profit/2
  const np=(tP-sh)-(tR-totR/2)
  return {tP,dP,tot,sh,tR,dR,totR,profit,ps,
    s:{amt:Math.abs(np),from:np>0?'Dheeraj':'Tushar',to:np>0?'Tushar':'Dheeraj'}}
}

// ── styles ────────────────────────────────────────────────────
const S={
  page:{background:'#f5f2eb',minHeight:'100vh',fontFamily:"'DM Mono',monospace",fontSize:13},
  hdr:{background:'#1a1a18',color:'#f5f2eb',padding:'1.3rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem'},
  h1:{fontFamily:"'Playfair Display',serif",fontSize:'1.5rem',fontWeight:400},
  sub:{fontSize:'0.6rem',opacity:0.45,letterSpacing:'0.22em',marginTop:3},
  tabs:{display:'flex',gap:6,flexWrap:'wrap',padding:'1rem 2rem',background:'#eceae0',borderBottom:'1px solid #d8d5cc'},
  tab:a=>({background:a?'#1a1a18':'transparent',color:a?'#f5f2eb':'#7a7870',border:'1px solid',borderColor:a?'#1a1a18':'#d8d5cc',padding:'0.35rem 0.9rem',fontFamily:"'DM Mono',monospace",fontSize:'0.62rem',letterSpacing:'0.15em'}),
  cards:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:1,background:'#d8d5cc',margin:'1.5rem',border:'1px solid #d8d5cc'},
  card:{background:'#f5f2eb',padding:'1.2rem 1.4rem'},
  clbl:{fontSize:'0.58rem',letterSpacing:'0.22em',color:'#7a7870',textTransform:'uppercase'},
  cval:c=>({fontFamily:"'Playfair Display',serif",fontSize:'1.7rem',fontWeight:400,color:c||'#1a1a18',lineHeight:1,margin:'5px 0 3px'}),
  csub:{fontSize:'0.58rem',color:'#7a7870'},
  settle:{margin:'0 1.5rem 1.5rem',background:'#1a1a18',color:'#f5f2eb',padding:'1.2rem 1.8rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem'},
  sAmt:{fontFamily:"'Playfair Display',serif",fontSize:'2rem',color:'#7fff72'},
  sDir:{fontSize:'0.6rem',opacity:0.5,letterSpacing:'0.2em',marginTop:3},
  secLbl:{padding:'0 1.5rem',margin:'1.2rem 0 0.6rem',fontSize:'0.58rem',letterSpacing:'0.3em',color:'#7a7870',textTransform:'uppercase',display:'flex',alignItems:'center',gap:'0.8rem'},
  twoCol:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'#d8d5cc',margin:'0 1.5rem',border:'1px solid #d8d5cc'},
  panelH:c=>({padding:'0.9rem 1.4rem',borderBottom:'1px solid #d8d5cc',display:'flex',justifyContent:'space-between',alignItems:'center',background:c==='T'?TL:DL}),
  panelT:c=>({fontFamily:"'Playfair Display',serif",fontSize:'1.05rem',fontWeight:400,color:c==='T'?T:D}),
  eRow:{display:'flex',alignItems:'center',padding:'0.65rem 1.4rem',borderBottom:'1px solid #d8d5cc',gap:'0.8rem',transition:'background 0.15s'},
  eName:{fontSize:'0.72rem',color:'#1a1a18',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'},
  eMeta:{fontSize:'0.55rem',color:'#7a7870',marginTop:2,display:'flex',gap:6,flexWrap:'wrap'},
  eAmt:c=>({fontSize:'0.8rem',fontWeight:500,color:c,whiteSpace:'nowrap'}),
  pTotal:{padding:'0.85rem 1.4rem',background:'#eceae0',borderTop:'2px solid #d8d5cc',display:'flex',justifyContent:'space-between',alignItems:'center'},
  incGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:1,background:'#d8d5cc',margin:'0 1.5rem',border:'1px solid #d8d5cc'},
  incCard:{background:'#f5f2eb',padding:'1.1rem 1.4rem'},
  incLbl:{fontSize:'0.58rem',letterSpacing:'0.2em',color:'#7a7870',marginBottom:4},
  incVal:c=>({fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',color:c||'#1a1a18'}),
  profGrid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:'#d8d5cc',margin:'0 1.5rem 1.5rem',border:'1px solid #d8d5cc'},
  profCard:{background:'#f5f2eb',padding:'1.4rem'},
  pbRow:{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',padding:'0.35rem 0',borderBottom:'1px solid #d8d5cc'},
  // buttons
  btnDark:{background:'#1a1a18',color:'#f5f2eb',border:'none',padding:'0.6rem 1.4rem',fontFamily:"'DM Mono',monospace",fontSize:'0.63rem',letterSpacing:'0.18em'},
  btnGhost:{background:'transparent',border:'1px solid #d8d5cc',color:'#7a7870',padding:'0.6rem 1rem',fontFamily:"'DM Mono',monospace",fontSize:'0.63rem'},
  btnGreen:{background:G,color:'#fff',border:'none',padding:'0.6rem 1.4rem',fontFamily:"'DM Mono',monospace",fontSize:'0.63rem',letterSpacing:'0.18em'},
  btnEdit:{background:'transparent',border:'1px solid #d8d5cc',color:'#7a7870',padding:'3px 9px',fontFamily:"'DM Mono',monospace",fontSize:'0.6rem'},
  btnDel:{background:'transparent',border:'1px solid #d8d5cc',color:'#7a7870',padding:'3px 9px',fontFamily:"'DM Mono',monospace",fontSize:'0.6rem'},
  // form
  fgGrid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.9rem'},
  fg:{display:'flex',flexDirection:'column',gap:4},
  flbl:{fontSize:'0.58rem',letterSpacing:'0.2em',color:'#7a7870'},
  finput:{background:'#eceae0',border:'1px solid #d8d5cc',padding:'0.55rem 0.8rem',fontFamily:"'DM Mono',monospace",fontSize:'0.73rem',color:'#1a1a18',width:'100%'},
  // modal overlay
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'},
  modal:{background:'#f5f2eb',padding:'2rem',width:'min(520px,92vw)',maxHeight:'90vh',overflowY:'auto',position:'relative',boxShadow:'0 8px 40px rgba(0,0,0,0.2)',animation:'fadeUp 0.2s ease'},
}

// ══════════════════════════════════════════════════════════════
export default function App() {
  const [user,setUser]       = useState(()=>localStorage.getItem('hf-user')||null)
  const [months,setMonths]   = useState(null)
  const [clients,setClients] = useState([])
  const [active,setActive]   = useState('Feb 2026')
  const [saving,setSaving]   = useState(false)
  const [online,setOnline]   = useState(true)
  const [lastSync,setLastSync] = useState(null)
  const [toast,setToast]     = useState(null)
  const [clientForm,setClientForm] = useState({
  client:'',
  work:'',
  amount:'',
  receivedBy:'Tushar'
})

  // expense modal
  const [expModal,setExpModal] = useState(false)
  const [editId,setEditId]   = useState(null)
  const [form,setForm]       = useState({name:'',amount:'',paidBy:'Tushar',category:'Platform Fee',type:'monthly'})

  // delete modal
  const [delModal,setDelModal] = useState(false)
  const [delId,setDelId]     = useState(null)
  const [delDesc,setDelDesc] = useState('')

  const showToast=(msg,ok=true)=>{setToast({msg,ok});setTimeout(()=>setToast(null),3000)}

  // ── Firebase listener ──
  useEffect(()=>{
    const dbRef = ref(db,'helixframe/months')
    const unsub = onValue(dbRef, snap=>{
      const val=snap.val()
      if(val){ setMonths(val); setActive(a=>val[a]?a:Object.keys(val)[0]) }
      else {
        const seed={'Feb 2026':{expenses:[],income:{tusharReceived:0,dheerajReceived:0}}}
        set(dbRef,seed); setMonths(seed)
      }
      setLastSync(ts()); setOnline(true)
    },()=>setOnline(false))
    return ()=>unsub()
  },[])

  const write=useCallback(async(newMonths)=>{
    setSaving(true)
    try{ await set(ref(db,'helixframe/months'),newMonths); showToast('Saved ✓') }
    catch{ showToast('Save failed',false) }
    setSaving(false)
  },[])

  // ── login screen ──
  if(!user) return(
    <div style={{background:'#0f1510',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'2rem',fontFamily:"'DM Mono',monospace"}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:'2rem',fontWeight:300,color:'#7fff72',letterSpacing:'0.05em'}}>Helix Frame</div>
      <div style={{color:'#6b7a62',fontSize:'0.62rem',letterSpacing:'0.35em'}}>WHO ARE YOU?</div>
      <div style={{display:'flex',gap:'1rem'}}>
        {['Tushar','Dheeraj'].map(p=>(
          <button key={p} onClick={()=>{localStorage.setItem('hf-user',p);setUser(p)}}
            style={{background:'transparent',border:`2px solid ${p==='Tushar'?T:D}`,color:p==='Tushar'?T:D,padding:'0.9rem 2.5rem',fontFamily:"'DM Mono',monospace",fontSize:'0.85rem',letterSpacing:'0.2em'}}>
            {p}
          </button>
        ))}
      </div>
      <div style={{color:'#3a4a36',fontSize:'0.58rem',letterSpacing:'0.2em'}}>Saved in your browser for next time</div>
    </div>
  )

  if(!months) return(
    <div style={{...S.page,display:'flex',alignItems:'center',justifyContent:'center',color:'#7a7870',fontSize:'0.75rem',letterSpacing:'0.25em'}}>
      CONNECTING TO FIREBASE…
    </div>
  )

  const md = months?.[active] || {expenses:[],income:{tusharReceived:0,dheerajReceived:0}}
  const c = calc(md.expenses, md.income)
  const tE = (md.expenses || []).filter(e => e.paidBy === 'Tushar')
  const dE = (md.expenses || []).filter(e => e.paidBy === 'Dheeraj')

  // ── open add ──
  const openAdd=()=>{
    setEditId(null)
    setForm({name:'',amount:'',paidBy:'Tushar',category:'Platform Fee',type:'monthly'})
    setExpModal(true)
  }

  // ── open edit ──
  const openEdit=(id)=>{
    const e=md.expenses.find(x=>x.id===id); if(!e) return
    setEditId(id)
    setForm({name:e.name,amount:e.amount,paidBy:e.paidBy,category:e.category,type:e.type})
    setExpModal(true)
  }

  // ── save expense ──
  const saveExpense=async()=>{
    if(!form.name.trim()||!form.amount||isNaN(+form.amount)||+form.amount<=0){showToast('Fill in all fields',false);return}
    const obj={name:form.name.trim(),amount:+form.amount,paidBy:form.paidBy,category:form.category,type:form.type,addedBy:user}
    const arr=[...(md.expenses || [])]
    if(editId!==null){const i=arr.findIndex(x=>x.id===editId);if(i>-1)arr[i]={...arr[i],...obj}}
    else arr.push({id:Date.now(),...obj})
    const updated={...months,[active]:{...md,expenses:arr}}
    setMonths(updated); setExpModal(false)
    await write(updated)
  }

  // ── delete ──
  const openDel=(id)=>{
    const e=md.expenses.find(x=>x.id===id); if(!e) return
    setDelId(id); setDelDesc(`"${e.name}" — ${fmt(e.amount)} (paid by ${e.paidBy})`); setDelModal(true)
  }
  const confirmDel=async()=>{
    const updated={...months,[active]:{...md,expenses:md.expenses.filter(x=>x.id!==delId)}}
    setMonths(updated); setDelModal(false)
    await write(updated)
  }
// ── save client payment ──
const saveClient = () => {
  if(!clientForm.client || !clientForm.amount) return

  const obj = {
    id: Date.now(),
    client: clientForm.client,
    work: clientForm.work,
    amount: +clientForm.amount,
    receivedBy: clientForm.receivedBy
  }

  setClients([...clients, obj])

  setClientForm({
    client:'',
    work:'',
    amount:'',
    receivedBy:'Tushar'
  })
}
  
  // ── income ──
  const setIncome=async(who,val)=>{
    const v=parseFloat(val); if(isNaN(v)||v<0){showToast('Enter a valid amount',false);return}
    const key=who==='Tushar'?'tusharReceived':'dheerajReceived'
    const updated={...months,[active]:{...md,income:{...md.income,[key]:v}}}
    setMonths(updated); await write(updated)
  }

  // ── months ──
  const addMonth=async()=>{
    const n=prompt('New month name (e.g. Mar 2026):'); if(!n?.trim()) return
    const nm=n.trim()
    if(months[nm]){showToast('Already exists',false);return}
    const updated={...months,[nm]:{expenses:[],income:{tusharReceived:0,dheerajReceived:0}}}
    setMonths(updated); setActive(nm); await write(updated)
  }
  const deleteMonth=async()=>{
    if(Object.keys(months).length<=1){showToast("Can't delete last month",false);return}
    if(!confirm(`Delete "${active}" and all its data?`)) return
    const updated={...months}; delete updated[active]
    const first=Object.keys(updated)[0]
    setMonths(updated); setActive(first); await write(updated)
  }

  // ── export ──
  const exportCSV=()=>{
    let csv='Type,Description,Amount,Paid By,Category,Recurrence\n'
    md.expenses.forEach(e=>{csv+=`Expense,"${e.name}",${e.amount},${e.paidBy},"${e.category}",${e.type}\n`})
    csv+=`Income,Tushar received,${md.income.tusharReceived||0},Tushar,Income,-\n`
    csv+=`Income,Dheeraj received,${md.income.dheerajReceived||0},Dheeraj,Income,-\n`
    const a=document.createElement('a')
    a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    a.download=`HelixFrame-${active.replace(' ','-')}.csv`; a.click()
  }

  const sfrom=c.s.from, sto=c.s.to
  const scf=sfrom==='Tushar'?T:D, sct=sto==='Tushar'?T:D

  const pbr=(lbl,val,col)=>(
    <div style={{...S.pbRow,fontSize:'0.68rem'}}>
      <span style={{color:'#7a7870'}}>{lbl}</span>
      <span style={{color:col||'#1a1a18',fontWeight:col?500:400}}>{val}</span>
    </div>
  )

  const ExpRow=({e,who})=>{
    const col=CAT_COL[e.category]||'#888'
    return(
      <div style={{...S.eRow}} onMouseEnter={ev=>ev.currentTarget.style.background='#eceae0'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
        <div style={{flex:1,minWidth:0}}>
          <div style={S.eName}>{e.name}</div>
          <div style={S.eMeta}>
            <span style={{background:col+'20',color:col,padding:'1px 5px',borderRadius:2}}>{e.category}</span>
            <span>{e.type}</span>
            {e.addedBy&&<span style={{color:'#bbb'}}>· {e.addedBy}</span>}
          </div>
        </div>
        <div style={S.eAmt(who==='T'?T:D)}>{fmt(e.amount)}</div>
        <div style={{display:'flex',gap:4,flexShrink:0}}>
          <button style={S.btnEdit} onClick={()=>openEdit(e.id)}
            onMouseEnter={ev=>{ev.target.style.borderColor=T;ev.target.style.color=T}}
            onMouseLeave={ev=>{ev.target.style.borderColor='#d8d5cc';ev.target.style.color='#7a7870'}}>Edit</button>
          <button style={S.btnDel} onClick={()=>openDel(e.id)}
            onMouseEnter={ev=>{ev.target.style.borderColor=RED;ev.target.style.color=RED}}
            onMouseLeave={ev=>{ev.target.style.borderColor='#d8d5cc';ev.target.style.color='#7a7870'}}>Del</button>
        </div>
      </div>
    )
  }

  return(
    <div style={S.page}>

      {/* TOAST */}
      {toast&&<div style={{position:'fixed',top:'1rem',right:'1rem',zIndex:999,background:toast.ok?G:RED,color:'#fff',padding:'0.7rem 1.2rem',fontFamily:"'DM Mono',monospace",fontSize:'0.68rem',letterSpacing:'0.15em',boxShadow:'0 4px 20px rgba(0,0,0,0.25)',animation:'fadeUp 0.2s ease'}}>{toast.msg}</div>}

      {/* EXPENSE MODAL */}
      {expModal&&(
        <div style={S.overlay} onClick={e=>{if(e.target===e.currentTarget)setExpModal(false)}}>
          <div style={S.modal}>
            <button onClick={()=>setExpModal(false)} style={{position:'absolute',top:'1.2rem',right:'1.4rem',background:'none',border:'none',fontSize:'1.3rem',color:'#7a7870',lineHeight:1}}>×</button>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.2rem',fontWeight:400,marginBottom:'1.4rem'}}>{editId?'Edit Expense':'Add Expense'}</h2>
            <div style={S.fgGrid}>
              <div style={{...S.fg,gridColumn:'1/-1'}}>
                <label style={S.flbl}>DESCRIPTION</label>
                <input style={S.finput} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Figma subscription" autoFocus/>
              </div>
              <div style={S.fg}>
                <label style={S.flbl}>AMOUNT (₹)</label>
                <input style={S.finput} type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0"/>
              </div>
              <div style={S.fg}>
                <label style={S.flbl}>PAID BY</label>
                <select style={S.finput} value={form.paidBy} onChange={e=>setForm(f=>({...f,paidBy:e.target.value}))}>
                  <option>Tushar</option><option>Dheeraj</option>
                </select>
              </div>
              <div style={S.fg}>
                <label style={S.flbl}>CATEGORY</label>
                <select style={S.finput} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {Object.keys(CAT_COL).map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={S.fg}>
                <label style={S.flbl}>TYPE</label>
                <select style={S.finput} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-off">One-off</option>
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:'0.75rem',marginTop:'1.4rem'}}>
              <button style={S.btnDark} onClick={saveExpense}>SAVE</button>
              <button style={S.btnGhost} onClick={()=>setExpModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {delModal&&(
        <div style={{...S.overlay,zIndex:200}} onClick={e=>{if(e.target===e.currentTarget)setDelModal(false)}}>
          <div style={{...S.modal,maxWidth:360}}>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.1rem',fontWeight:400,marginBottom:'0.5rem'}}>Delete this entry?</h2>
            <p style={{fontSize:'0.68rem',color:'#7a7870',marginBottom:'1.4rem',lineHeight:1.7}}>{delDesc}</p>
            <div style={{display:'flex',gap:'0.75rem'}}>
              <button style={{...S.btnDark,background:RED}} onClick={confirmDel}>YES, DELETE</button>
              <button style={S.btnGhost} onClick={()=>setDelModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={S.hdr}>
        <div>
          <div style={S.h1}>Helix Frame <span style={{color:user==='Tushar'?T:D,fontSize:'1rem'}}>· {user}</span></div>
          <div style={S.sub}>INTERNAL FINANCE · 50 / 50 PARTNERSHIP</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
          <div style={{fontSize:'0.6rem',letterSpacing:'0.15em',display:'flex',alignItems:'center',gap:6,color:online?'#7fff72':'#e74c3c'}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:online?'#7fff72':'#e74c3c',animation:saving?'pulse 0.8s infinite':'pulse 3s infinite'}}/>
            {saving?'SAVING…':online?`LIVE · ${lastSync||''}`:'OFFLINE'}
          </div>
          <button style={{...S.btnGhost,fontSize:'0.55rem',color:'#aaa',borderColor:'#333'}} onClick={()=>{localStorage.removeItem('hf-user');setUser(null)}}>Switch user</button>
        </div>
      </div>

      {/* TABS */}
      <div style={S.tabs}>
        {Object.keys(months).map(m=><button key={m} style={S.tab(m===active)} onClick={()=>setActive(m)}>{m}</button>)}
        <button style={S.tab(false)} onClick={addMonth}>+ NEW MONTH</button>
      </div>

      {/* SUMMARY CARDS */}
      <div style={S.cards}>
        {[
          {lbl:'Total Expenses',val:fmt(c.tot),col:null,sub:'Combined studio costs'},
          {lbl:'Tushar Paid',val:fmt(c.tP),col:T,sub:`Fair share ${fmt(c.sh)} · ${c.tP>=c.sh?`over ${fmt(c.tP-c.sh)}`:`under ${fmt(c.sh-c.tP)}`}`},
          {lbl:'Dheeraj Paid',val:fmt(c.dP),col:D,sub:`Fair share ${fmt(c.sh)} · ${c.dP>=c.sh?`over ${fmt(c.dP-c.sh)}`:`under ${fmt(c.sh-c.dP)}`}`},
          {lbl:'Total Income',val:fmt(c.totR),col:G,sub:`T: ${fmt(c.tR)} · D: ${fmt(c.dR)}`},
          {lbl:'Net Profit',val:fmt(c.profit),col:GOLD,sub:`${fmt(c.ps)} each (50/50)`},
        ].map(card=>(
          <div key={card.lbl} style={S.card}>
            <div style={S.clbl}>{card.lbl}</div>
            <div style={S.cval(card.col)}>{card.val}</div>
            <div style={S.csub}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* SETTLEMENT */}
      <div style={S.settle}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1rem',fontStyle:'italic'}}>
            <strong style={{fontStyle:'normal',color:scf}}>{sfrom}</strong>{' pays '}
            <strong style={{fontStyle:'normal',color:sct}}>{sto}</strong>{' to settle this month'}
          </div>
          <div style={{fontSize:'0.58rem',opacity:0.4,marginTop:5,letterSpacing:'0.15em'}}>Balances expense overpay + income received difference</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={S.sAmt}>{fmt(c.s.amt)}</div>
          <div style={S.sDir}>{sfrom.toUpperCase()} → {sto.toUpperCase()}</div>
        </div>
      </div>

      {/* EXPENSE PANELS */}
      <div style={S.secLbl}>Expenses by Partner <span style={{flex:1,height:1,background:'#d8d5cc'}}/></div>
      <div style={{...S.twoCol}}>
        {[{who:'T',name:'Tushar',exps:tE,paid:c.tP},{who:'D',name:'Dheeraj',exps:dE,paid:c.dP}].map(p=>(
          <div key={p.who} style={{background:'#f5f2eb'}}>
            <div style={S.panelH(p.who)}>
              <div style={S.panelT(p.who)}>{p.name}</div>
              <span style={{fontSize:'0.58rem',color:p.who==='T'?T:D,background:'#fff',padding:'2px 8px'}}>{p.exps.length} items</span>
            </div>
            {p.exps.length===0&&<div style={{padding:'1.5rem',fontSize:'0.65rem',color:'#bbb'}}>No expenses yet.</div>}
            {p.exps.map(e=><ExpRow key={e.id} e={e} who={p.who}/>)}
            <div style={S.pTotal}>
              <span style={{fontSize:'0.6rem',letterSpacing:'0.2em',color:'#7a7870'}}>TOTAL PAID</span>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:'1.2rem',fontWeight:700,color:p.who==='T'?T:D}}>{fmt(p.paid)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ADD BUTTON */}
      <div style={{margin:'1rem 1.5rem 0'}}>
        <button style={{...S.btnDark,width:'100%',padding:'0.85rem',textAlign:'left',display:'flex',justifyContent:'space-between'}} onClick={openAdd}>
          <span>+ ADD EXPENSE</span><span>→</span>
        </button>
      </div>

      {/* INCOME */}
      <div style={S.secLbl}>Income Received <span style={{flex:1,height:1,background:'#d8d5cc'}}/></div>
      <div style={S.incGrid}>
        {[{who:'Tushar',val:c.tR,col:T,id:'tInc'},{who:'Dheeraj',val:c.dR,col:D,id:'dInc'}].map(p=>(
          <div key={p.who} style={S.incCard}>
            <div style={S.incLbl}>{p.who.toUpperCase()} RECEIVED</div>
            <div style={S.incVal(p.col)}>{fmt(p.val)}</div>
            <div style={{fontSize:'0.58rem',color:'#7a7870',marginTop:3}}>From clients / projects</div>
            <div style={{display:'flex',gap:6,marginTop:8,alignItems:'center'}}>
              <input id={p.id} type="number" defaultValue={p.val||''} placeholder="Enter amount"
                style={{background:'#eceae0',border:'1px solid #d8d5cc',padding:'5px 8px',fontFamily:"'DM Mono',monospace",fontSize:'0.7rem',color:'#1a1a18',width:120,outline:'none'}}/>
              <button style={{...S.btnDark,padding:'5px 10px',fontSize:'0.6rem'}} onClick={()=>setIncome(p.who,document.getElementById(p.id).value)}>SET</button>
              <button style={{...S.btnGhost,padding:'5px 8px',fontSize:'0.6rem'}} onClick={()=>setIncome(p.who,0)}>Reset</button>
            </div>
          </div>
        ))}
        <div style={S.incCard}>
          <div style={S.incLbl}>TOTAL STUDIO INCOME</div>
          <div style={S.incVal()}>{fmt(c.totR)}</div>
          <div style={{fontSize:'0.58rem',color:'#7a7870',marginTop:3}}>Combined</div>
        </div>
        <div style={S.incCard}>
          <div style={S.incLbl}>NET PROFIT</div>
          <div style={S.incVal(G)}>{fmt(c.profit)}</div>
          <div style={{fontSize:'0.58rem',color:'#7a7870',marginTop:3}}>After expenses · {fmt(c.ps)} each</div>
        </div>
      </div>

      {/* PROFIT BREAKDOWN */}
      <div style={S.secLbl}>Final Account Breakdown <span style={{flex:1,height:1,background:'#d8d5cc'}}/></div>
      <div style={S.profGrid}>
        {[{name:'Tushar',paid:c.tP,rec:c.tR,col:T},{name:'Dheeraj',paid:c.dP,rec:c.dR,col:D}].map(p=>(
          <div key={p.name} style={S.profCard}>
            <div style={{fontSize:'0.58rem',letterSpacing:'0.25em',color:'#7a7870',marginBottom:'0.8rem'}}>{p.name.toUpperCase()}</div>
            {pbr('Expenses paid',fmt(p.paid),p.col)}
            {pbr('Fair share of expenses',fmt(c.sh))}
            {pbr('Expense difference',(p.paid>=c.sh?'+':'-')+fmt(Math.abs(p.paid-c.sh)),p.paid>=c.sh?G:RED)}
            {pbr('Income received',fmt(p.rec),p.col)}
            {pbr('Profit share (50%)',fmt(c.ps),G)}
            <div style={{...S.pbRow,fontWeight:500,fontSize:'0.72rem',borderBottom:'none'}}>
              <span style={{color:'#7a7870'}}>Should receive total</span>
              <span style={{color:G}}>{fmt(c.sh+c.ps)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div style={{margin:'1.5rem',paddingTop:'1rem',borderTop:'1px solid #d8d5cc',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem'}}>
        <p style={{fontSize:'0.58rem',color:'#7a7870',letterSpacing:'0.15em'}}>Helix Frame · 50/50 · Firebase Live Sync · INR</p>
        <div style={{display:'flex',gap:8}}>
          <button style={{...S.btnGhost,fontSize:'0.6rem'}} onClick={deleteMonth}>🗑 Delete Month</button>
          <button style={{...S.btnGhost,fontSize:'0.6rem'}} onClick={exportCSV}>↓ Export CSV</button>
        </div>
      </div>

      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}*{box-sizing:border-box;}@media(max-width:640px){}`}</style>
    </div>
  )
}
