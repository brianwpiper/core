import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { backend, type Backend, type Session } from '../lib/backend';
import { WorkbookStore, type StoreState } from '../lib/store';
import { mergeContent, mergeSettings } from '../lib/content';
import { readJSON, writeJSON } from '../lib/storage';
import type { ContentBundle, ContentRow, ContentTable, LiveState, Role, Settings, UserData } from '../lib/types';

interface AppCtx {
  backend: Backend;
  store: WorkbookStore;
  session: Session | null | undefined; // undefined while we check
  roles: Role[];
  content: ContentBundle;
  contentRows: Record<ContentTable, ContentRow[]>;
  refreshContent: () => Promise<void>;
  live: LiveState;
  settings: Settings;
  refreshLive: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AppCtx | null>(null);
const store = new WorkbookStore(backend);

const CONTENT_CACHE = 'wb:content-rows';
const LIVE_CACHE = 'wb:live';
const EMPTY_ROWS: Record<ContentTable, ContentRow[]> = { sections: [], prompts: [], library_items: [], suggestions: [] };
const LIVE_POLL_MS = 60_000;
const TOUCH_MS = 5 * 60_000;

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [roles, setRoles] = useState<Role[]>([]);
  const [contentRows, setContentRows] = useState(() => readJSON(CONTENT_CACHE, EMPTY_ROWS));
  const [live, setLive] = useState<LiveState>(() => readJSON(LIVE_CACHE, { current_section_key: null, settings: {} }));
  const loadedFor = useRef<string | null>(null);

  // Session
  useEffect(() => {
    backend.getSession().then(setSession);
    return backend.onAuthChange((s) => setSession(s));
  }, []);

  // Load user data and roles when the session changes
  useEffect(() => {
    if (session === undefined) return;
    if (!session) {
      if (loadedFor.current) store.unload();
      loadedFor.current = null;
      setRoles([]);
      return;
    }
    if (loadedFor.current === session.userId) return;
    loadedFor.current = session.userId;
    store.load(session.userId);
    backend
      .getRoles(session.userId)
      .then((r) => setRoles(['attendee', ...r]))
      .catch(() => setRoles(['attendee']));
  }, [session]);

  const refreshContent = useCallback(async () => {
    try {
      const rows = await backend.fetchContentRows();
      writeJSON(CONTENT_CACHE, rows);
      setContentRows(rows);
    } catch {
      /* keep cached or default content */
    }
  }, []);

  const refreshLive = useCallback(async () => {
    try {
      const l = await backend.fetchLiveState();
      writeJSON(LIVE_CACHE, l);
      setLive(l);
    } catch {
      /* keep last known */
    }
  }, []);

  // Content once per session, live state on a slow poll (never a per-row subscription).
  useEffect(() => {
    if (!session) return;
    refreshContent();
    refreshLive();
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      t = setTimeout(async () => {
        if (document.visibilityState === 'visible') await refreshLive();
        tick();
      }, LIVE_POLL_MS + Math.random() * 15_000);
    };
    tick();
    const onVis = () => document.visibilityState === 'visible' && refreshLive();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearTimeout(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [session, refreshContent, refreshLive]);

  // "Logged in now" signal for the dashboard
  useEffect(() => {
    if (!session) return;
    const touch = () => navigator.onLine && backend.touch(session.userId).catch(() => {});
    touch();
    const i = setInterval(touch, TOUCH_MS);
    return () => clearInterval(i);
  }, [session]);

  const content = useMemo(() => mergeContent(contentRows), [contentRows]);
  const settings = useMemo(() => mergeSettings(live), [live]);

  const signOut = useCallback(async () => {
    await store.flush();
    await backend.signOut();
  }, []);

  const value: AppCtx = {
    backend,
    store,
    session,
    roles,
    content,
    contentRows,
    refreshContent,
    live,
    settings,
    refreshLive,
    signOut,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp outside AppProvider');
  return c;
}

export function useStoreState(): StoreState {
  return useSyncExternalStore(store.subscribe, store.getState);
}

/** Only call inside routes that render after data has loaded. */
export function useData(): UserData {
  const s = useStoreState();
  if (!s.data) throw new Error('Workbook data not loaded');
  return s.data;
}

export { store };
