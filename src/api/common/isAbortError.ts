export default (e: any) => {
  if (typeof e === 'object' && 'name' in e && typeof e.name === 'string') {
    if(e.name === 'AbortError'){
      return true
    }
  }
  return false
}
