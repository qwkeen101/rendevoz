import { Icon } from '@/components'
import classnames from 'classnames'

export default {
  TranslatedLangs: {
    en: 'English', // English
    'zh-CN': '简体中文', // Chinese (Mandarin)
    'zh-TW': '繁体中文',
    ja: '日本語', // Japanese
    ko: '한국어', // Korean
    vi: 'Tiếng Việt', // Vietnamese
    ru: 'Русский', // Russian
    de: 'Deutsch', // German
    tr: 'Türkçe', // Turkish
    it: 'Italiano', // Italian
    es: 'Español', // Spanish
    fr: 'Français', // French
    'pt-PT': 'Português', // Portuguese
    hi: 'हिन्दी', // Hindi
    ar: 'العربية', // Arabic
    bn: 'বাংলা', // Bengali
    ur: 'اردو', // Urdu
    id: 'Bahasa Indonesia', // Indonesian
    sw: 'Kiswahili' // Swahili
  } as Record<string, string>,
  LangFlags: {
    ar: '🇸🇦', // Arabic
    be: '🇧🇾', // Belarusian
    bg: '🇧🇬', // Bulgarian
    my: '🇲🇲', // Burmese (Myanmar)
    ckb: '🇮🇶', // Central Kurdish
    'zh-CN': '🇨🇳', // Chinese (China)
    'zh-TW': '🇨🇳', // Chinese (Taiwan)
    hr: '🇭🇷', // Croatian
    cs: '🇨🇿', // Czech
    bn: '🇧🇩',
    nl: '🇳🇱', // Dutch
    en: '🇺🇸', // English
    eo: '🌐', // Esperanto (no flag emoji)
    fi: '🇫🇮', // Finnish
    fr: '🇫🇷', // French
    gl: '🇪🇸', // Galician (Spain)
    de: '🇩🇪', // German
    el: '🇬🇷', // Greek
    iw: '🇮🇱', // Hebrew
    hi: '🇮🇳', // Hindi
    hu: '🇭🇺', // Hungarian
    id: '🇮🇩', // Indonesian
    it: '🇮🇹', // Italian
    ja: '🇯🇵', // Japanese
    ko: '🇰🇷', // Korean
    ku: '🇮🇶', // Kurdish
    lt: '🇱🇹', // Lithuanian
    mk: '🇲🇰', // Macedonian
    mr: '🇮🇳', // Marathi
    fa: '🇮🇷', // Persian
    pl: '🇵🇱', // Polish
    'pt-BR': '🇧🇷', // Portuguese (Brazil)
    'pt-PT': '🇵🇹', // Portuguese (Portugal)
    ro: '🇷🇴', // Romanian
    ru: '🇷🇺', // Russian
    sr: '🇷🇸', // Serbian
    sk: '🇸🇰', // Slovak
    es: '🇪🇸', // Spanish
    sv: '🇸🇪', // Swedish
    te: '🇮🇳', // Telugu
    th: '🇹🇭', // Thai
    tr: '🇹🇷', // Turkish
    uk: '🇺🇦', // Ukrainian
    vi: '🇻🇳', // Vietnamese
    da: '🇩🇰', // Danish
    af: '🇿🇦', // Afrikaans
    sq: '🇦🇱', // Albanian
    am: '🇪🇹', // Amharic
    az: '🇦🇿', // Azerbaijani
    bs: '🇧🇦', // Bosnian
    ca: '🇪🇸', // Catalan (Spain flag; no Catalonia emoji)
    et: '🇪🇪', // Estonian
    eu: '🇪🇸', // Basque (also Spain)
    ga: '🇮🇪', // Irish
    gu: '🇮🇳', // Gujarati
    hy: '🇦🇲', // Armenian
    ka: '🇬🇪', // Georgian
    kk: '🇰🇿', // Kazakh
    km: '🇰🇭', // Khmer
    kn: '🇮🇳', // Kannada
    ky: '🇰🇬', // Kyrgyz
    lo: '🇱🇦', // Lao
    lv: '🇱🇻', // Latvian
    ml: '🇮🇳', // Malayalam
    mn: '🇲🇳', // Mongolian
    ms: '🇲🇾', // Malay
    ne: '🇳🇵', // Nepali
    no: '🇳🇴', // Norwegian
    pa: '🇮🇳', // Punjabi (India flag chosen)
    si: '🇱🇰', // Sinhala
    sl: '🇸🇮', // Slovenian
    so: '🇸🇴', // Somali
    sw: '🇹🇿', // Swahili (Tanzania)
    ta: '🇮🇳', // Tamil
    ur: '🇵🇰', // Urdu
    uz: '🇺🇿', // Uzbek
    'zh-HK': '🇭🇰' // Chinese (Hong Kong)
  } as Record<string, string>,
  renderSelect: (selected?: boolean) => {
    return (
      <div
        className={classnames(
          'border-solid rounded-full size-4 ml-auto',
          selected && 'bg-amber-300 flex items-center justify-center text-black'
        )}
      >
        {selected && <Icon size={11} strokeWidth={6} name='park-check-small' />}
      </div>
    )
  }
}
