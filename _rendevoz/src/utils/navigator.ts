export const getDefaultLanguage = (): 'en-US' | 'zh-CN' => {
  // only 2 languages right now
  return navigator.language === 'zh-CN' ? navigator.language : 'en-US'
}
