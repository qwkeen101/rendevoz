import codes from '../CountryCodes.json'
export default () => {
  const code = new Intl.Locale(navigator.language).region?.toLowerCase()
  if (codes.some(i => i.value === code)) {
    return code
  }
  return 'us'
}
