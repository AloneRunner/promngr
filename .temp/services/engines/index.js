import { MatchEngine as ClassicEngine } from '../MatchEngine';
// Placeholder alternative engine. Replace contents of ../ucuncumotor.ts with your custom engine implementation.
import { MatchEngine as UcuncuEngine } from '../ucuncumotor';
export const AVAILABLE_ENGINES = {
    classic: { id: 'classic', name: 'Classic Engine' },
    ikinc: { id: 'ikinc', name: 'Ikincı Motor' },
    ucuncu: { id: 'ucuncu', name: 'Ucuncu Motor' }
};
// Guard localStorage access for Node test runs
let _stored = null;
try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
        _stored = localStorage.getItem('matchEngineChoice') || null;
    }
}
catch (e) {
    _stored = null;
}
let currentChoice = _stored || 'classic';
export const getEngineChoice = () => currentChoice;
export const setEngineChoice = (k) => {
    currentChoice = k;
    try {
        localStorage.setItem('matchEngineChoice', k);
    }
    catch (e) { /* ignore */ }
};
export const createEngineInstance = (key, ...args) => {
    if (key === 'ucuncu')
        return new UcuncuEngine(...args);
    if (key === 'ikinc') {
        // Dynamic import of ikinci motor - if file missing, fallback to ClassicEngine
        try {
            // require to avoid top-level cyclic imports
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const im = require('../ikincimotor');
            if (im && im.MatchEngine)
                return new im.MatchEngine(...args);
        }
        catch (e) {
            // fallback
        }
        return new ClassicEngine(...args);
    }
    return new ClassicEngine(...args);
};
export const EXTERNAL_FEEDBACK_URLS = {
    classic: null,
    // Play Store listing for the app (provided by user)
    ikinc: 'https://play.google.com/store/apps/details?id=com.pocketfootballmanager.game&hl=tr',
    ucuncu: null
};
export default {
    AVAILABLE_ENGINES,
    getEngineChoice,
    setEngineChoice,
    createEngineInstance
};
