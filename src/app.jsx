import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBx1PRfUQkrjSMrSBUmsPkf1jNdtKUaCgg",
  authDomain: "fc-ballocha.firebaseapp.com",
  projectId: "fc-ballocha",
  storageBucket: "fc-ballocha.firebasestorage.app",
  messagingSenderId: "161757969314",
  appId: "1:161757969314:web:694766bb5f5d7025f7d0fb"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const DUES_PER_MONTH = 10000;
const INITIAL_BALANCE = 1086802;
const ADMIN_PW = "2351";

const ALL_MEMBERS = [
  { id: 1,  name: "유준호", phone: "010-5116-2351", role: "총무", payType: "auto"   },
  { id: 2,  name: "차민환", phone: "010-2619-7932", role: "회장", payType: "manual" },
  { id: 3,  name: "구본영", phone: "010-6273-8070", role: "",     payType: "manual" },
  { id: 4,  name: "권일혁", phone: "010-2205-8872", role: "",     payType: "auto"   },
  { id: 5,  name: "김선진", phone: "010-3768-7966", role: "",     payType: "manual" },
  { id: 6,  name: "김재성", phone: "010-3511-2946", role: "",     payType: "auto"   },
  { id: 7,  name: "김진형", phone: "010-6216-4495", role: "",     payType: "manual" },
  { id: 8,  name: "김창섭", phone: "010-6576-8826", role: "",     payType: "manual" },
  { id: 9,  name: "김현수", phone: "010-5020-4890", role: "",     payType: "auto"   },
  { id: 10, name: "신은수", phone: "010-9123-0164", role: "",     payType: "auto"   },
  { id: 11, name: "안재준", phone: "010-9942-1024", role: "",     payType: "auto"   },
  { id: 12, name: "전민규", phone: "010-9717-9533", role: "",     payType: "manual" },
  { id: 13, name: "조바른", phone: "010-3654-1433", role: "",     payType: "manual" },
  { id: 14, name: "최규영", phone: "010-9799-4939", role: "",     payType: "auto"   },
  { id: 15, name: "최덕성", phone: "010-2567-4981", role: "",     payType: "manual" },
  { id: 16, name: "최재원", phone: "010-5195-5296", role: "",     payType: "manual" },
  { id: 17, name: "한석현", phone: "010-9088-8133", role: "",     payType: "manual" },
  { id: 18, name: "허완",   phone: "010-6416-2403", role: "",     payType: "auto"   },
];

const TAG_OPTIONS = [
  { label: "⚽ 축구",   color: "#4ade80" },
  { label: "💍 경사",   color: "#facc15" },
  { label: "🍺 소모임", color: "#60a5fa" },
  { label: "🏕️ MT",    color: "#f97316" },
];

const INIT_SCHEDULES = [
  { id: 1, month: 3, day: 28, title: "한석현 청모겸 MT", sub: "", tag: "🏕️ MT",   tagColor: "#f97316" },
  { id: 2, month: 4, day: 11, title: "한석현 결혼식",    sub: "", tag: "💍 경사", tagColor: "#facc15" },
];

function initPayments() {
  const p = {};
  const cur = new Date().getMonth();
  ALL_MEMBERS.forEach(m => {
    p[m.id] = {};
    MONTHS.forEach((_, i) => { p[m.id][i] = m.payType === "auto" && i <= cur; });
  });
  return p;
}

function catColor(cat) {
  return { "경조사": "#7c3aed", "소모임": "#0891b2", "축구": "#059669", "기타": "#6b7280" }[cat] || "#6b7280";
}

const inp = {
  background: "#0b0e14", border: "1px solid #1e2535",
  color: "#e5e7eb", borderRadius: 10, padding: "12px 14px",
  fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box",
};

export default function App() {
  const [tab, setTab]             = useState("dues");
  const [screen, setScreen]       = useState("main");
  const [payments, setPayments]   = useState(initPayments);
  const [expenses, setExpenses]   = useState([]);
  const [schedules, setSchedules] = useState(INIT_SCHEDULES);
  const [showAll, setShowAll]     = useState(false);
  const [showAdd, setShowAdd]     = useState(false);
  const [selMonth, setSelMonth]   = useState(new Date().getMonth());
  const [newExp, setNewExp]       = useState({ date: "", category: "경조사", desc: "", amount: "" });
  const [newEv, setNewEv]         = useState({ month: "", day: "", title: "", sub: "", tag: "⚽ 축구", tagColor: "#4ade80" });
  const [loading, setLoading]     = useState(true);
  const [isAdmin, setIsAdmin]     = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [pwInput, setPwInput]     = useState("");
  const [pwError, setPwError]     = useState(false);

  useEffect(() => {
    const ref = doc(db, "fc-ballocha", "data");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.payments)  setPayments(d.payments);
        if (d.expenses)  setExpenses(d.expenses);
        if (d.schedules) setSchedules(d.schedules);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const save = (updates) => setDoc(doc(db, "fc-ballocha", "data"), updates, { merge: true }).catch(console.error);

  const togglePayment = (mid, mi) => {
    if (!isAdmin) return;
    const updated = { ...payments, [mid]: { ...payments[mid], [mi]: !payments[mid][mi] } };
    setPayments(updated); save({ payments: updated });
  };

  const addExpense = () => {
    if (!newExp.date || !newExp.desc || !newExp.amount) return;
    const updated = [...expenses, { ...newExp, id: Date.now(), amount: parseInt(newExp.amount) }];
    setExpenses(updated); save({ expenses: updated });
    setNewExp({ date: "", category: "경조사", desc: "", amount: "" });
  };

  const deleteExpense = (id) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated); save({ expenses: updated });
  };

  const addSchedule = () => {
    if (!newEv.month || !newEv.day || !newEv.title) return;
    const updated = [...schedules, { ...newEv, id: Date.now(), month: parseInt(newEv.month), day: parseInt(newEv.day) }];
    setSchedules(updated); save({ schedules: updated });
    setNewEv({ month: "", day: "", title: "", sub: "", tag: "⚽ 축구", tagColor: "#4ade80" });
    setShowAdd(false);
  };

  const deleteSchedule = (id) => {
    const updated = schedules.filter(s => s.id !== id);
    setSchedules(updated); save({ schedules: updated });
  };

  const handleAdminLogin = () => {
    if (pwInput === ADMIN_PW) { setIsAdmin(true); setShowAdminModal(false); setPwInput(""); setPwError(false); }
    else setPwError(true);
  };

  const unpaidCount = (mi) => ALL_MEMBERS.filter(m => !payments[m.id]?.[mi]).length;
  const autoMembers = ALL_MEMBERS.filter(m => m.payType === "auto");
  const unpaidNames = ALL_MEMBERS.filter(m => !payments[m.id]?.[new Date().getMonth()]).map(m => m.name);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalCollected = ALL_MEMBERS.reduce((sum, m) => sum + MONTHS.filter((_, i) => payments[m.id]?.[i]).length * DUES_PER_MONTH, 0);
  const balance = INITIAL_BALANCE + totalCollected - totalExpenses;
  const recentExpenses = [...expenses].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0b0e14", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
     
      <div style={{ fontFamily:"'Black Han Sans',sans-serif", fontSize:32, color:"#facc15" }}>FC발로차</div>
      <div style={{ fontSize:14, color:"#4b5563" }}>데이터 불러오는 중...</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0b0e14", color:"#e5e7eb", fontFamily:"'Noto Sans KR',sans-serif" }}>
  
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        .fade { animation: fadeUp 0.25s ease; }
        .slide { animation: slideIn 0.25s ease; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input, select, button { font-family: 'Noto Sans KR', sans-serif; }
      `}</style>

      {screen === "main" ? (
        <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh" }}>

          {/* 헤더 */}
          <div style={{ padding:"52px 20px 0", background:"linear-gradient(180deg,#0f1420 0%,#0b0e14 100%)" }}>
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontFamily:"'Black Han Sans',sans-serif", fontSize:34, color:"#facc15", lineHeight:1.1 }}>FC발로차</div>
                <div style={{ fontSize:13, color:"#4b5563", marginTop:4, letterSpacing:"1.5px" }}>SINCE 2010 · 18명</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                <div style={{ background:"rgba(250,204,21,0.1)", border:"1px solid rgba(250,204,21,0.2)", borderRadius:20, padding:"6px 14px", fontSize:13, color:"#facc15", fontWeight:700 }}>2026</div>
                {isAdmin && <div style={{ fontSize:11, color:"#4ade80", background:"rgba(74,222,128,0.1)", borderRadius:10, padding:"3px 10px" }}>🔑 관리자</div>}
              </div>
            </div>
            <div style={{ display:"flex", gap:4, background:"#141820", borderRadius:16, padding:5 }}>
              {[{key:"dues",icon:"💰",label:"회비"},{key:"schedule",icon:"📅",label:"일정"},{key:"members",icon:"👥",label:"멤버"}].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{ flex:1, background:tab===t.key?"#facc15":"none", border:"none", borderRadius:12, padding:"10px 0", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                  <span style={{ fontSize:20 }}>{t.icon}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:tab===t.key?"#0b0e14":"#4b5563" }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 컨텐츠 */}
          <div style={{ flex:1, padding:"20px 20px 100px" }}>

            {tab==="dues" && (
              <div className="fade">
                <div onClick={() => setScreen("dues_detail")} style={{ background:"linear-gradient(135deg,#1a1f2e,#141820)", border:"1px solid rgba(250,204,21,0.2)", borderRadius:20, padding:"24px", marginBottom:16, cursor:"pointer", position:"relative" }}>
                  <div style={{ position:"absolute", top:16, right:16, fontSize:12, color:"rgba(250,204,21,0.5)", fontWeight:600 }}>상세보기 →</div>
                  <div style={{ fontSize:13, color:"#6b7280", marginBottom:8 }}>현재 잔액</div>
                  <div style={{ fontSize:38, fontWeight:900, color:"#facc15", letterSpacing:"-1px", lineHeight:1 }}>{balance.toLocaleString()}<span style={{ fontSize:18, marginLeft:3 }}>원</span></div>
                  <div style={{ marginTop:16 }}>
                    <div style={{ fontSize:12, color:"#6b7280" }}>2026 지출</div>
                    <div style={{ fontSize:16, fontWeight:700, color:"#f87171", marginTop:2 }}>{totalExpenses.toLocaleString()}원</div>
                  </div>
                </div>

                <div style={{ background:"#141820", border:"1px solid #1e2535", borderRadius:18, padding:"18px", marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                    <span style={{ fontSize:16, fontWeight:700 }}>{MONTHS[new Date().getMonth()]} 납부 현황</span>
                    <span style={{ fontSize:14, color:"#ef4444", fontWeight:700 }}>미납 {unpaidCount(new Date().getMonth())}명</span>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {autoMembers.map(m => <div key={m.id} style={{ background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)", borderRadius:20, padding:"5px 13px", fontSize:13, color:"#4ade80" }}>{m.name}</div>)}
                    {unpaidNames.slice(0,3).map(n => <div key={n} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:20, padding:"5px 13px", fontSize:13, color:"#f87171" }}>{n}</div>)}
                    {unpaidNames.length > 3 && <div style={{ background:"#1e2535", borderRadius:20, padding:"5px 13px", fontSize:13, color:"#6b7280" }}>+{unpaidNames.length-3}명</div>}
                  </div>
                </div>

                <div style={{ background:"#141820", border:"1px solid #1e2535", borderRadius:18, padding:"18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                    <span style={{ fontSize:16, fontWeight:700 }}>최근 지출</span>
                    <span onClick={() => setScreen("dues_detail")} style={{ fontSize:13, color:"#facc15", cursor:"pointer" }}>전체보기 →</span>
                  </div>
                  {recentExpenses.length === 0
                    ? <div style={{ fontSize:14, color:"#4b5563", textAlign:"center", padding:"16px 0" }}>2026년 지출 내역이 없어요</div>
                    : recentExpenses.map(e => (
                      <div key={e.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #1e2535" }}>
                        <div style={{ background:catColor(e.category), borderRadius:6, padding:"3px 8px", fontSize:12, fontWeight:600, color:"#fff", flexShrink:0 }}>{e.category}</div>
                        <div style={{ flex:1, fontSize:14 }}>{e.desc}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#f87171" }}>-{e.amount.toLocaleString()}원</div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {tab==="schedule" && (
              <div className="fade">
                <div style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>다가오는 일정</div>
                {[...schedules].sort((a,b) => a.month*100+a.day-(b.month*100+b.day)).map(e => (
                  <div key={e.id} style={{ background:"#141820", border:"1px solid #1e2535", borderRadius:16, padding:"16px", marginBottom:10, display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ width:50, height:50, background:"#1e2535", borderRadius:14, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <div style={{ fontSize:16, fontWeight:900, lineHeight:1 }}>{e.day}</div>
                      <div style={{ fontSize:11, color:"#6b7280" }}>{e.month}월</div>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:700 }}>{e.title}</div>
                      {e.sub && <div style={{ fontSize:13, color:"#6b7280", marginTop:3 }}>{e.sub}</div>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ fontSize:12, fontWeight:600, background:"rgba(255,255,255,0.05)", borderRadius:8, padding:"4px 10px", color:e.tagColor }}>{e.tag}</div>
                      {isAdmin && <button onClick={() => deleteSchedule(e.id)} style={{ background:"none", border:"none", color:"#374151", cursor:"pointer", fontSize:18 }}>×</button>}
                    </div>
                  </div>
                ))}
                {schedules.length === 0 && <div style={{ fontSize:14, color:"#4b5563", textAlign:"center", padding:"24px 0" }}>등록된 일정이 없어요</div>}
                {isAdmin && (
                  <button onClick={() => setShowAdd(true)} style={{ width:"100%", background:"rgba(250,204,21,0.08)", border:"1px dashed rgba(250,204,21,0.3)", borderRadius:16, padding:"14px", color:"#facc15", fontSize:15, fontWeight:600, cursor:"pointer", marginTop:8 }}>+ 일정 추가</button>
                )}
                {showAdd && (
                  <div onClick={() => setShowAdd(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"flex-end", zIndex:200 }}>
                    <div onClick={e => e.stopPropagation()} style={{ width:"100%", background:"#141820", borderRadius:"24px 24px 0 0", padding:"28px 20px 40px" }}>
                      <div style={{ fontSize:18, fontWeight:700, marginBottom:18 }}>일정 추가</div>
                      <div style={{ display:"flex", gap:10, marginBottom:12 }}>
                        <input type="number" placeholder="월" value={newEv.month} onChange={e => setNewEv(p=>({...p,month:e.target.value}))} style={{...inp, width:70, textAlign:"center"}}/>
                        <input type="number" placeholder="일" value={newEv.day} onChange={e => setNewEv(p=>({...p,day:e.target.value}))} style={{...inp, width:70, textAlign:"center"}}/>
                        <input placeholder="제목" value={newEv.title} onChange={e => setNewEv(p=>({...p,title:e.target.value}))} style={{...inp, flex:1}}/>
                      </div>
                      <input placeholder="메모 (선택)" value={newEv.sub} onChange={e => setNewEv(p=>({...p,sub:e.target.value}))} style={{...inp, marginBottom:12}}/>
                      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
                        {TAG_OPTIONS.map(t => (
                          <button key={t.label} onClick={() => setNewEv(p=>({...p,tag:t.label,tagColor:t.color}))} style={{ flex:1, background:newEv.tag===t.label?"rgba(255,255,255,0.08)":"none", border:`1px solid ${newEv.tag===t.label?t.color:"#1e2535"}`, borderRadius:10, padding:"8px 0", color:t.color, fontSize:11, fontWeight:600, cursor:"pointer" }}>{t.label}</button>
                        ))}
                      </div>
                      <button onClick={addSchedule} style={{ width:"100%", background:"#facc15", border:"none", borderRadius:14, padding:"16px", color:"#0b0e14", fontSize:16, fontWeight:700, cursor:"pointer" }}>추가하기</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab==="members" && (
              <div className="fade">
                <div style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>전체 멤버 · 18명</div>
                {ALL_MEMBERS.slice(0, showAll?18:5).map((m,i) => (
                  <div key={i} style={{ background:"#141820", border:"1px solid #1e2535", borderRadius:16, padding:"14px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#1e2535,#2a3245)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color:"#facc15", flexShrink:0 }}>{m.name[0]}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span style={{ fontSize:16, fontWeight:700 }}>{m.name}</span>
                        {m.role && <span style={{ fontSize:11, background:"rgba(250,204,21,0.1)", color:"#facc15", borderRadius:5, padding:"2px 7px", fontWeight:700 }}>{m.role}</span>}
                      </div>
                      <div style={{ fontSize:13, color:"#4b5563", marginTop:3 }}>{m.phone}</div>
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, color:m.payType==="auto"?"#4ade80":"#6b7280", background:m.payType==="auto"?"rgba(74,222,128,0.1)":"#1e2535", borderRadius:8, padding:"4px 10px" }}>{m.payType==="auto"?"자동":"수동"}이체</div>
                  </div>
                ))}
                <button onClick={() => setShowAll(p=>!p)} style={{ width:"100%", background:"none", border:"1px solid #1e2535", borderRadius:14, padding:"13px", color:"#6b7280", fontSize:14, fontWeight:600, cursor:"pointer", marginTop:4 }}>
                  {showAll?"▲ 접기":"▼ +13명 더보기"}
                </button>
              </div>
            )}
          </div>

          {/* Admin 버튼 */}
          <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:"12px 20px 32px", background:"linear-gradient(180deg,transparent,#0b0e14 50%)", display:"flex", justifyContent:"center" }}>
            <button onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminModal(true)} style={{ background:isAdmin?"rgba(74,222,128,0.1)":"rgba(255,255,255,0.04)", border:`1px solid ${isAdmin?"rgba(74,222,128,0.3)":"rgba(255,255,255,0.08)"}`, borderRadius:20, padding:"9px 24px", color:isAdmin?"#4ade80":"#374151", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              {isAdmin?"🔑 관리자 모드 종료":"ADMIN"}
            </button>
          </div>
        </div>

      ) : (
        <div className="slide" style={{ display:"flex", flexDirection:"column", minHeight:"100vh" }}>
          <div style={{ padding:"52px 20px 16px", background:"#0f1420", borderBottom:"1px solid #1e2535" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <button onClick={() => setScreen("main")} style={{ background:"#1e2535", border:"none", color:"#e5e7eb", borderRadius:12, width:40, height:40, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
              <div>
                <div style={{ fontSize:20, fontWeight:700 }}>회비 상세</div>
                <div style={{ fontSize:13, color:"#4b5563", marginTop:2 }}>잔액 <span style={{ color:"#facc15", fontWeight:700 }}>{balance.toLocaleString()}원</span></div>
              </div>
            </div>
          </div>

          <div style={{ flex:1, padding:"20px 20px 60px" }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:18 }}>
              {MONTHS.map((m,i) => (
                <button key={i} onClick={() => setSelMonth(i)} style={{ background:selMonth===i?"#facc15":"#141820", border:`1px solid ${selMonth===i?"#facc15":"#1e2535"}`, color:selMonth===i?"#0b0e14":"#6b7280", borderRadius:20, padding:"6px 13px", fontSize:13, cursor:"pointer", fontWeight:selMonth===i?700:400, position:"relative" }}>
                  {m}
                  {unpaidCount(i)>0 && <span style={{ position:"absolute", top:-4, right:-4, background:"#ef4444", color:"white", borderRadius:"50%", width:15, height:15, fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{unpaidCount(i)}</span>}
                </button>
              ))}
            </div>

            <div style={{ background:"#141820", border:"1px solid #1e2535", borderRadius:14, padding:"12px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:15, color:"#9ca3af" }}>{MONTHS[selMonth]} 미납</span>
              <span style={{ fontSize:16, fontWeight:700, color:"#ef4444" }}>{unpaidCount(selMonth)}명</span>
            </div>

            {ALL_MEMBERS.map(m => {
              const paid = payments[m.id]?.[selMonth];
              return (
                <div key={m.id} style={{ display:"flex", alignItems:"center", background:"#141820", border:`1px solid ${paid?"rgba(250,204,21,0.2)":"#1e2535"}`, borderRadius:12, padding:"13px 16px", marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:16, fontWeight:600, color:paid?"#facc15":"#d1d5db" }}>{m.name}</div>
                    <div style={{ fontSize:12, color:m.payType==="auto"?"#4ade80":"#6b7280", marginTop:2 }}>{m.payType==="auto"?"자동이체":"수동"}</div>
                  </div>
                  {isAdmin
                    ? <button onClick={() => togglePayment(m.id, selMonth)} style={{ background:paid?"rgba(250,204,21,0.15)":"#1e2535", border:`1px solid ${paid?"#facc15":"#374151"}`, color:paid?"#facc15":"#6b7280", borderRadius:10, padding:"8px 18px", fontSize:14, cursor:"pointer", fontWeight:600 }}>{paid?"✓ 납부":"미납"}</button>
                    : <div style={{ fontSize:14, fontWeight:600, color:paid?"#facc15":"#6b7280" }}>{paid?"✓ 납부":"미납"}</div>
                  }
                </div>
              );
            })}

            <div style={{ height:1, background:"#1e2535", margin:"24px 0" }}/>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>지출 내역</div>

            {isAdmin && (
              <div style={{ background:"#141820", border:"1px solid #1e2535", borderRadius:16, padding:"16px", marginBottom:16 }}>
                <div style={{ fontSize:13, color:"#facc15", fontWeight:600, marginBottom:12 }}>+ 지출 추가</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                  <input type="date" value={newExp.date} onChange={e => setNewExp(p=>({...p,date:e.target.value}))} style={inp}/>
                  <select value={newExp.category} onChange={e => setNewExp(p=>({...p,category:e.target.value}))} style={{...inp, appearance:"none"}}>
                    {["경조사","소모임","축구","기타"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <input placeholder="내용" value={newExp.desc} onChange={e => setNewExp(p=>({...p,desc:e.target.value}))} style={{...inp, marginBottom:10}}/>
                <div style={{ display:"flex", gap:10 }}>
                  <input placeholder="금액 (원)" type="number" value={newExp.amount} onChange={e => setNewExp(p=>({...p,amount:e.target.value}))} style={{...inp}}/>
                  <button onClick={addExpense} style={{ background:"#facc15", border:"none", color:"#0b0e14", borderRadius:10, padding:"0 20px", fontSize:15, cursor:"pointer", fontWeight:700, whiteSpace:"nowrap" }}>추가</button>
                </div>
              </div>
            )}

            {expenses.length === 0
              ? <div style={{ fontSize:14, color:"#4b5563", textAlign:"center", padding:"20px 0" }}>지출 내역이 없어요</div>
              : [...expenses].sort((a,b)=>b.date.localeCompare(a.date)).map(e => (
                <div key={e.id} style={{ background:"#141820", border:"1px solid #1e2535", borderRadius:12, padding:"14px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ background:catColor(e.category), borderRadius:6, padding:"4px 9px", fontSize:12, fontWeight:600, color:"#fff", flexShrink:0 }}>{e.category}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:600 }}>{e.desc}</div>
                    <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>{e.date}</div>
                  </div>
                  <div style={{ fontSize:15, fontWeight:700, color:"#f87171" }}>-{e.amount.toLocaleString()}원</div>
                  {isAdmin && <button onClick={() => deleteExpense(e.id)} style={{ background:"none", border:"none", color:"#374151", cursor:"pointer", fontSize:18 }}>×</button>}
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* 관리자 비밀번호 모달 */}
      {showAdminModal && (
        <div onClick={() => { setShowAdminModal(false); setPwInput(""); setPwError(false); }} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"flex-end", zIndex:300 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", background:"#141820", borderRadius:"24px 24px 0 0", padding:"28px 20px 40px" }}>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:6 }}>관리자 로그인</div>
            <div style={{ fontSize:13, color:"#6b7280", marginBottom:20 }}>비밀번호를 입력하세요</div>
            <input type="password" placeholder="비밀번호" value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false); }}
              onKeyDown={e => e.key==="Enter" && handleAdminLogin()}
              style={{...inp, marginBottom:10, borderColor:pwError?"#ef4444":"#1e2535", fontSize:20, letterSpacing:6}}
              autoFocus
            />
            {pwError && <div style={{ fontSize:13, color:"#ef4444", marginBottom:10 }}>비밀번호가 틀렸어요</div>}
            <button onClick={handleAdminLogin} style={{ width:"100%", background:"#facc15", border:"none", borderRadius:14, padding:"16px", color:"#0b0e14", fontSize:16, fontWeight:700, cursor:"pointer" }}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}
