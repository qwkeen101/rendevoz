import { assignProperties } from '@/utils'
import { loopProcess } from '@/utils/functions'
import Id from '@/utils/id'
import { useMemo, useState } from 'react'
import { GlobalInstances, INote, MetaObject } from '~/typings'
import { transformMarkdown } from '../components/editor/plugins/deserializeMarkdown'
import { CollectionStore, NoteStore, ObjectStore } from '@/api/stores'
import { getFilenameWithoutExtension } from '@/utils/file'
import { createPortal } from 'react-dom'
import ClassName from '@/styles/classNames'
import { Content, Icon, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import FontSize from '@/consts/font'
import { Rendevoz } from '../rendevoz'
import Colors from '@/consts/colors'
import { css } from '@emotion/css'
import { ipcInstance } from '@/plugins'
import importMarkdown from '@/core/rendevoz/utils/localImport/importMarkdown'
import importPDF from '@/core/rendevoz/utils/localImport/importPDF'
import importVideo from '@/core/rendevoz/utils/localImport/importVideo'

export const GlobalImporterInstance: GlobalInstances.NoteImporterInstance = {}

const GlobalImporter = () => {
  const { t } = useTranslation()
  const [notes, setNotes] = useState<
    {
      id: number
      name: string
      completed: boolean
      success?: boolean
      objectId?: number
      metaId?: number
    }[]
  >([])
  const [importerState, setImporterState] = useState({
    visible: false,
    completed: true
  })
  assignProperties(GlobalImporterInstance, {
    import: (files, opts) => {
      setImporterState(s => ({ ...s, visible: true, completed: false }))
      const arrFiles = (Array.isArray(files) ? files : [files]) as (File & {
        id: number
      })[]
      arrFiles.forEach(file => Object.assign(file, { id: Id.getId() }))
      setNotes(n => [
        ...n,
        ...arrFiles.map(file => ({
          id: file.id,
          name: file.name,
          completed: false
        }))
      ])
      const groupedDir: number[] = []
      loopProcess(
        arrFiles,
        async file => {
          try {
            const res = await Rendevoz.Utils.Meta.normalizeLocalFileToMeta(file, { limitType: false })
            if (res) {
              const result = (await ObjectStore(res.meta.type).addOneWithMeta(res.object, { currentMeta: res.meta })).meta
              if (!result) throw ''
              opts?.onImport?.(result)
              groupedDir.push(result.id)
              setNotes(s => {
                const noteIdx = s.findIndex(i => i.id === file.id)
                const currNote = s[noteIdx]
                s.splice(noteIdx, 1, {
                  ...currNote,
                  completed: true,
                  success: true,
                  metaId: result.id
                })
                return [...s]
              })
              return
            }
            throw ''
          } catch (e) {
            setNotes(s => {
              const noteIdx = s.findIndex(i => i.id === file.id)
              const currNote = s[noteIdx]
              s.splice(noteIdx, 1, {
                ...currNote,
                completed: true,
                success: false
              })
              return [...s]
            })
            return Promise.resolve()
          }
        },
        {
          onEnd: () => {
            setImporterState(s => ({ ...s, completed: true }))
            if (opts?.isDir) {
              CollectionStore.addCollection({
                name: opts?.dirName || 'Unnamed Collection',
                parentId: 0,
                items: groupedDir.map(i => ({ type: 'meta', id: i }))
              })
            }
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
      <WithBorder
        style={{
          position: 'fixed',
          zIndex: 100,
          bottom: 30,
          right: 30,
          padding: 4,
          borderRadius: 8,
          minWidth: 300,
          maxWidth: 400
        }}
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
            {t('general.import details', {
              total: notes.length,
              success,
              fail
            })}
          </div>
        ) : null}
        <Content style={{ height: '100%', overflowY: 'auto', maxHeight: 240 }}>
          {notes.map(i => {
            const loading = !i.success && !i.completed
            return (
              <Content
                key={i.id}
                onClick={() => {
                  if (i.success && i.metaId) {
                    Rendevoz.Actions.Open.Meta.openMetaObject(i.metaId)
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
                <div
                  style={{
                    marginLeft: 'auto',
                    color: i.success ? Colors.Common.Green : loading ? undefined : Colors.Common.Red
                  }}
                >
                  <Icon spin={loading} name={i.success ? 'park-check' : i.completed ? 'park-close' : 'park-loading-four'} />
                </div>
              </Content>
            )
          })}
        </Content>
      </WithBorder>
    ),
    document.body
  )
}

export default GlobalImporter
