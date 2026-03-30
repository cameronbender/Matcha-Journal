import { useState, useEffect, useRef } from "react";
import { supabaseConfigured } from "./lib/supabaseClient.js";
import * as entriesDb from "./lib/entriesDb.js";

const STORAGE_KEY = "emis-matcha-journal-entries";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Fraunces:ital,wght@0,600;0,700;1,500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream:      #FBF6EE;
    --cream-mid:  #F3EAD8;
    --cream-deep: #E8D9C0;
    --card:       #FEFBF5;
    --sky:        #7AB8CC;
    --sky-dim:    #5A9AB4;
    --sky-tint:   #E4F2F8;
    --matcha:     #7EA86A;
    --matcha-dim: #587848;
    --matcha-tint:#DFF0D6;
    --ink:        #221E14;
    --ink-mid:    #574E3C;
    --ink-light:  #9B8E7A;
    --ink-ghost:  #C9BBAA;
    --r-sm:  10px;
    --r-md:  16px;
    --r-lg:  22px;
    --r-xl:  28px;
    --r-pill:100px;
    --sh-card: 0 2px 10px rgba(34,30,20,0.06), 0 6px 22px rgba(34,30,20,0.04);
    --sh-hover: 0 6px 28px rgba(34,30,20,0.1), 0 2px 8px rgba(34,30,20,0.07);
    --sh-sm:   0 2px 10px rgba(34,30,20,0.07);
  }

  html { -webkit-text-size-adjust: 100%; }
  html, body { background: var(--cream); min-height: 100vh; }
  body {
    font-family: 'Nunito', sans-serif; color: var(--ink); -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  .app { min-height: 100vh; min-height: 100dvh; }

  /* ── Header ── */
  .header {
    background: var(--card);
    border-bottom: 1.5px solid var(--cream-deep);
    height: 66px; padding: 0 2.5rem;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 100;
    box-shadow: var(--sh-sm);
  }
  .logo { display: flex; align-items: center; gap: 11px; }
  .logo-dot {
    width: 36px; height: 36px; border-radius: var(--r-md);
    background: var(--matcha);
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
  }
  .logo-dot svg { width: 19px; height: 19px; }
  .logo-name {
    font-family: 'Fraunces', serif; font-size: 1.1rem; font-weight: 700;
    color: var(--sky); line-height: 1.2;
  }
  .logo-sub { font-size: 0.62rem; color: var(--ink-light); font-weight: 600; letter-spacing: 0.04em; }
  .nav { display: flex; gap: 7px; }
  .nav-btn {
    padding: 7px 17px; border-radius: var(--r-pill); border: none;
    font-family: 'Nunito', sans-serif; font-size: 0.8rem; font-weight: 700;
    cursor: pointer; transition: all 0.15s;
    touch-action: manipulation;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .nav-ghost { background: transparent; color: var(--ink-mid); }
  .nav-ghost:hover { background: var(--cream-mid); color: var(--ink); }
  .nav-ghost.active { background: var(--matcha-tint); color: var(--matcha-dim); }
  .nav-solid { background: var(--sky); color: #fff; }
  .nav-solid:hover { background: var(--sky-dim); }

  /* ── Main ── */
  .main { max-width: 1080px; margin: 0 auto; padding: 2.25rem 2.5rem; }

  /* ── Stats ── */
  .stats {
    display: grid; grid-template-columns: repeat(4,1fr); gap: 11px;
    margin-bottom: 1.4rem;
  }
  .stat {
    background: var(--card); border-radius: var(--r-lg);
    border: 1.5px solid var(--cream-deep); padding: 0.9rem 1rem;
    text-align: center; box-shadow: var(--sh-sm);
  }
  .stat-val {
    font-family: 'Fraunces', serif; font-size: 1.5rem; font-weight: 700;
    display: block; line-height: 1.15; color: var(--ink);
  }
  .stat-val.g { color: var(--matcha-dim); }
  .stat-val.b { color: var(--sky-dim); }
  .stat-val.sm { font-size: 0.82rem; padding-top: 6px; color: var(--ink-mid); }
  .stat-lbl { font-size: 0.66rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--ink-light); }

  /* ── Filters ── */
  .filters {
    background: var(--card); border-radius: var(--r-xl);
    border: 1.5px solid var(--cream-deep); padding: 0.85rem 1.2rem;
    display: flex; gap: 7px; align-items: center; flex-wrap: wrap;
    box-shadow: var(--sh-sm); margin-bottom: 1.6rem;
  }
  .flabel { font-size: 0.66rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-ghost); }
  .chip {
    padding: 4px 12px; border-radius: var(--r-pill);
    border: 1.5px solid var(--cream-deep); background: var(--cream-mid);
    font-family: 'Nunito', sans-serif; font-size: 0.75rem; font-weight: 700;
    cursor: pointer; transition: all 0.13s; color: var(--ink-mid);
    touch-action: manipulation;
  }
  .chip:hover { border-color: var(--matcha); color: var(--matcha-dim); background: var(--matcha-tint); }
  .chip.on { background: var(--matcha); color: #fff; border-color: var(--matcha-dim); }
  .fsep { width: 1px; height: 16px; background: var(--cream-deep); margin: 0 2px; flex-shrink: 0; }
  .search-wrap { position: relative; margin-left: auto; }
  .search-ico {
    position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
    width: 12px; height: 12px; color: var(--ink-ghost); pointer-events: none;
  }
  .search-input {
    background: var(--cream-mid); border: 1.5px solid var(--cream-deep);
    border-radius: var(--r-pill); padding: 6px 13px 6px 30px;
    font-family: 'Nunito', sans-serif; font-size: 0.8rem; font-weight: 500;
    color: var(--ink); outline: none; width: 175px; transition: all 0.15s;
  }
  .search-input:focus { border-color: var(--sky); background: var(--card); box-shadow: 0 0 0 3px var(--sky-tint); }

  /* ── Section title ── */
  .sec-title {
    font-family: 'Fraunces', serif; font-size: 1.1rem; font-weight: 700;
    color: var(--ink); margin-bottom: 1.1rem;
    display: flex; align-items: center; gap: 8px;
  }
  .sec-badge {
    background: var(--matcha-tint); color: var(--matcha-dim);
    font-family: 'Nunito', sans-serif; font-size: 0.68rem; font-weight: 800;
    padding: 2px 9px; border-radius: var(--r-pill);
  }

  /* ── Grid ── */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
    gap: 1.15rem;
  }

  /* ── Card ── */
  .card {
    background: var(--card); border-radius: var(--r-xl);
    border: 1.5px solid var(--cream-deep);
    box-shadow: var(--sh-card); cursor: pointer; overflow: hidden;
    transition: transform 0.2s cubic-bezier(.34,1.4,.64,1), box-shadow 0.2s;
    position: relative;
  }

  .card-img { width: 100%; height: 190px; object-fit: cover; display: block; }
  .card-no-img {
    width: 100%; height: 190px; background: var(--cream-mid);
    display: flex; align-items: center; justify-content: center;
  }
  .card-no-img-leaf {
    width: 44px; height: 44px; border-radius: 50% 50% 50% 0;
    background: var(--matcha-tint); transform: rotate(-45deg);
  }

  .card-rating {
    position: absolute; top: 10px; right: 10px;
    background: var(--card); border-radius: var(--r-md);
    padding: 4px 9px; font-family: 'Fraunces', serif;
    font-size: 0.8rem; font-weight: 700; color: var(--ink);
    border: 1.5px solid var(--cream-deep);
    box-shadow: 0 1px 6px rgba(34,30,20,0.08);
  }
  .card-perfect {
    position: absolute; top: 10px; left: 10px;
    background: var(--sky); color: #fff;
    border-radius: var(--r-pill); padding: 3px 10px;
    font-size: 0.62rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
  }

  .card-body { padding: 0.85rem 1.05rem 1rem; }
  .card-cafe { font-family: 'Fraunces', serif; font-size: 1rem; font-weight: 700; color: var(--ink); margin-bottom: 2px; }
  .card-loc { font-size: 0.72rem; color: var(--ink-light); font-weight: 600; margin-bottom: 0.45rem; }
  .card-order {
    font-size: 0.8rem; color: var(--ink-mid); line-height: 1.55; margin-bottom: 0.7rem;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .card-foot {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 0.6rem; border-top: 1.5px solid var(--cream-mid);
  }
  .card-date { font-size: 0.67rem; color: var(--ink-ghost); font-weight: 700; }

  /* ── Stars ── */
  .stars { display: flex; align-items: center; gap: 1px; }
  .star { font-size: 0.86rem; }
  .star.f { color: #C8960A; }
  .star.h { color: #C8960A; opacity: 0.5; }
  .star.e { color: var(--cream-deep); }
  .star-num { font-family: 'Fraunces', serif; font-size: 0.78rem; color: var(--ink-mid); margin-left: 4px; font-weight: 700; }

  /* ── Star input ── */
  .star-input-row { display: flex; align-items: center; gap: 2px; }
  .star-ibtn {
    background: none; border: none; cursor: pointer;
    font-size: 1.5rem; padding: 1px; line-height: 1;
    transition: transform 0.12s cubic-bezier(.34,1.4,.64,1);
    touch-action: manipulation;
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 2.75rem; min-height: 2.75rem;
  }
  @media (hover: hover) {
    .star-ibtn:hover { transform: scale(1.18); }
  }
  .star-ival { font-family: 'Fraunces', serif; font-size: 0.95rem; font-weight: 700; color: var(--matcha-dim); margin-left: 7px; }

  /* ── Hero ── */
  .hero {
    background: var(--card); border-radius: var(--r-xl);
    border: 1.5px solid var(--cream-deep); box-shadow: var(--sh-sm);
    padding: 4rem 2rem; text-align: center; margin-bottom: 2rem;
  }
  .hero-icon {
    width: 52px; height: 52px; border-radius: var(--r-lg);
    background: var(--matcha-tint); margin: 0 auto 1.1rem;
    display: flex; align-items: center; justify-content: center;
  }
  .hero-leaf {
    width: 22px; height: 22px; background: var(--matcha);
    border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
  }
  .hero-title { font-family: 'Fraunces', serif; font-size: 1.4rem; font-weight: 700; margin-bottom: 0.45rem; }
  .hero-sub { color: var(--ink-light); font-size: 0.86rem; line-height: 1.7; max-width: 280px; margin: 0 auto 1.5rem; font-weight: 500; }
  .hero-err { color: #A03020; font-size: 0.84rem; margin-bottom: 1rem; max-width: 320px; margin-left: auto; margin-right: auto; }
  .btn:disabled { opacity: 0.55; cursor: not-allowed; }

  /* ── Buttons ── */
  .btn {
    padding: 9px 20px; border-radius: var(--r-pill);
    font-family: 'Nunito', sans-serif; font-size: 0.83rem; font-weight: 800;
    cursor: pointer; transition: all 0.15s; border: none;
    display: inline-flex; align-items: center; gap: 5px;
    touch-action: manipulation;
  }
  .btn-green { background: var(--matcha); color: #fff; }
  .btn-green:hover { background: var(--matcha-dim); }
  .btn-ghost { background: var(--cream-mid); color: var(--ink-mid); border: 1.5px solid var(--cream-deep); }
  .btn-ghost:hover { background: var(--cream-deep); color: var(--ink); }
  .btn-del { background: #FBF0EE; color: #A03020; border: 1.5px solid #EEC8C0; }
  .btn-del:hover { background: #EEC8C0; color: #7A1C10; }

  /* ── Modal ── */
  .overlay {
    position: fixed; inset: 0; background: rgba(34,30,20,0.28);
    backdrop-filter: blur(4px); z-index: 200;
    display: flex; align-items: center; justify-content: center;
    padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right))
      max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  .modal {
    background: var(--card); border-radius: var(--r-xl);
    border: 1.5px solid var(--cream-deep);
    width: 100%; max-width: 540px;
    max-height: min(90vh, 100dvh - 2rem);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    box-shadow: 0 18px 56px rgba(34,30,20,0.16), 0 4px 14px rgba(34,30,20,0.07);
    animation: pop .2s cubic-bezier(.34,1.4,.64,1);
  }
  @keyframes pop {
    from { opacity:0; transform:scale(.93) translateY(10px); }
    to   { opacity:1; transform:scale(1)   translateY(0); }
  }
  .modal-head {
    padding: 1.15rem 1.4rem; border-bottom: 1.5px solid var(--cream-mid);
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; background: var(--card); z-index: 1;
    border-radius: var(--r-xl) var(--r-xl) 0 0;
  }
  .modal-title { font-family: 'Fraunces', serif; font-size: 1rem; font-weight: 700; }
  .modal-x {
    width: 30px; height: 30px; border-radius: var(--r-sm);
    background: var(--cream-mid); border: 1.5px solid var(--cream-deep);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 0.85rem; color: var(--ink-mid);
    transition: background 0.13s;
  }
  .modal-x:hover { background: var(--cream-deep); }
  .modal-body { padding: 1.4rem; }

  /* ── Form ── */
  .fg { margin-bottom: 1.05rem; }
  .flbl {
    display: block; font-size: 0.68rem; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.09em;
    color: var(--ink-light); margin-bottom: 5px;
  }
  .finput, .ftarea {
    width: 100%; border: 1.5px solid var(--cream-deep); border-radius: var(--r-md);
    background: var(--cream-mid); padding: 9px 12px;
    font-family: 'Nunito', sans-serif; font-size: 0.88rem; font-weight: 500;
    color: var(--ink); outline: none; transition: all 0.13s; resize: none;
  }
  .finput:focus, .ftarea:focus {
    border-color: var(--sky); background: var(--card);
    box-shadow: 0 0 0 3px var(--sky-tint);
  }
  .frow { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }

  .img-zone {
    border: 1.5px dashed var(--cream-deep); border-radius: var(--r-lg);
    padding: 1.4rem; text-align: center; background: var(--cream-mid);
    cursor: pointer; transition: all 0.13s; position: relative; overflow: hidden;
  }
  .img-zone:hover { border-color: var(--sky); background: var(--sky-tint); }
  .img-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .img-prev { width: 100%; max-height: 185px; object-fit: cover; border-radius: var(--r-md); display: block; }
  .img-placeholder {
    width: 36px; height: 36px; border-radius: var(--r-md);
    background: var(--cream-deep); margin: 0 auto 6px;
    display: flex; align-items: center; justify-content: center;
  }
  .img-placeholder-inner {
    width: 16px; height: 16px; background: var(--ink-ghost); border-radius: 3px;
  }
  .img-hint { font-size: 0.76rem; color: var(--ink-light); font-weight: 600; }

  .fdivider { border: none; border-top: 1.5px solid var(--cream-mid); margin: 1rem 0; }
  .factions { display: flex; gap: 9px; justify-content: flex-end; }

  /* ── Detail ── */
  .det-img { width: 100%; max-height: 280px; object-fit: cover; display: block; }
  .det-body { padding: 1.4rem; }
  .det-cafe { font-family: 'Fraunces', serif; font-size: 1.4rem; font-weight: 700; margin-bottom: 3px; }
  .det-loc { font-size: 0.77rem; color: var(--ink-light); font-weight: 600; margin-bottom: 1rem; }
  .det-tag {
    display: inline-block; background: var(--cream-mid); border-radius: var(--r-pill);
    padding: 2px 10px; font-size: 0.62rem; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-light); margin-bottom: 5px;
  }
  .det-text { font-size: 0.88rem; color: var(--ink-mid); line-height: 1.65; margin-bottom: 0.7rem; }
  .det-meta {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 1.1rem; padding: 0.8rem 0.95rem;
    background: var(--cream-mid); border-radius: var(--r-lg);
  }
  .det-date { font-size: 0.72rem; color: var(--ink-light); font-weight: 700; }
  .det-actions { display: flex; gap: 8px; margin-top: 0.9rem; }

  /* ── Form page ── */
  .fp-head { margin-bottom: 1.6rem; }
  .fp-title { font-family: 'Fraunces', serif; font-size: 1.45rem; font-weight: 700; margin-bottom: 3px; }
  .fp-sub { font-size: 0.8rem; color: var(--ink-light); font-weight: 500; }
  .fp-card {
    background: var(--card); border-radius: var(--r-xl);
    border: 1.5px solid var(--cream-deep); box-shadow: var(--sh-card);
    padding: 1.65rem; max-width: 590px;
  }

  /* ── Toast ── */
  .toast {
    position: fixed;
    bottom: max(1.25rem, env(safe-area-inset-bottom));
    left: 50%; transform: translateX(-50%);
    background: var(--ink); color: var(--cream);
    padding: 10px 18px; border-radius: var(--r-pill);
    font-size: 0.81rem; font-weight: 700; z-index: 500;
    max-width: calc(100vw - 1.5rem - env(safe-area-inset-left) - env(safe-area-inset-right));
    text-align: center; line-height: 1.35;
    box-shadow: 0 4px 18px rgba(34,30,20,0.2);
    animation: tpop .2s cubic-bezier(.34,1.4,.64,1);
  }
  @keyframes tpop {
    from { opacity:0; transform:translateX(-50%) translateY(8px) scale(.92); }
    to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
  }

  .empty { grid-column:1/-1; text-align:center; padding:3rem; color:var(--ink-light); font-size:0.86rem; font-weight:600; }
  .empty-icon { width:36px; height:36px; border-radius:var(--r-md); background:var(--cream-mid); margin:0 auto 0.75rem; }

  @media (max-width: 768px) {
    .main { padding: 1.2rem max(1rem, env(safe-area-inset-left)) 1.5rem max(1rem, env(safe-area-inset-right)); }
    .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .stat { padding: 0.75rem 0.55rem; }
    .stat-val { font-size: 1.32rem; }
    .stat-val.sm { font-size: 0.7rem; line-height: 1.25; word-break: break-word; }
    .filters { padding: 0.75rem 1rem; gap: 8px; }
    .search-wrap { flex-basis: 100%; width: 100%; margin-left: 0; }
    .search-input { width: 100%; max-width: 100%; min-height: 40px; font-size: 16px; }
    .chip { padding: 7px 13px; min-height: 40px; font-size: 0.78rem; }
    .grid { gap: 1rem; }
    .hero { padding: 2.5rem 1.15rem; }
    .fp-card { padding: 1.25rem; max-width: none; }
    .fp-title { font-size: 1.22rem; }
    .det-cafe { font-size: 1.15rem; word-break: break-word; }
    .det-body { padding: 1.1rem; }
    .modal-body { padding: 1.1rem; }
    .modal-head { padding: 1rem 1.1rem; }
    .finput, .ftarea { font-size: 16px; }
  }

  @media (max-width: 560px) {
    .header {
      flex-direction: column;
      align-items: stretch;
      height: auto;
      min-height: 56px;
      padding: 0.65rem max(1rem, env(safe-area-inset-left)) 0.7rem max(1rem, env(safe-area-inset-right));
      padding-top: max(0.65rem, env(safe-area-inset-top));
      gap: 0.65rem;
    }
    .logo { min-width: 0; }
    .logo-name { font-size: 0.98rem; }
    .logo-sub {
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      max-width: 100%;
    }
    .nav { width: 100%; display: flex; gap: 8px; }
    .nav-btn {
      flex: 1;
      justify-content: center;
      min-height: 44px;
      padding: 10px 12px;
      font-size: 0.76rem;
    }
    .sec-title { flex-wrap: wrap; gap: 6px; }
  }

  @media (max-width: 480px) {
    .frow { grid-template-columns: 1fr; }
    .factions { flex-direction: column; align-items: stretch; gap: 10px; }
    .factions .btn { width: 100%; justify-content: center; min-height: 48px; }
    .det-actions { flex-direction: column; align-items: stretch; gap: 10px; }
    .det-actions .btn { width: 100%; justify-content: center; min-height: 44px; }
    .det-meta { flex-wrap: wrap; gap: 0.5rem; }
  }

  @media (hover: hover) {
    .card:hover { transform: translateY(-4px); box-shadow: var(--sh-hover); }
  }
  @media (hover: none) {
    .card:active { transform: scale(0.99); }
  }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--cream-deep); border-radius: 10px; }
`;

function Stars({ rating }) {
  const full = Math.floor(rating), half = rating % 1 >= 0.5 ? 1 : 0, empty = 5 - full - half;
  return (
    <span className="stars">
      {[...Array(full)].map((_,i) => <span key={`f${i}`} className="star f">★</span>)}
      {half ? <span className="star h">★</span> : null}
      {[...Array(empty)].map((_,i) => <span key={`e${i}`} className="star e">★</span>)}
      <span className="star-num">{rating.toFixed(1)}</span>
    </span>
  );
}

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(null);
  const d = hover ?? value;
  const getVal = (i, e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return (e.clientX - r.left) < r.width / 2 ? i - 0.5 : i;
  };
  return (
    <div className="star-input-row">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" className="star-ibtn"
          onPointerMove={e => setHover(getVal(i, e))}
          onPointerLeave={() => setHover(null)}
          onClick={e => onChange(getVal(i, e))}>
          <span style={{ color: d >= i ? '#C8960A' : d >= i-0.5 ? '#DEB84A' : '#D9CCB8' }}>★</span>
        </button>
      ))}
      <span className="star-ival">{value ? value.toFixed(1) : '—'}</span>
    </div>
  );
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
}

const SORTS = [
  { l:'Newest', v:'newest' }, { l:'Oldest', v:'oldest' },
  { l:'Highest rated', v:'top' }, { l:'Lowest rated', v:'bottom' },
];
const RATINGS = [0, 3, 3.5, 4, 4.5, 5];

export default function App() {
  const [entries, setEntries] = useState([]);
  const [view, setView]       = useState('journal');
  const [search, setSearch]   = useState('');
  const [sort, setSort]       = useState('newest');
  const [minR, setMinR]       = useState(0);
  const [sel, setSel]         = useState(null);
  const [editing, setEditing] = useState(null);
  const [toast, setToast]     = useState(null);
  const [booting, setBooting] = useState(supabaseConfigured);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (supabaseConfigured) {
          setLoadError(null);
          const list = await entriesDb.fetchEntries();
          if (!cancelled) setEntries(list);
        } else {
          try {
            const r = await window.storage.get(STORAGE_KEY);
            if (r && !cancelled) setEntries(JSON.parse(r.value));
          } catch {}
        }
      } catch (e) {
        if (supabaseConfigured && !cancelled) {
          setLoadError(e.message ?? 'Could not load your journal.');
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function retryLoad() {
    setBooting(true);
    setLoadError(null);
    try {
      const list = await entriesDb.fetchEntries();
      setEntries(list);
    } catch (e) {
      setLoadError(e.message ?? 'Could not load your journal.');
    } finally {
      setBooting(false);
    }
  }

  async function persistLocal(arr) {
    setEntries(arr);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(arr)); } catch {}
  }

  function flash(m) { setToast(m); setTimeout(() => setToast(null), 2400); }

  async function handleSave(entry) {
    if (supabaseConfigured) {
      try {
        setSaving(true);
        const saved = await entriesDb.upsertEntry(entry);
        setEntries((prev) =>
          entriesDb.isUuid(entry.id) ? prev.map((e) => (e.id === saved.id ? saved : e)) : [saved, ...prev]
        );
        flash(entriesDb.isUuid(entry.id) ? 'Entry updated' : 'Entry saved');
        setView('journal'); setEditing(null); setSel(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[matcha] Save failed', e);
        flash(msg || 'Save failed');
      } finally {
        setSaving(false);
      }
      return;
    }
    const next = entry.id
      ? entries.map((e) => (e.id === entry.id ? entry : e))
      : [{ ...entry, id: Date.now().toString() }, ...entries];
    await persistLocal(next);
    flash(entry.id ? 'Entry updated' : 'Entry saved');
    setView('journal'); setEditing(null); setSel(null);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this entry?')) return;
    if (supabaseConfigured) {
      try {
        await entriesDb.deleteEntry(id);
        setEntries((prev) => prev.filter((e) => e.id !== id));
        setSel(null);
        flash('Entry deleted');
      } catch (e) {
        flash(e.message ?? 'Delete failed');
      }
      return;
    }
    await persistLocal(entries.filter((e) => e.id !== id));
    setSel(null);
    flash('Entry deleted');
  }

  const filtered = entries
    .filter(e => {
      const q = search.toLowerCase();
      return (!q || [e.cafe,e.location,e.order,e.notes].join(' ').toLowerCase().includes(q)) && e.rating >= minR;
    })
    .sort((a,b) => {
      if (sort==='newest') return new Date(b.date)-new Date(a.date);
      if (sort==='oldest') return new Date(a.date)-new Date(b.date);
      if (sort==='top')    return b.rating-a.rating;
      return a.rating-b.rating;
    });

  const avg = entries.length ? (entries.reduce((s,e)=>s+e.rating,0)/entries.length).toFixed(2) : '—';
  const best = entries.length ? entries.reduce((a,b)=>a.rating>b.rating?a:b) : null;
  const isForm = view==='new' || editing;

  return (
    <div className="app">
      <style>{style}</style>

      <header className="header">
        <div className="logo">
          <div className="logo-dot" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 10h11v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-4z" />
              <path d="M16 12h2a2 2 0 0 1 0 4h-2" />
              <path d="M8 7h6" />
            </svg>
          </div>
          <div>
            <div className="logo-name">Emi's Matcha Journal</div>
            <div className="logo-sub">
              {supabaseConfigured
                ? 'Synced online'
                : import.meta.env.PROD
                  ? 'Production build has no Supabase keys — set SUPABASE_URL + SUPABASE_ANON_KEY for Production in Vercel, redeploy, check build logs'
                  : 'Local only — add Supabase keys to .env for cloud'}
            </div>
          </div>
        </div>
        <nav className="nav">
          <button className={`nav-btn nav-ghost ${!isForm ? 'active' : ''}`}
            onClick={() => { setView('journal'); setEditing(null); }}>All Entries</button>
          <button className="nav-btn nav-solid"
            onClick={() => { setEditing(null); setView('new'); }}>+ New Entry</button>
        </nav>
      </header>

      <main className="main">
        {booting ? (
          <div className="hero">
            <div className="hero-icon"><div className="hero-leaf" /></div>
            <div className="hero-title">Loading your journal…</div>
          </div>
        ) : loadError ? (
          <div className="hero">
            <div className="hero-title">Couldn’t load journal</div>
            <p className="hero-err">{loadError}</p>
            <p className="hero-sub">Confirm VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, and run the SQL in supabase/schema.sql in the Supabase SQL Editor.</p>
            <button className="btn btn-green" type="button" onClick={() => { void retryLoad(); }}>Try again</button>
          </div>
        ) : isForm ? (
          <EntryForm
            entry={editing}
            onSave={handleSave}
            saving={saving}
            onCancel={() => { setView('journal'); setEditing(null); }}
          />
        ) : (
          <>
            {entries.length > 0 && (
              <>
                <div className="stats">
                  <div className="stat"><span className="stat-val">{entries.length}</span><span className="stat-lbl">Cafés visited</span></div>
                  <div className="stat"><span className="stat-val g">{avg}</span><span className="stat-lbl">Avg rating</span></div>
                  <div className="stat"><span className="stat-val b">{best?.rating.toFixed(1)}</span><span className="stat-lbl">Best score</span></div>
                  <div className="stat"><span className="stat-val sm">{best?.cafe ?? '—'}</span><span className="stat-lbl">Top café</span></div>
                </div>
                <div className="filters">
                  <span className="flabel">Sort</span>
                  {SORTS.map(o => (
                    <button key={o.v} className={`chip ${sort===o.v?'on':''}`} onClick={()=>setSort(o.v)}>{o.l}</button>
                  ))}
                  <div className="fsep" />
                  <span className="flabel">Min</span>
                  {RATINGS.map(r => (
                    <button key={r} className={`chip ${minR===r?'on':''}`} onClick={()=>setMinR(r)}>
                      {r===0?'All':`${r}+`}
                    </button>
                  ))}
                  <div className="search-wrap">
                    <svg className="search-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="6.5" cy="6.5" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/>
                    </svg>
                    <input className="search-input" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            <div className="sec-title">
              Journal
              {entries.length > 0 && <span className="sec-badge">{filtered.length} entries</span>}
            </div>

            {entries.length === 0 ? (
              <div className="hero">
                <div className="hero-icon"><div className="hero-leaf" /></div>
                <div className="hero-title">Start your matcha journal</div>
                <p className="hero-sub">Record all your favourite matchas!</p>
                <button className="btn btn-green" onClick={()=>setView('new')}>+ Add First Entry</button>
              </div>
            ) : (
              <div className="grid">
                {filtered.length === 0
                  ? <div className="empty"><div className="empty-icon" /><div>No entries match your filters</div></div>
                  : filtered.map(entry => (
                    <div key={entry.id} className="card" onClick={()=>setSel(entry)}>
                      {entry.image
                        ? <img src={entry.image} className="card-img" alt={entry.cafe} />
                        : <div className="card-no-img"><div className="card-no-img-leaf" /></div>
                      }
                      <div className="card-rating">{entry.rating.toFixed(1)}</div>
                      {entry.rating === 5 && <div className="card-perfect">Perfect</div>}
                      <div className="card-body">
                        <div className="card-cafe">{entry.cafe}</div>
                        <div className="card-loc">{entry.location}</div>
                        <div className="card-order">{entry.order}</div>
                        <div className="card-foot">
                          <span className="card-date">{fmtDate(entry.date)}</span>
                          <Stars rating={entry.rating} />
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </>
        )}
      </main>

      {sel && !editing && view==='journal' && (
        <div className="overlay" onClick={e=>{ if(e.target===e.currentTarget) setSel(null); }}>
          <div className="modal">
            <div className="modal-head">
              <span className="modal-title">Entry Detail</span>
              <button className="modal-x" onClick={()=>setSel(null)}>✕</button>
            </div>
            {sel.image && <img src={sel.image} className="det-img" alt={sel.cafe} />}
            <div className="det-body">
              <div className="det-cafe">{sel.cafe}</div>
              <div className="det-loc">{sel.location}</div>
              <div className="det-tag">Order</div>
              <div className="det-text">{sel.order}</div>
              {sel.notes && (<><div className="det-tag">Notes</div><div className="det-text">{sel.notes}</div></>)}
              <div className="det-meta">
                <span className="det-date">{fmtDate(sel.date)}</span>
                <Stars rating={sel.rating} />
              </div>
              <div className="det-actions">
                <button className="btn btn-ghost" onClick={()=>{ setEditing(sel); setSel(null); }}>Edit</button>
                <button className="btn btn-del" onClick={()=>handleDelete(sel.id)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function EntryForm({ entry, onSave, onCancel, saving = false }) {
  const [cafe, setCafe]       = useState(entry?.cafe ?? '');
  const [location, setLoc]    = useState(entry?.location ?? '');
  const [order, setOrder]     = useState(entry?.order ?? '');
  const [notes, setNotes]     = useState(entry?.notes ?? '');
  const [date, setDate]       = useState(entry?.date ?? new Date().toISOString().split('T')[0]);
  const [rating, setRating]   = useState(entry?.rating ?? 0);
  const [image, setImage]     = useState(entry?.image ?? null);
  const fileRef = useRef();

  function handleImg(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => setImage(ev.target.result); r.readAsDataURL(f);
  }

  async function submit() {
    if (!cafe.trim()) { alert('Please enter a café name.'); return; }
    if (!rating) { alert('Please add a rating.'); return; }
    if (saving) return;
    await onSave({ id: entry?.id, cafe, location, order, notes, date, rating, image });
  }

  return (
    <div>
      <div className="fp-head">
        <div className="fp-title">{entry ? 'Edit Entry' : 'New Entry'}</div>
        <div className="fp-sub">{entry ? 'Update your tasting notes' : 'Add a new matcha memory'}</div>
      </div>
      <div className="fp-card">
        <div className="fg">
          <label className="flbl">Photo</label>
          <div className="img-zone" onClick={()=>fileRef.current.click()}>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} />
            {image
              ? <img src={image} className="img-prev" alt="preview" />
              : <><div className="img-placeholder"><div className="img-placeholder-inner" /></div><div className="img-hint">Click to upload a photo</div></>
            }
          </div>
          {image && <button className="btn btn-ghost" style={{marginTop:8,fontSize:'0.72rem',padding:'4px 13px'}} onClick={()=>setImage(null)}>Remove</button>}
        </div>

        <div className="frow">
          <div className="fg">
            <label className="flbl">Café Name *</label>
            <input className="finput" value={cafe} onChange={e=>setCafe(e.target.value)} placeholder="e.g. Suda Table" />
          </div>
          <div className="fg">
            <label className="flbl">Location</label>
            <input className="finput" value={location} onChange={e=>setLoc(e.target.value)} placeholder="e.g. Halifax, NS" />
          </div>
        </div>

        <div className="fg">
          <label className="flbl">Matcha Order</label>
          <input className="finput" value={order} onChange={e=>setOrder(e.target.value)} placeholder="e.g. Iced Strawberry Matcha Latte" />
        </div>

        <div className="fg">
          <label className="flbl">What was good/bad about it?</label>
          <textarea className="ftarea" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Describe it!" />
        </div>

        <div className="frow">
          <div className="fg">
            <label className="flbl">Date</label>
            <input type="date" className="finput" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          <div className="fg">
            <label className="flbl">Rating *</label>
            <StarInput value={rating} onChange={setRating} />
          </div>
        </div>

        <div className="fdivider" />
        <div className="factions">
          <button className="btn btn-ghost" type="button" disabled={saving} onClick={onCancel}>Cancel</button>
          <button className="btn btn-green" type="button" disabled={saving} onClick={() => { void submit(); }}>
            {saving ? 'Saving…' : (entry ? 'Save Changes' : 'Save Entry')}
          </button>
        </div>
      </div>
    </div>
  );
}
