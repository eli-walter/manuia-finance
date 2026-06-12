// File location: src/App.jsx
import { useState, useEffect } from "react";
import { db, isFirebaseConfigured } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  COLUMNS as BINGO_COLS,
  letterFor as getLetterForNum,
  drawBall,
  announce as speakCall,
  cancelAnnounce,
} from "./bingoEngine";
import {
  LayoutDashboard, Users, Gamepad2, History, Volume2,
  Plus, X, Search, ChevronRight, Trophy,
  Check, Star, DollarSign
} from "lucide-react";

/* ══════════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════════ */
const uid = () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
const $$ = (n) => `$${Math.abs(Number(n)).toFixed(2)}`;
const dShort = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/* ══════════════════════════════════════════════════════
   STORAGE
══════════════════════════════════════════════════════ */
const SK = { P: "ba-players-v1", T: "ba-txns-v1", G: "ba-games-v1" };
// Storage: Firebase Firestore when configured, localStorage as offline fallback
const FS_DOC = "manuia-admin";
const sget = async (k) => {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, "manuia", FS_DOC, "store", k));
      if (snap.exists()) return JSON.parse(snap.data().v);
    } catch {}
  }
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; }
};
const sset = async (k, v) => {
  const json = JSON.stringify(v);
  if (isFirebaseConfigured && db) {
    try { await setDoc(doc(db, "manuia", FS_DOC, "store", k), { v: json, t: Date.now() }); }
    catch {}
  }
  try { localStorage.setItem(k, json); } catch {}
};


/* ══════════════════════════════════════════════════════
   BINGO CALLER — CONSTANTS (imported from bingoEngine.js)
══════════════════════════════════════════════════════ */
// BINGO_COLS, getLetterForNum, speakCall → all from ./bingoEngine
const CALLER_SK = "mf-caller-v1";

/* ══════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════ */
const C = {
  bg: "#F0F4F8",
  surface: "#FFFFFF",
  surfaceHi: "#EDF2F7",
  border: "#CBD5E0",
  coral: "#D94325",
  coralDim: "rgba(217,67,37,0.10)",
  gold: "#B87000",
  goldDim: "rgba(184,112,0,0.10)",
  teal: "#007A65",
  tealDim: "rgba(0,122,101,0.10)",
  text: "#1A202C",
  muted: "#4A5568",
  win: "#1A6E35",
  winDim: "rgba(26,110,53,0.10)",
  danger: "#B52B2B",
  dangerDim: "rgba(181,43,43,0.10)",
  shadow: "0 4px 24px rgba(0,0,0,0.10)",
  shadowSm: "0 2px 10px rgba(0,0,0,0.07)",
};

const FONT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Nunito:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; color: ${C.text}; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
  input, select, textarea, button { font-family: 'Nunito', sans-serif; }
  .slide-up { animation: slideUp 0.25s ease; }
  @keyframes slideUp { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }
  .fade-in { animation: fadeIn 0.2s ease; }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
`;

/* ══════════════════════════════════════════════════════
   SHARED UI COMPONENTS
══════════════════════════════════════════════════════ */
function Btn({ children, onClick, variant = "coral", sm = false, full = false, disabled = false }) {
  const pad = sm ? "8px 14px" : "13px 20px";
  const fs = sm ? 13 : 14;
  const variants = {
    coral: { background: C.coral, color: "#fff" },
    gold: { background: C.gold, color: "#FFFFFF" },
    teal: { background: C.teal, color: "#FFFFFF" },
    ghost: { background: "transparent", color: C.text, border: `1.5px solid ${C.border}` },
    danger: { background: C.danger, color: "#fff" },
    surface: { background: C.surfaceHi, color: C.text },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: pad, fontSize: fs, fontWeight: 700, borderRadius: 12, border: "none",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
        width: full ? "100%" : "auto", transition: "opacity 0.15s",
        ...variants[variant],
      }}
    >
      {children}
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, background: "rgba(30,40,60,0.55)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div className="slide-up" style={{ background: C.surface, borderRadius: "22px 22px 0 0", width: "100%", maxWidth: 480, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
          <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: 17, fontWeight: 800, color: C.text }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 4 }}><X size={20} /></button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "20px" }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.6px" }}>{label}</label>
      {children}
    </div>
  );
}

function Inp({ value, onChange, placeholder, type = "text", ...rest }) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} type={type}
      style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: C.surfaceHi, outline: "none", fontWeight: 500 }}
      {...rest} />
  );
}

function Badge({ children, color = "coral" }) {
  const map = {
    coral: { bg: C.coralDim, c: C.coral },
    gold: { bg: C.goldDim, c: C.gold },
    teal: { bg: C.tealDim, c: C.teal },
    win: { bg: C.winDim, c: C.win },
    danger: { bg: C.dangerDim, c: C.danger },
    muted: { bg: C.border, c: C.muted },
  };
  const s = map[color] || map.coral;
  return <span style={{ background: s.bg, color: s.c, fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, letterSpacing: "0.4px", textTransform: "uppercase" }}>{children}</span>;
}

function TxnRow({ txn, playerName }) {
  const pos = txn.amount > 0;
  const typeMap = { PAYMENT: "Payment", BUY_IN: "Buy In", WIN: "Winner 🏆", TP: "Bonus Prize" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: pos ? C.winDim : C.dangerDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
        {pos ? "↑" : "↓"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {playerName && <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 1 }}>{playerName}</p>}
        <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 1 }}>{typeMap[txn.type] || txn.type}</p>
        <p style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{txn.note || "No note"}</p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: pos ? C.win : C.danger }}>{pos ? "+" : "-"}{$$(txn.amount)}</p>
        <p style={{ fontSize: 11, color: C.muted }}>{dShort(txn.createdAt)}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════════════ */
function Nav({ tab, setTab }) {
  const tabs = [
    { id: "dashboard", Icon: LayoutDashboard, label: "Home" },
    { id: "players", Icon: Users, label: "Players" },
    { id: "caller", Icon: Volume2, label: "Caller" },
    { id: "games", Icon: Gamepad2, label: "Games" },
    { id: "history", Icon: History, label: "History" },
  ];
  return (
    <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 50 }}>
      {tabs.map(({ id, Icon, label }) => {
        const active = tab === id;
        return (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, padding: "10px 0 env(safe-area-inset-bottom, 14px)", border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}>
            {active && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 3, background: C.coral, borderRadius: "0 0 4px 4px" }} />}
            <Icon size={21} color={active ? C.coral : C.muted} strokeWidth={active ? 2.5 : 2} />
            <span style={{ fontSize: 10, fontWeight: 700, color: active ? C.coral : C.muted }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ══════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════ */
function Dashboard({ ctx }) {
  const { players, txns, games, setModal } = ctx;
  const totalFunds = players.reduce((s, p) => s + Math.max(0, p.balance), 0);
  const activeGame = games.find((g) => g.status === "active");
  const recentTxns = [...txns].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  const pMap = Object.fromEntries(players.map((p) => [p.id, p.name]));
  const totalGames = games.length;
  const playersWithBalance = players.filter((p) => p.balance > 0).length;

  return (
    <div className="slide-up" style={{ padding: "20px 14px 14px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 3, fontWeight: 600 }}>ADMIN PANEL</p>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 900, color: C.text, lineHeight: 1.1 }}>
          Bingo<span style={{ color: C.coral }}>Admin</span> 🎱
        </h1>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Funds Held", value: $$(totalFunds), color: C.coral, sub: "total balance" },
          { label: "Players", value: `${playersWithBalance}/${players.length}`, color: C.gold, sub: "with credit" },
          { label: "Games", value: totalGames, color: C.teal, sub: "all time" },
        ].map(({ label, value, color, sub }) => (
          <div key={label} style={{ background: C.surface, borderRadius: 14, padding: "12px 10px", border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{label}</p>
            <p style={{ fontFamily: "Syne,sans-serif", fontSize: 16, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setModal({ type: "payment" })}
          style={{ flex: 1, padding: "13px", background: C.coralDim, border: `1.5px solid ${C.coral}`, borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <DollarSign size={15} color={C.coral} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.coral }}>Record Payment</span>
        </button>
        <button onClick={() => setModal({ type: activeGame ? "activeGame" : "newGame", data: activeGame })}
          style={{ flex: 1, padding: "13px", background: activeGame ? C.goldDim : C.tealDim, border: `1.5px solid ${activeGame ? C.gold : C.teal}`, borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Gamepad2 size={15} color={activeGame ? C.gold : C.teal} />
          <span style={{ fontSize: 13, fontWeight: 700, color: activeGame ? C.gold : C.teal }}>{activeGame ? "Manage Game" : "New Game"}</span>
        </button>
      </div>

      {/* Active Game Banner */}
      {activeGame && (
        <div onClick={() => setModal({ type: "activeGame", data: activeGame })}
          style={{ background: `linear-gradient(135deg, ${C.coralDim}, ${C.goldDim})`, border: `1.5px solid ${C.gold}99`, borderRadius: 16, padding: "16px 18px", marginBottom: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.win, display: "inline-block" }} />
              <Badge color="gold">LIVE — Game {activeGame.gameNo}</Badge>
            </div>
            <p style={{ fontFamily: "Syne,sans-serif", fontSize: 15, fontWeight: 800, color: C.text }}>{activeGame.gameName}</p>
            <p style={{ fontSize: 12, color: C.muted }}>Prizes: ${(activeGame.prizes || []).join(" · $")} · {activeGame.participants?.length || 0} players in</p>
          </div>
          <ChevronRight size={18} color={C.gold} />
        </div>
      )}

      {/* Recent Activity */}
      <div style={{ background: C.surface, borderRadius: 16, padding: "16px", border: `1px solid ${C.border}` }}>
        <p style={{ fontFamily: "Syne,sans-serif", fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent Activity</p>
        {recentTxns.length === 0
          ? <p style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "24px 0" }}>No transactions yet</p>
          : recentTxns.map((t) => <TxnRow key={t.id} txn={t} playerName={pMap[t.playerId]} />)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PLAYERS SCREEN
══════════════════════════════════════════════════════ */
function PlayersScreen({ ctx }) {
  const { players, setModal } = ctx;
  const [search, setSearch] = useState("");
  const sorted = [...players]
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.balance - a.balance);
  const totalHeld = players.reduce((s, p) => s + Math.max(0, p.balance), 0);

  return (
    <div className="slide-up" style={{ padding: "20px 14px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 900, color: C.text }}>Players</h1>
        <Btn sm onClick={() => setModal({ type: "addPlayer" })}><Plus size={14} />Add</Btn>
      </div>
      <p style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>{players.length} members · {$$(totalHeld)} total held</p>

      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search players…"
          style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, background: C.surface, color: C.text, outline: "none" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((p, i) => {
          const rank = players.sort((a, b) => b.balance - a.balance).findIndex((x) => x.id === p.id);
          const balColor = p.balance > 100 ? C.win : p.balance > 20 ? C.gold : p.balance > 0 ? C.coral : C.danger;
          return (
            <div key={p.id} onClick={() => setModal({ type: "playerDetail", data: p })}
              style={{ background: C.surface, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", border: `1px solid ${C.border}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: rank < 3 ? C.coralDim : C.surfaceHi, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne,sans-serif", fontWeight: 900, fontSize: 12, color: rank < 3 ? C.coral : C.muted, flexShrink: 0 }}>
                {rank < 3 ? ["🥇", "🥈", "🥉"][rank] : p.name.slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{p.name}</p>
                <p style={{ fontSize: 11, color: C.muted }}>Tap to view history</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: balColor }}>{$$(p.balance)}</p>
                <ChevronRight size={13} color={C.muted} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   GAMES SCREEN
══════════════════════════════════════════════════════ */
function GamesScreen({ ctx }) {
  const { games, setModal } = ctx;
  const active = games.find((g) => g.status === "active");
  const past = games.filter((g) => g.status === "completed").sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  return (
    <div className="slide-up" style={{ padding: "20px 14px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 900, color: C.text }}>Games</h1>
        {!active && <Btn sm onClick={() => setModal({ type: "newGame" })}><Plus size={14} />New Game</Btn>}
      </div>

      {active ? (
        <div onClick={() => setModal({ type: "activeGame", data: active })}
          style={{ background: `linear-gradient(140deg, ${C.tealDim}, ${C.coralDim})`, border: `1.5px solid ${C.teal}99`, borderRadius: 18, padding: 20, marginBottom: 20, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.win, boxShadow: `0 0 8px ${C.win}` }} />
              <Badge color="win">LIVE</Badge>
            </div>
            <ChevronRight size={16} color={C.teal} />
          </div>
          <p style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 4 }}>
            Game {active.gameNo}
          </p>
          <p style={{ fontSize: 14, color: C.teal, fontWeight: 700, marginBottom: 14 }}>{active.gameName} · {active.gameCode}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Prizes", val: `$${(active.prizes || []).join("/$")}` },
              { label: "Players In", val: `${active.participants?.length || 0}` },
              { label: "Per Set", val: `$${active.setCost}` },
            ].map(({ label, val }) => (
              <div key={label} style={{ background: "rgba(0,0,0,0.04)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                <p style={{ fontSize: 10, color: C.muted, marginBottom: 3, textTransform: "uppercase", fontWeight: 700 }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div onClick={() => setModal({ type: "newGame" })}
          style={{ border: `2px dashed ${C.border}`, borderRadius: 16, padding: 36, textAlign: "center", cursor: "pointer", marginBottom: 20 }}>
          <Gamepad2 size={34} color={C.muted} style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: C.muted, marginBottom: 4 }}>No active game</p>
          <p style={{ fontSize: 12, color: C.border }}>Tap to start a new one</p>
        </div>
      )}

      {past.length > 0 && (
        <>
          <p style={{ fontFamily: "Syne,sans-serif", fontSize: 12, fontWeight: 800, color: C.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Past Games</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {past.map((g) => (
              <div key={g.id} style={{ background: C.surface, borderRadius: 14, padding: "14px 16px", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Game {g.gameNo} — {g.gameName}</p>
                  <p style={{ fontSize: 11, color: C.muted }}>{g.participants?.length || 0} players · {dShort(g.completedAt)}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => setModal({ type: "gameReport", data: g })}
                    style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${C.teal}`, background: C.tealDim, color: C.teal, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    📊 Report
                  </button>
                  <Badge color="muted">Done</Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   HISTORY SCREEN
══════════════════════════════════════════════════════ */
function HistoryScreen({ ctx }) {
  const { txns, players } = ctx;
  const [filter, setFilter] = useState("ALL");
  const pMap = Object.fromEntries(players.map((p) => [p.id, p.name]));
  const filterOpts = [
    { id: "ALL", label: "All" },
    { id: "PAYMENT", label: "Payments" },
    { id: "BUY_IN", label: "Buy Ins" },
    { id: "WIN", label: "Wins" },
  ];
  const filtered = [...txns]
    .filter((t) => filter === "ALL" || t.type === filter)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const totalIn = txns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = txns.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="slide-up" style={{ padding: "20px 14px 14px" }}>
      <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 16 }}>History</h1>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        <div style={{ background: C.winDim, border: `1px solid ${C.win}66`, borderRadius: 12, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.win, marginBottom: 4, textTransform: "uppercase" }}>Total In</p>
          <p style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 800, color: C.win }}>{$$(totalIn)}</p>
        </div>
        <div style={{ background: C.dangerDim, border: `1px solid ${C.danger}66`, borderRadius: 12, padding: "12px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.danger, marginBottom: 4, textTransform: "uppercase" }}>Total Out</p>
          <p style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 800, color: C.danger }}>{$$(totalOut)}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        {filterOpts.map(({ id, label }) => (
          <button key={id} onClick={() => setFilter(id)}
            style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${filter === id ? C.coral : C.border}`, background: filter === id ? C.coral : "transparent", color: filter === id ? "#fff" : C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: C.surface, borderRadius: 14, padding: "0 14px", border: `1px solid ${C.border}` }}>
        {filtered.length === 0
          ? <p style={{ color: C.muted, textAlign: "center", padding: "32px 0", fontSize: 13 }}>No transactions found</p>
          : filtered.map((t) => <TxnRow key={t.id} txn={t} playerName={pMap[t.playerId]} />)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MODAL: ADD PLAYER
══════════════════════════════════════════════════════ */
function AddPlayerModal({ ctx }) {
  const { setModal, addPlayer } = ctx;
  const [name, setName] = useState("");
  const submit = async () => { if (!name.trim()) return; await addPlayer(name); setModal(null); };
  return (
    <Modal title="Add New Player" onClose={() => setModal(null)}>
      <Field label="Player Name">
        <Inp value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. MARY" />
      </Field>
      <Btn full onClick={submit} disabled={!name.trim()}>Add Player</Btn>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════
   MODAL: RECORD PAYMENT
══════════════════════════════════════════════════════ */
function PaymentModal({ ctx }) {
  const { setModal, recordPayment, players, modal } = ctx;
  const [playerId, setPlayerId] = useState(modal?.data?.playerId || "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const submit = async () => {
    if (!playerId || !amount || parseFloat(amount) <= 0) return;
    await recordPayment(playerId, amount, note || "MSLEN transfer");
    setModal(null);
  };
  return (
    <Modal title="Record Payment" onClose={() => setModal(null)}>
      <Field label="Player">
        <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}
          style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, color: playerId ? C.text : C.muted, background: C.surfaceHi, outline: "none" }}>
          <option value="">Select player…</option>
          {[...players].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
            <option key={p.id} value={p.id}>{p.name}  (bal: {$$(p.balance)})</option>
          ))}
        </select>
      </Field>
      <Field label="Amount ($)">
        <Inp value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50.00" type="number" />
      </Field>
      <Field label="Note (optional)">
        <Inp value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. MSLEN ref #1234" />
      </Field>
      <Btn full onClick={submit} disabled={!playerId || !amount || parseFloat(amount) <= 0}>Record Payment</Btn>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════
   MODAL: PLAYER DETAIL
══════════════════════════════════════════════════════ */
function PlayerDetailModal({ ctx }) {
  const { setModal, txns, players, modal } = ctx;
  const player = players.find((p) => p.id === modal.data.id) || modal.data;
  const playerTxns = [...txns].filter((t) => t.playerId === player.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const wins = playerTxns.filter((t) => t.type === "WIN").reduce((s, t) => s + t.amount, 0);
  const paid = playerTxns.filter((t) => t.type === "PAYMENT").reduce((s, t) => s + t.amount, 0);
  const spent = playerTxns.filter((t) => t.type === "BUY_IN").reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <Modal title={player.name} onClose={() => setModal(null)}>
      {/* Balance Hero */}
      <div style={{ background: player.balance >= 0 ? C.tealDim : C.dangerDim, border: `1.5px solid ${player.balance >= 0 ? C.teal + "55" : C.danger + "55"}`, borderRadius: 16, padding: 20, marginBottom: 16, textAlign: "center" }}>
        <p style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 700, textTransform: "uppercase" }}>Current Balance</p>
        <p style={{ fontFamily: "Syne,sans-serif", fontSize: 40, fontWeight: 900, color: player.balance >= 0 ? C.teal : C.danger }}>{$$(player.balance)}</p>
      </div>

      {/* Mini Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[{ l: "Paid In", v: $$(paid), c: C.win }, { l: "Spent", v: $$(spent), c: C.coral }, { l: "Won", v: $$(wins), c: C.gold }].map(({ l, v, c }) => (
          <div key={l} style={{ background: C.surfaceHi, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
            <p style={{ fontSize: 9, color: C.muted, marginBottom: 3, textTransform: "uppercase", fontWeight: 700 }}>{l}</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: c }}>{v}</p>
          </div>
        ))}
      </div>

      <Btn full variant="teal" onClick={() => setModal({ type: "payment", data: { playerId: player.id } })}>
        <Plus size={14} /> Record Payment
      </Btn>

      <p style={{ fontFamily: "Syne,sans-serif", fontSize: 12, fontWeight: 800, color: C.muted, margin: "18px 0 4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Transaction History ({playerTxns.length})
      </p>
      {playerTxns.length === 0
        ? <p style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "24px 0" }}>No transactions yet</p>
        : playerTxns.map((t) => <TxnRow key={t.id} txn={t} />)}
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════
   MODAL: NEW GAME
══════════════════════════════════════════════════════ */
function NewGameModal({ ctx }) {
  const { setModal, createGame, games } = ctx;
  const nextNo = Math.max(0, ...games.map((g) => g.gameNo || 0)) + 1;
  const [f, setF] = useState({ gameNo: nextNo, gameCode: "", gameName: "", prizes: ["60", "60", "130"], cardCost: "4", setCost: "24" });
  const upd = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const updPrize = (i, v) => { const p = [...f.prizes]; p[i] = v; setF((x) => ({ ...x, prizes: p })); };
  const addPrize = () => setF((x) => ({ ...x, prizes: [...x.prizes, ""] }));
  const rmPrize = (i) => { const p = f.prizes.filter((_, j) => j !== i); setF((x) => ({ ...x, prizes: p })); };

  const submit = async () => {
    if (!f.gameName.trim()) return;
    await createGame({ gameNo: parseInt(f.gameNo), gameCode: f.gameCode.toUpperCase(), gameName: f.gameName, prizes: f.prizes.map((p) => parseFloat(p) || 0), cardCost: parseFloat(f.cardCost) || 4, setCost: parseFloat(f.setCost) || 24 });
    setModal(null);
  };

  return (
    <Modal title="New Game" onClose={() => setModal(null)}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Game No."><Inp value={f.gameNo} onChange={(e) => upd("gameNo", e.target.value)} type="number" /></Field>
        <Field label="Code"><Inp value={f.gameCode} onChange={(e) => upd("gameCode", e.target.value.toUpperCase())} placeholder="e.g. ML" /></Field>
      </div>
      <Field label="Game Name"><Inp value={f.gameName} onChange={(e) => upd("gameName", e.target.value)} placeholder="e.g. Middle Line" /></Field>
      <Field label="Prize Amounts ($)">
        {f.prizes.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <Inp value={p} onChange={(e) => updPrize(i, e.target.value)} placeholder={`Prize ${i + 1}`} type="number" />
            {f.prizes.length > 1 && (
              <button onClick={() => rmPrize(i)} style={{ background: C.dangerDim, border: "none", borderRadius: 8, padding: "0 10px", cursor: "pointer", color: C.danger, fontSize: 16 }}>×</button>
            )}
          </div>
        ))}
        <button onClick={addPrize} style={{ fontSize: 12, color: C.coral, background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: "4px 0" }}>+ Add Prize</button>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Cost per Card ($)"><Inp value={f.cardCost} onChange={(e) => upd("cardCost", e.target.value)} type="number" /></Field>
        <Field label="Cost per Set ($)"><Inp value={f.setCost} onChange={(e) => upd("setCost", e.target.value)} type="number" /></Field>
      </div>
      <div style={{ background: C.surfaceHi, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: C.muted }}>Total prize pool: <strong style={{ color: C.gold }}>${f.prizes.reduce((s, p) => s + (parseFloat(p) || 0), 0).toFixed(2)}</strong></p>
      </div>
      <Btn full onClick={submit} disabled={!f.gameName.trim()}>Start Game</Btn>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════
   MODAL: ACTIVE GAME MANAGEMENT
══════════════════════════════════════════════════════ */
function ActiveGameModal({ ctx }) {
  const { setModal, players, games, buyIntoGame, declareWinner, completeGame, modal } = ctx;
  const game = games.find((g) => g.id === modal?.data?.id) || modal?.data;
  const [view, setView] = useState("buyins");
  const [pending, setPending] = useState({});
  const [wPlayer, setWPlayer] = useState("");
  const [wPrize, setWPrize] = useState("");
  const [wLabel, setWLabel] = useState("");

  if (!game) return null;
  const existingIds = new Set((game.participants || []).map((p) => p.playerId));

  const togglePending = (id) => {
    if (existingIds.has(id)) return;
    setPending((s) => { const n = { ...s }; n[id] ? delete n[id] : (n[id] = 1); return n; });
  };

  const saveBuyIns = async () => {
    const updates = Object.entries(pending).map(([playerId, sets]) => ({ playerId, sets }));
    if (updates.length === 0) return alert("No new buy-ins selected.");
    await buyIntoGame(game.id, updates);
    setPending({});
    alert(`✅ ${updates.length} buy-in${updates.length > 1 ? "s" : ""} recorded!`);
  };

  const submitWinner = async () => {
    if (!wPlayer || !wPrize) return;
    const label = wLabel || `Prize $${wPrize}`;
    await declareWinner(game.id, wPlayer, parseFloat(wPrize), label);
    setWPlayer(""); setWPrize(""); setWLabel("");
  };

  const endGame = async () => {
    if (window.confirm("Mark this game as complete? This cannot be undone.")) {
      await completeGame(game.id);
      setModal(null);
    }
  };

  const inGamePlayers = players.filter((p) => existingIds.has(p.id));
  const notInGame = players.filter((p) => !existingIds.has(p.id));
  const pendingCount = Object.keys(pending).length;

  return (
    <Modal title={`Game ${game.gameNo} — ${game.gameName}`} onClose={() => setModal(null)}>
      {/* Tab Toggle */}
      <div style={{ display: "flex", background: C.surfaceHi, borderRadius: 10, padding: 3, marginBottom: 20 }}>
        {["buyins", "winners"].map((v) => (
          <button key={v} onClick={() => setView(v)}
            style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: view === v ? C.surfaceHi : "transparent", color: view === v ? C.text : C.muted, boxShadow: view === v ? C.shadowSm : "none", transition: "all 0.15s" }}>
            {v === "buyins" ? `Buy Ins (${existingIds.size + pendingCount})` : `Winners (${(game.winners || []).length})`}
          </button>
        ))}
      </div>

      {view === "buyins" && (
        <>
          {/* Already in */}
          {inGamePlayers.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.teal, marginBottom: 8, textTransform: "uppercase" }}>✓ Confirmed ({inGamePlayers.length})</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {inGamePlayers.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: C.tealDim, border: `1px solid ${C.teal}66` }}>
                    <Check size={14} color={C.teal} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.text }}>{p.name}</span>
                    <Badge color="teal">Paid {$$(game.setCost)}</Badge>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Not yet in */}
          {notInGame.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>Not In Yet ({notInGame.length})</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {notInGame.map((p) => {
                  const sel = !!pending[p.id];
                  return (
                    <div key={p.id} onClick={() => togglePending(p.id)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${sel ? C.coral : C.border}`, background: sel ? C.coralDim : "transparent", cursor: "pointer", transition: "all 0.1s" }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${sel ? C.coral : C.muted}`, background: sel ? C.coral : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {sel && <Check size={11} color="#fff" />}
                      </div>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.text }}>{p.name}</span>
                      <span style={{ fontSize: 12, color: C.muted }}>{$$(p.balance)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {pendingCount > 0 && (
            <div style={{ background: C.coralDim, borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
              <p style={{ fontSize: 12, color: C.coral, fontWeight: 700 }}>{pendingCount} new · Cost: {$$(pendingCount * game.setCost)}</p>
            </div>
          )}
          <Btn full variant="coral" onClick={saveBuyIns} disabled={pendingCount === 0}>
            Save {pendingCount > 0 ? `${pendingCount} ` : ""}Buy-In{pendingCount !== 1 ? "s" : ""}
          </Btn>
        </>
      )}

      {view === "winners" && (
        <>
          {(game.winners || []).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.gold, marginBottom: 8, textTransform: "uppercase" }}>Declared Winners</p>
              {(game.winners || []).map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: C.goldDim, border: `1px solid ${C.gold}88`, borderRadius: 10, marginBottom: 6 }}>
                  <Star size={14} color={C.gold} fill={C.gold} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.text }}>{players.find((p) => p.id === w.playerId)?.name || "Unknown"}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>+{$$(w.prizeAmount)}</span>
                </div>
              ))}
            </div>
          )}

          <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 12, textTransform: "uppercase" }}>Declare a Winner</p>
          <Field label="Winner">
            <select value={wPlayer} onChange={(e) => setWPlayer(e.target.value)}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, color: wPlayer ? C.text : C.muted, background: C.surfaceHi, outline: "none" }}>
              <option value="">Select player…</option>
              {inGamePlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Prize Amount">
            <select value={wPrize} onChange={(e) => setWPrize(e.target.value)}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, color: wPrize ? C.text : C.muted, background: C.surfaceHi, outline: "none" }}>
              <option value="">Select prize…</option>
              {(game.prizes || []).map((p, i) => <option key={i} value={p}>Prize {i + 1}: ${p}</option>)}
            </select>
          </Field>
          <Field label="Prize Label (optional)">
            <Inp value={wLabel} onChange={(e) => setWLabel(e.target.value)} placeholder="e.g. First Line, Full House…" />
          </Field>
          <Btn full variant="gold" onClick={submitWinner} disabled={!wPlayer || !wPrize}>
            <Trophy size={14} /> Declare Winner
          </Btn>

          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 20, paddingTop: 16 }}>
            <Btn full variant="ghost" onClick={endGame}>Mark Game as Complete</Btn>
          </div>
        </>
      )}
    </Modal>
  );
}


/* ══════════════════════════════════════════════════════
   CALLER SCREEN
══════════════════════════════════════════════════════ */
function CallerScreen() {
  const [called, setCalled] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(CALLER_SK) || "[]")); }
    catch { return new Set(); }
  });
  const [current, setCurrent] = useState(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [flash, setFlash]   = useState(false);

  useEffect(() => {
    localStorage.setItem(CALLER_SK, JSON.stringify([...called]));
  }, [called]);

  const callNext = () => {
    const ball = drawBall(called);          // crypto-secure draw from bingoEngine.js
    if (!ball) return;
    const { letter, number: num } = ball;
    setCalled((prev) => new Set([...prev, num]));
    setCurrent({ letter, number: num });
    setFlash(true);
    setTimeout(() => setFlash(false), 500);
    if (voiceOn) speakCall(letter, num);   // TTS from bingoEngine.js
  };

  const reset = () => {
    cancelAnnounce();
    setCalled(new Set());
    setCurrent(null);
    localStorage.removeItem(CALLER_SK);
  };

  const remaining = 75 - called.size;
  const progress  = (called.size / 75) * 100;
  const col       = current ? BINGO_COLS[current.letter] : null;

  return (
    <div style={{ padding: "20px 14px 14px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 900, color: C.text }}>
          Bingo Caller
        </h1>
        <button
          onClick={() => { setVoiceOn((v) => !v); if (voiceOn) cancelAnnounce(); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 20,
            border: `1.5px solid ${voiceOn ? C.teal : C.border}`,
            background: voiceOn ? C.tealDim : "transparent", cursor: "pointer" }}>
          <span style={{ fontSize: 15 }}>{voiceOn ? "🔊" : "🔇"}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: voiceOn ? C.teal : C.muted }}>
            {voiceOn ? "Voice On" : "Voice Off"}
          </span>
        </button>
      </div>

      {/* Current call display */}
      <div style={{
        background: col ? col.dim : C.surfaceHi,
        border: `2.5px solid ${col ? col.color + "55" : C.border}`,
        borderRadius: 22, padding: "22px 16px 18px", textAlign: "center",
        marginBottom: 14, transition: "background 0.25s, border 0.25s",
        boxShadow: col ? `0 6px 28px ${col.color}22` : "none",
      }}>
        {current ? (
          <>
            <div style={{ display: "inline-block", background: col.color, borderRadius: 12,
              padding: "5px 30px", marginBottom: 6 }}>
              <span style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 900,
                color: "#fff", letterSpacing: 6 }}>{current.letter}</span>
            </div>
            <p style={{ fontFamily: "Syne,sans-serif", fontSize: 96, fontWeight: 900,
              color: col.color, lineHeight: 1, margin: "0 0 6px" }}>
              {current.number}
            </p>
            <p style={{ fontSize: 12, color: col.color, fontWeight: 700, opacity: 0.75 }}>
              {current.letter} · {BINGO_COLS[current.letter].range.join("–")}
            </p>
          </>
        ) : (
          <div style={{ padding: "22px 0" }}>
            <p style={{ fontSize: 44, marginBottom: 8 }}>🎱</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.muted }}>Press CALL to begin</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{called.size} called</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{remaining} remaining</span>
        </div>
        <div style={{ height: 7, background: C.surfaceHi, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, transition: "width 0.5s ease",
            background: "linear-gradient(90deg,#1565C0,#B87000,#2E7D32,#7B1FA2,#C62828)",
            borderRadius: 6 }} />
        </div>
      </div>

      {/* CALL button */}
      <button onClick={callNext} disabled={remaining === 0}
        style={{ width: "100%", padding: "20px", borderRadius: 18, border: "none",
          background: remaining === 0 ? C.surfaceHi : "linear-gradient(135deg,#1565C0,#7B1FA2)",
          color: remaining === 0 ? C.muted : "#fff",
          fontFamily: "Syne,sans-serif", fontSize: 22, fontWeight: 900,
          cursor: remaining === 0 ? "not-allowed" : "pointer",
          marginBottom: 8, letterSpacing: 1,
          boxShadow: remaining > 0 ? "0 4px 20px rgba(21,101,192,0.30)" : "none",
          transition: "all 0.2s" }}>
        {remaining === 0 ? "🎉 All 75 Numbers Called!" : "🎱  CALL"}
      </button>

      {/* New game reset */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={reset}
          style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
            background: "transparent", color: C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          ↺ New Game
        </button>
      </div>

      {/* Called numbers board — B I N G O columns */}
      <div style={{ background: C.surface, borderRadius: 16, padding: "12px 8px 14px",
        border: `1px solid ${C.border}` }}>
        <p style={{ fontFamily: "Syne,sans-serif", fontSize: 10, fontWeight: 800, color: C.muted,
          textAlign: "center", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.6px" }}>
          Called Numbers Board
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3 }}>
          {Object.entries(BINGO_COLS).map(([letter, bc]) => (
            <div key={letter}>
              <div style={{ background: bc.color, borderRadius: 6, padding: "5px 2px",
                textAlign: "center", marginBottom: 3 }}>
                <span style={{ fontFamily: "Syne,sans-serif", fontSize: 15, fontWeight: 900,
                  color: "#fff" }}>{letter}</span>
              </div>
              {Array.from({ length: 15 }, (_, i) => {
                const num      = bc.range[0] + i;
                const isCur    = current?.number === num;
                const isCalled = called.has(num);
                return (
                  <div key={num} style={{
                    padding: "4px 1px", textAlign: "center", borderRadius: 5, marginBottom: 2,
                    background: isCur ? bc.color : isCalled ? bc.dim : "transparent",
                    border: `1px solid ${isCur ? bc.color : isCalled ? bc.color + "55" : "transparent"}`,
                    transition: "all 0.2s",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: isCalled ? 800 : 400,
                      color: isCur ? "#fff" : isCalled ? bc.color : C.muted }}>
                      {num}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MODAL: GAME REPORT
══════════════════════════════════════════════════════ */
function GameReportModal({ ctx }) {
  const { setModal, players, txns, modal } = ctx;
  const game = modal.data;

  const gameTxns = txns.filter((t) => t.gameId === game.id);
  const buyIns = gameTxns.filter((t) => t.type === "BUY_IN");
  const wins = gameTxns.filter((t) => t.type === "WIN");
  const totalCollected = buyIns.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalPaidOut = wins.reduce((s, t) => s + t.amount, 0);
  const net = totalCollected - totalPaidOut;
  const pMap = Object.fromEntries(players.map((p) => [p.id, p.name]));
  const participants = game.participants || [];
  const winners = game.winners || [];

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>{title}</p>
      {children}
    </div>
  );

  return (
    <Modal title={`Game ${game.gameNo} Report`} onClose={() => setModal(null)}>
      {/* Game Header */}
      <div style={{ background: C.surfaceHi, borderRadius: 14, padding: "14px 16px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontFamily: "Syne,sans-serif", fontSize: 17, fontWeight: 800, color: C.text }}>{game.gameName}</p>
          <p style={{ fontSize: 12, color: C.muted }}>Code: {game.gameCode} · {game.completedAt ? dShort(game.completedAt) : "Ongoing"}</p>
        </div>
        <Badge color="muted">Done</Badge>
      </div>

      {/* Financial Summary */}
      <Section title="💰 Financial Summary">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Collected", value: $$(totalCollected), color: C.teal, bg: C.tealDim },
            { label: "Paid Out", value: $$(totalPaidOut), color: C.coral, bg: C.coralDim },
            { label: net >= 0 ? "Surplus" : "Deficit", value: $$(net), color: net >= 0 ? C.win : C.danger, bg: net >= 0 ? C.winDim : C.dangerDim },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
              <p style={{ fontSize: 9, fontWeight: 800, color, textTransform: "uppercase", marginBottom: 5 }}>{label}</p>
              <p style={{ fontFamily: "Syne,sans-serif", fontSize: 15, fontWeight: 800, color }}>{value}</p>
            </div>
          ))}
        </div>
        <div style={{ background: C.surfaceHi, borderRadius: 10, padding: "10px 14px", marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: C.muted }}>Cost per set</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{$$(game.setCost)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Prize pool</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>${(game.prizes || []).join(" / $")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Players in</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{participants.length}</span>
          </div>
        </div>
      </Section>

      {/* Winners */}
      <Section title={`🏆 Winners (${winners.length})`}>
        {winners.length === 0
          ? <p style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "12px 0" }}>No winners declared</p>
          : winners.map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: C.goldDim, border: `1px solid ${C.gold}55`, borderRadius: 10, marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{"🥇🥈🥉"[i] || "🏅"}</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{pMap[w.playerId] || "Unknown"}</p>
                  <p style={{ fontSize: 11, color: C.muted }}>{w.prizeLabel || `Prize ${i + 1}`}</p>
                </div>
              </div>
              <p style={{ fontSize: 15, fontWeight: 800, color: C.gold }}>+{$$(w.prizeAmount)}</p>
            </div>
          ))
        }
      </Section>

      {/* Participants */}
      <Section title={`👥 Participants (${participants.length})`}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {participants.length === 0
            ? <p style={{ fontSize: 13, color: C.muted }}>No players recorded</p>
            : participants.map((p, i) => {
              const isWinner = winners.some((w) => w.playerId === p.playerId);
              return (
                <div key={i} style={{ padding: "6px 12px", borderRadius: 20, background: isWinner ? C.goldDim : C.surfaceHi, border: `1px solid ${isWinner ? C.gold + "66" : C.border}`, display: "flex", alignItems: "center", gap: 5 }}>
                  {isWinner && <span style={{ fontSize: 10 }}>🏆</span>}
                  <span style={{ fontSize: 12, fontWeight: 700, color: isWinner ? C.gold : C.text }}>{pMap[p.playerId] || "?"}</span>
                </div>
              );
            })
          }
        </div>
      </Section>

      {/* Buy-in breakdown */}
      <Section title="📋 Buy-in Breakdown">
        {buyIns.length === 0
          ? <p style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "12px 0" }}>No buy-ins recorded</p>
          : buyIns.map((t) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{pMap[t.playerId] || "Unknown"}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.danger }}>−{$$(Math.abs(t.amount))}</p>
            </div>
          ))
        }
      </Section>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════
   APP ROOT
══════════════════════════════════════════════════════ */
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [players, setPlayers] = useState([]);
  const [txns, setTxns] = useState([]);
  const [games, setGames] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    (async () => {
      const [p, t, g] = await Promise.all([sget(SK.P), sget(SK.T), sget(SK.G)]);
      setPlayers(p || []); setTxns(t || []); setGames(g || []);
      setLoaded(true);
    })();
  }, []);

  const sp = async (v) => { setPlayers(v); await sset(SK.P, v); };
  const st = async (v) => { setTxns(v); await sset(SK.T, v); };
  const sg = async (v) => { setGames(v); await sset(SK.G, v); };

  const addPlayer = async (name) => {
    const p = { id: uid(), name: name.toUpperCase().trim(), balance: 0, createdAt: new Date().toISOString() };
    await sp([...players, p]);
  };

  const recordPayment = async (playerId, amount, note) => {
    const amt = parseFloat(amount);
    const txn = { id: uid(), playerId, type: "PAYMENT", amount: amt, gameId: null, note: note || "MSLEN transfer", createdAt: new Date().toISOString() };
    await st([...txns, txn]);
    await sp(players.map((p) => p.id === playerId ? { ...p, balance: +(p.balance + amt).toFixed(2) } : p));
  };

  const createGame = async (data) => {
    const g = { id: uid(), ...data, status: "active", participants: [], winners: [], createdAt: new Date().toISOString() };
    await sg([g, ...games]);
  };

  const buyIntoGame = async (gameId, updates) => {
    const game = games.find((g) => g.id === gameId);
    let np = [...players], nt = [...txns];
    const newParts = [...(game.participants || [])];
    for (const { playerId, sets } of updates) {
      const cost = sets * game.setCost;
      newParts.push({ playerId, sets });
      np = np.map((p) => p.id === playerId ? { ...p, balance: +(p.balance - cost).toFixed(2) } : p);
      nt.push({ id: uid(), playerId, type: "BUY_IN", amount: -cost, gameId, note: `${sets} set${sets > 1 ? "s" : ""} — Game ${game.gameNo} (${game.gameName})`, createdAt: new Date().toISOString() });
    }
    await sp(np); await st(nt);
    await sg(games.map((g) => g.id === gameId ? { ...g, participants: newParts } : g));
  };

  const declareWinner = async (gameId, playerId, prizeAmount, prizeLabel) => {
    const game = games.find((g) => g.id === gameId);
    const txn = { id: uid(), playerId, type: "WIN", amount: prizeAmount, gameId, note: `${prizeLabel} — Game ${game.gameNo}`, createdAt: new Date().toISOString() };
    await sp(players.map((p) => p.id === playerId ? { ...p, balance: +(p.balance + prizeAmount).toFixed(2) } : p));
    await st([...txns, txn]);
    await sg(games.map((g) => g.id === gameId ? { ...g, winners: [...(g.winners || []), { playerId, prizeAmount, prizeLabel }] } : g));
  };

  const completeGame = async (gameId) => {
    await sg(games.map((g) => g.id === gameId ? { ...g, status: "completed", completedAt: new Date().toISOString() } : g));
  };

  const ctx = { players, txns, games, modal, setModal, addPlayer, recordPayment, createGame, buyIntoGame, declareWinner, completeGame };

  if (!loaded) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 14 }}>🎱</div>
      <p style={{ color: C.muted, fontSize: 14, fontFamily: "Nunito,sans-serif" }}>Loading BingoAdmin…</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", background: C.bg, minHeight: "100vh", fontFamily: "Nunito,sans-serif", position: "relative", color: C.text, overflowX: "hidden" }}>
      <style>{FONT_CSS}</style>
      <div style={{ paddingBottom: "calc(76px + env(safe-area-inset-bottom, 0px))", minHeight: "100vh" }}>
        {tab === "dashboard" && <Dashboard ctx={ctx} />}
        {tab === "players" && <PlayersScreen ctx={ctx} />}
        {tab === "caller" && <CallerScreen />}
        {tab === "games" && <GamesScreen ctx={ctx} />}
        {tab === "history" && <HistoryScreen ctx={ctx} />}
      </div>
      <Nav tab={tab} setTab={setTab} />
      {modal?.type === "addPlayer" && <AddPlayerModal ctx={ctx} />}
      {modal?.type === "payment" && <PaymentModal ctx={ctx} />}
      {modal?.type === "playerDetail" && <PlayerDetailModal ctx={ctx} />}
      {modal?.type === "newGame" && <NewGameModal ctx={ctx} />}
      {modal?.type === "activeGame" && <ActiveGameModal ctx={ctx} />}
      {modal?.type === "gameReport" && <GameReportModal ctx={ctx} />}
    </div>
  );
}
