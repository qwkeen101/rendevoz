import { useState } from 'react'

export default () => {
  const [currentPanel, setCurrentPanel] = useState<{
    visible: boolean
    panel: 'collection' | 'tag' | 'group'
  }>()
  return <div></div>
}
