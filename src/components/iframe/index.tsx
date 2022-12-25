import { FC, useEffect, useRef } from 'react'
import { Content } from '../base'
function iframeURLChange(iframe, callback) {
  let lastDispatched = null

  const dispatchChange = function () {
    const newHref = iframe.contentWindow.location.href

    if (newHref !== lastDispatched) {
      callback(newHref)
      lastDispatched = newHref
    }
  }

  const unloadHandler = function () {
    // Timeout needed because the URL changes immediately after
    // the `unload` event is dispatched.
    setTimeout(dispatchChange, 0)
  }

  function attachUnload() {
    // Remove the unloadHandler in case it was already attached.
    // Otherwise, there will be two handlers, which is unnecessary.
    iframe.contentWindow.removeEventListener('unload', unloadHandler)
    iframe.contentWindow.addEventListener('unload', unloadHandler)
  }

  iframe.addEventListener('load', function () {
    attachUnload()

    // Just in case the change wasn't dispatched during the unload event...
    dispatchChange()
  })

  attachUnload()
}
const IFrame: FC<{
  src: string
}> = ({ src }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const frame = iframeRef.current
    if (frame) {
      iframeURLChange(frame, newUrl => {
        console.log(newUrl)
      })
      frame.onload = () => {
        const doc = frame.contentWindow?.document
        doc?.addEventListener('click', e => console.log(e))
        doc?.addEventListener('copy', e => console.log(e))
        // frame.src="https://www.baidu.com"
        // frame.contentWindow?.history.pushState({}, '', 'https://www.baidu.com')
      }
    }
  }, [])
  return (
    <Content flex column fullHeight fullWidth>
      <div></div>
      <iframe ref={iframeRef} src={src} style={{ height: '100%', width: '100%', border: 'none' }} />
    </Content>
  )
}

export default IFrame
