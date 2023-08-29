import { assignProperties } from '@/utils'
import { loopProcess } from '@/utils/functions'
import Id from '@/utils/id'
import { useMemo, useState } from 'react'
import { GlobalInstances, INote, MetaObject } from '~/typings'
import { transformMarkdown } from '../editor/plugins/deserializeMarkdown'
import { CollectionStore, NoteStore, ObjectStore } from '@/stores'
import { getFilenameWithoutExtension } from '@/utils/file'
import { createPortal } from 'react-dom'
import ClassName from '@/styles/classNames'
import { Content, Icon } from '@/components'
import { useTranslation } from 'react-i18next'
import FontSize from '@/consts/font'
import { Rendevoz } from '../rendevoz'
import Colors from '@/consts/colors'
import { css } from '@emotion/css'
import { ipcInstance } from '@/plugins'
import importmarkdown from '@/core/global/imports/importmarkdown'
import importpdf from '@/core/global/imports/importpdf'
import importvideo from '@/core/global/imports/importvideo'

export const GlobalImporterInstance: GlobalInstances.NoteImporterInstance = {}

const fetchSubtitleOfVideo = async (path: string) => {
  const res = await ipcInstance.send('getVideoSubtitle')
  return res.data
}

const getFileType = (file: File) => {
  const { name, type } = file
  if (type.startsWith('video')) return 'video'
  if (type.endsWith('pdf')) return 'pdf'
  const ext = name.split('.').pop()
  switch (ext) {
    case 'md':
      return 'markdown'
  }
}
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
      const filtered = arrFiles.filter(file => {
        const filetype = getFileType(file)
        if (filetype) return true
        return false
      })
      filtered.forEach(file => Object.assign(file, { id: Id.getId() }))
      setNotes(n => [
        ...n,
        ...filtered.map(file => ({
          id: file.id,
          name: file.name,
          completed: false
        }))
      ])
      const groupedDir: number[] = []
      loopProcess(
        filtered,
        async (file, index) => {
          try {
            const type = getFileType(file)
            let result: MetaObject | undefined = undefined
            if (type) {
              switch (type) {
                case 'markdown':
                  result = await importmarkdown(file)
                  break
                case 'pdf':
                  result = await importpdf(file)
                  break
                case 'video':
                  result = await importvideo(file)
                  break
              }
            }
            if (result) {
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
            }
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
      <div
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
      </div>
    ),
    document.body
  )
}

export default GlobalImporter
