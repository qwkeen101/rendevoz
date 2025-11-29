export const isKeyboardEventCloseToInput = (e: KeyboardEvent) => {
  if (e.target instanceof HTMLElement) {
    if (e.target.closest('input,textarea,[contenteditable="true"]')) {
      return true
    }
  }
  return false
}
