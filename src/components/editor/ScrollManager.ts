class ScrollManager {
  private scrollElement: HTMLElement | null = null

  registerScrollElement(scrollElement: HTMLElement) {
    this.scrollElement = scrollElement
  }
}

export default ScrollManager
