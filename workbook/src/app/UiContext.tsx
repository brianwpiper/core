import { createContext, useContext, useState, type ReactNode } from 'react';

interface Ui {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  currentSection: string | null;
  setCurrentSection: (k: string | null) => void;
}

const Ctx = createContext<Ui | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  return (
    <Ctx.Provider
      value={{ drawerOpen, openDrawer: () => setOpen(true), closeDrawer: () => setOpen(false), currentSection, setCurrentSection }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useUi() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUi outside UiProvider');
  return c;
}
