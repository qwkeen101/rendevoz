export const highlightElementText = (ele: HTMLElement) => {
    if (window.getSelection) {
        var range = document.createRange()
        range.selectNodeContents(ele)
        window.getSelection()?.removeAllRanges()
        window.getSelection()?.addRange(range)
    }
}