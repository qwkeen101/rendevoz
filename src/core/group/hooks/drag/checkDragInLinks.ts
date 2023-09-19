const checkDragInLinks = (e: PointerEvent) => {
  const target = e.target
  if (target instanceof HTMLElement) {
    const cloest = target.closest('[data-table-in-link], [data-table-out-link]')
    if (cloest) {
      const type = cloest.hasAttribute('data-table-in-link') ? 'in' : 'out'
      const targetMeta = Number(type === 'in' ? cloest.getAttribute('data-table-in-link') : cloest.getAttribute('data-table-out-link'))
      if (targetMeta) return type
    }
  }
  return false
}

export default checkDragInLinks
