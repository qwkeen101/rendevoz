import { useEffect } from 'react'
import useEditorCopyKey from '@/core/components/editor/hooks/keyboards/useEditorCopyKey'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'

export default () => {
  const instance = useEditorInstance()
  const handleCopyKey = useEditorCopyKey(instance)
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      handleCopyKey(e)
    }
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  }, [])
}
