import translations from '../locales/language.json';

const LANG_KEY = 'app_language';
const fallbackLang = 'en';
const availableLanguages = [
    { code: 'en', label: translations['English'] || 'English' },
    { code: 'am', label: translations['Amharic'] || 'Amharic' },
];

function getCurrentLanguage() {
    return localStorage.getItem(LANG_KEY) || fallbackLang;
}

function setCurrentLanguage(lang) {
    localStorage.setItem(LANG_KEY, lang);
}

function t(key) {
    const lang = getCurrentLanguage();
    // For now, only Amharic and English, fallback to key if not found
    if (lang === 'am' && translations[key]) return translations[key];
    return key;
}

export { t, getCurrentLanguage, setCurrentLanguage, availableLanguages }; 