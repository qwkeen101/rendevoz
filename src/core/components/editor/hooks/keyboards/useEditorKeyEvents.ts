import { IEditorInstance } from '~/typings'
import useEditorDeleteKey from '@/core/components/editor/hooks/keyboards/useEditorDeleteKey'
import useEditorArrowKey from '@/core/components/editor/hooks/keyboards/useEditorArrowKey'
import useEditorSelectAllKey from '@/core/components/editor/hooks/keyboards/useEditorSelectAllKey'
import useEditorTabKey from '@/core/components/editor/hooks/keyboards/useEditorTabKey'
import useEditorCopyKey from '@/core/components/editor/hooks/keyboards/useEditorCopyKey'
import useEditorSwitchModeKey from '@/core/components/editor/hooks/keyboards/useEditorSwitchModeKey'
import { useEffect } from 'react'
import useEditorMention from '@/core/components/editor/hooks/useEditorMention'
import useEditorSlashMenu from '@/core/components/editor/hooks/useEditorSlashMenu'

export default (instance: IEditorInstance) => {
  const handleDeleteKey = useEditorDeleteKey(instance)
  const handleArrowKey = useEditorArrowKey(instance)
  const handleSelectAllKey = useEditorSelectAllKey(instance)
  const handleTabKey = useEditorTabKey(instance)
  const handleCopyKey = useEditorCopyKey(instance)
  // const handleSwitchModeKey = useEditorSwitchModeKey(instance)
  const handleMentionKey = useEditorMention(instance)
  const handleSlashKey = useEditorSlashMenu(instance)
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      handleCopyKey(e)
      // handleSwitchModeKey(e)
      handleTabKey(e)
    }
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  }, [])
  return (e: KeyboardEvent) => {
    handleMentionKey(e)
    handleSlashKey(e)
    handleDeleteKey(e)
    handleArrowKey(e)
    handleSelectAllKey(e)
  }
}
