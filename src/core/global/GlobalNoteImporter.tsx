import { assignProperties } from '@/utils'
import { loopProcess } from '@/utils/functions'
import Id from '@/utils/id'
import { useMemo, useState } from 'react'
import { GlobalInstances, INote } from '~/typings'
import { transformMarkdown } from '../editor/plugins/deserializeMarkdown'
import { NoteStore, ObjectStore } from '@/stores'
import { getFilenameWithoutExtension } from '@/utils/file'
import { createPortal } from 'react-dom'
import ResizeAndDrag from '@/components/base/ResizeAndDrag'
import ClassName from '@/styles/classNames'
import { Content, Icon } from '@/components'
import { useTranslation } from 'react-i18next'
import FontSize from '@/consts/font'
import { Rendevoz } from '../rendevoz'
import Colors from '@/consts/colors'
import { css } from '@emotion/css'

export const GlobalNoteImporterInstance: GlobalInstances.NoteImporterInstance = {}

const GlobalNoteImporter = () => {
  const { t } = useTranslation()
  const [notes, setNotes] = useState<
    {
      id: number
      name: string
      completed: boolean
      success?: boolean
      objectId?: number
      // progress: number
    }[]
  >([])
  const [importerState, setImporterState] = useState({
    visible: false,
    completed: true
  })
  assignProperties(GlobalNoteImporterInstance, {
    import: files => {
      setImporterState(s => ({ ...s, visible: true, completed: false }))
      const arrFiles = (Array.isArray(files) ? files : [files]) as (File & { id: number })[]
      arrFiles.forEach(file => Object.assign(file, { id: Id.getId() }))
      setNotes(n => [
        ...n,
        ...arrFiles.map(file => ({
          id: file.id,
          name: file.name,
          completed: false
        }))
      ])
      loopProcess(
        arrFiles,
        async (file, index) => {
          try {
            const result = await transformMarkdown(file)
            let note: INote | undefined = undefined
            if (result) {
              const contentId = await NoteStore.saveNoteAsBuffer(result)
              const truncatedName = getFilenameWithoutExtension(file.name)
              note = (
                await ObjectStore('note').addOneWithMeta(
                  { title: truncatedName, contentId },
                  { currentMeta: { name: truncatedName, type: 'note' }, silent: true }
                )
              ).one
            }
            setNotes(s => {
              const noteIdx = s.findIndex(i => i.id === file.id)
              const currNote = s[noteIdx]
              s.splice(noteIdx, 1, { ...currNote, completed: true, success: note ? true : false, objectId: note?.id })
              return [...s]
            })
          } catch (e) {
            setNotes(s => {
              const noteIdx = s.findIndex(i => i.id === file.id)
              const currNote = s[noteIdx]
              s.splice(noteIdx, 1, { ...currNote, completed: true, success: false })
              return [...s]
            })
            return Promise.resolve()
          }
        },
        {
          onEnd: () => {
            setImporterState(s => ({ ...s, completed: true }))
          }
        }
      )
    }
  })
  const { visible, completed } = importerState
  const { success, fail } = useMemo(() => {
    const success = notes.filter(i => i.success).length
    const fail = notes.length - success
    return { success, fail }
  }, [notes])
  return createPortal(
    visible && (
      <div
        style={{ position: 'fixed', zIndex: 100, bottom: 30, right: 30, padding: 4, borderRadius: 8, minWidth: 300, maxWidth: 400 }}
        className={ClassName.Background.pseudoBlubBackground}
      >
        <Content flex alignItems="center" fullWidth gap={12} style={{ padding: '6px 8px' }} className={ClassName.title(FontSize['15px'])}>
          {completed ? <Icon name="park-check" /> : <Icon name="park-loading-four" spin />}
          <div>{completed ? t('general.import completed') : t('general.importing')}</div>
          <Icon
            name="park-close"
            className={ClassName.circleButton()}
            containerStyle={{ marginLeft: 'auto' }}
            onClick={() => setImporterState(s => ({ ...s, visible: false }))}
          />
        </Content>
        {notes.length && completed ? (
          <div style={{ margin: '0px 8px 6px' }} className={ClassName.description(FontSize['12px'])}>
            {t('general.import details', { total: notes.length, success, fail })}
          </div>
        ) : null}
        <Content style={{ height: '100%', overflowY: 'auto', maxHeight: 240 }}>
          {notes.map(i => {
            const loading = !i.success && !i.completed
            return (
              <Content
                key={i.id}
                onClick={() => {
                  if (i.success && i.objectId) {
                    Rendevoz.Actions.Open.Editor.openEditor(i.objectId)
                  }
                }}
                flex
                alignItems="center"
                gap={20}
                className={ClassName.flatButton()}
              >
                <div className={css([ClassName.title(FontSize['14px']), ClassName.ellipsisFont(1)])} style={{ textTransform: 'none' }}>
                  {i.name}
                </div>
                <div style={{ marginLeft: 'auto', color: i.success ? Colors.Common.Green : loading ? undefined : Colors.Common.Red }}>
                  <Icon spin={loading} name={i.success ? 'park-check' : i.completed ? 'park-close' : 'park-loading-four'} />
                </div>
              </Content>
            )
          })}
        </Content>
      </div>
    ),
    document.body
  )
}

export default GlobalNoteImporter
