import { IEditorInstance } from '~/typings'
import useEditorDeleteKey from '../hooks/keyboards/useEditorDeleteKey'
import useEditorArrowKey from '../hooks/keyboards/useEditorArrowKey'
import useEditorSelectAllKey from '../hooks/keyboards/useEditorSelectAllKey'
import useEditorTabKey from '../hooks/keyboards/useEditorTabKey'
import useEditorCopyKey from '../hooks/keyboards/useEditorCopyKey'
import useEditorSwitchModeKey from '../hooks/keyboards/useEditorSwitchModeKey'
import { useEffect } from 'react'
import useEditorMention from '../hooks/useEditorMention'
import useEditorSlashMenu from '../hooks/useEditorSlashMenu'

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
