// Bilingual UI (English / Arabic). English text is the key; Arabic lives in ./ar.js.
// t('Hello, {name}', { name }) → translated text with values filled in.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AR } from './ar.js';

let current = 'en';
/** Current language for code outside React (formatting helpers). */
export const getLang = () => current;

function initialLang() {
  try {
    const q = new URLSearchParams(window.location.search).get('lang'); // passed from the website
    if (q === 'ar' || q === 'en') return q;
    const saved = localStorage.getItem('wf_lang');
    if (saved === 'ar' || saved === 'en') return saved;
  } catch { /* storage unavailable */ }
  return (navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

const missing = new Set();
export function translate(lang, text, vars) {
  if (typeof text !== 'string' || !text) return text;
  let out = text;
  if (lang === 'ar') {
    if (AR[text] !== undefined) out = AR[text];
    else if (import.meta.env.DEV && /[a-z]{2}/i.test(text)) { missing.add(text); window.__missingAr = [...missing]; }
  }
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null ? vars[k] : m));
  return out;
}

const LangCtx = createContext({ lang: 'en', dir: 'ltr', t: (s) => s, setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLang] = useState(initialLang);
  current = lang;
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem('wf_lang', lang); } catch { /* ignore */ }
  }, [lang]);
  const t = useCallback((text, vars) => translate(lang, text, vars), [lang]);
  const value = useMemo(() => ({ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', t, setLang }), [lang, t]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
export const useT = () => useContext(LangCtx).t;

/** Translate a node if it is plain text; leave elements untouched. */
export function useTx() {
  const t = useT();
  return useCallback((node) => (typeof node === 'string' ? t(node) : node), [t]);
}

export function LangToggle({ className = '' }) {
  const { lang, setLang } = useLang();
  const other = lang === 'ar' ? 'en' : 'ar';
  return (
    <button type="button" onClick={() => setLang(other)} lang={other} className={className}
      aria-label={other === 'ar' ? 'التبديل إلى العربية' : 'Switch to English'}>
      {other === 'ar' ? 'العربية' : 'English'}
    </button>
  );
}
