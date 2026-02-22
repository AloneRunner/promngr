import { MatchEngine as ClassicEngine } from '../MatchEngine';
import { MatchEngine as IkinciEngine } from '../ikincimotor';
import { MatchEngine as UcuncuEngine } from '../ucuncumotor';

export type EngineKey = 'classic' | 'ikinc' | 'ucuncu';

export const AVAILABLE_ENGINES: Record<EngineKey, { id: EngineKey; name: string }> = {
    classic: { id: 'classic', name: 'Classic Engine' },
    ikinc: { id: 'ikinc', name: 'Ikincı Motor' },
    ucuncu: { id: 'ucuncu', name: 'Ucuncu Motor' }
};

// Guard localStorage access for Node test runs
let _stored: EngineKey | null = null;
try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
        _stored = (localStorage.getItem('matchEngineChoice') as EngineKey) || null;
    }
} catch (e) { _stored = null; }
let currentChoice: EngineKey = _stored || 'classic';

export const getEngineChoice = (): EngineKey => currentChoice;
export const setEngineChoice = (k: EngineKey) => {
    currentChoice = k;
    try { localStorage.setItem('matchEngineChoice', k); } catch (e) { /* ignore */ }
};

export const createEngineInstance = (key: EngineKey, ...args: any[]): any => {
    // FIX: Direkt ESM import kullan! Eski tryRequire() browser'da çalışmıyordu
    if (key === 'ucuncu') {
        return Reflect.construct(UcuncuEngine as any, args) as any;
    }
    if (key === 'ikinc') {
        return Reflect.construct(IkinciEngine as any, args) as any;
    }

    return Reflect.construct(ClassicEngine as any, args) as any;
};

export const EXTERNAL_FEEDBACK_URLS: Record<EngineKey, string | null> = {
    classic: null,
    ikinc: 'https://play.google.com/store/apps/details?id=com.pocketfootballmanager.game&hl=tr',
    ucuncu: 'https://play.google.com/store/apps/details?id=com.pocketfootballmanager.game&hl=tr'
};

export default {
    AVAILABLE_ENGINES,
    getEngineChoice,
    setEngineChoice,
    createEngineInstance
};
