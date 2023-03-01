import { Content, Icon, Image } from '@/components'
import { DATE_FORMAT } from '@/consts/format'
import { KEY } from '@/consts/key'
import useScopedEventEmitter from '@/events/useEventEmitter'
import { useTheme } from '@/hooks'
import createMetaStore from '@/stores/meta.store'
import Id from '@/utils/id'
import { saveImageLocally } from '@/utils/img'
import { css } from '@emotion/css'
import { format } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { useState, ChangeEventHandler, MouseEventHandler, useRef, KeyboardEventHandler } from 'react'
import { useToggle } from 'react-use'
import { MetaKnowledgeObject } from '~/typings/data'
import MetaCommentContainer from './MetaCommentContainer'
import MetaNoteContainer from './MetaNoteContainer'

const MetaDetailsCard = ({
  obj,
  onNoteClick,
  onMetaGraphClick,
  onMetaDelete
}: {
  obj?: MetaKnowledgeObject
  onNoteClick?: React.MouseEventHandler
  onMetaGraphClick?: React.MouseEventHandler
  onMetaDelete?: React.MouseEventHandler
}) => {
  const [toolbarVisible, setToolbarVisible] = useState(false)
  const [addCommentVisible, toggleAddCommentVisible] = useToggle(false)
  const { updateMetaObject, deleteMetaObject } = createMetaStore()
  const emitter = useScopedEventEmitter()
  const { defaultFontColorGrey } = useTheme('defaultFontColorGrey')
  const titleRef = useRef<HTMLDivElement>(null)
  const handleUploadCover: ChangeEventHandler<HTMLInputElement> = e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image')) return
    saveImageLocally(Id.getStrId(), file).then(data => {
      updateMetaObject({
        id: obj?.id,
        coverImgSrc: data.data
      })
    })
  }
  const handleAddNote = () => {
    const noteId = Id.getId()
    updateMetaObject({
      id: obj?.id,
      noteIds: obj?.noteIds ? [...obj.noteIds, noteId] : [noteId]
    })
    emitter.emit('editor', {
      type: 'insertTab',
      data: {
        isNew: true,
        noteId
      }
    })
  }
  const handleOpenGraph = () => {
    onMetaGraphClick?.()
    emitter.emit('graph', {
      type: 'toggleGlobalGraph',
      data: {
        centerNode: { id: obj?.id }
      }
    })
  }
  const handleRename = () => {
    const title = titleRef.current
    if (title) {
      title.setAttribute('contenteditable', 'true')
      title.focus()
      title.style.background = 'rgba(0,0,0,0.06)'
      window.getSelection()?.selectAllChildren(title)
      window.getSelection()?.collapseToEnd()
    }
  }
  const handleTitleKeydown: KeyboardEventHandler = e => {
    if (e.key === KEY.Enter) {
      e.preventDefault()
      e.stopPropagation()
      const titleEle = titleRef.current
      if (titleEle) {
        titleEle.setAttribute('contenteditable', 'false')
        titleEle.blur()
        titleEle.style.background = 'none'
        const text = titleEle.textContent
        updateMetaObject({
          id: obj?.id,
          keyword: text
        })
      }
    }
  }
  const handleDeleteMetaObject: MouseEventHandler = e => {
    obj && deleteMetaObject(obj.id)
    onMetaDelete?.(e)
  }
  return (
    <Content
      flex
      gap={20}
      className={css({
        padding: '18px 16px',
        minWidth: 250,
        maxWidth: 800,
        minHeight: 152,
        maxHeight: 400,
        overflowY: 'auto'
      })}
    >
      <input style={{ display: 'none' }} onChange={handleUploadCover} type="file" id="file-upload" accept="image/*" />
      {obj?.coverImgSrc && (
        <Content flex alignItems="flex-start">
          <Image
            width={128}
            className={css({ borderRadius: 12, overflow: 'hidden', margin: 4, boxShadow: 'rgba(149, 157, 165, 0.4) 0px 8px 24px ' })}
            src={obj?.coverImgSrc}
          />
        </Content>
      )}
      <Content flex column fullHeight>
        <Content flex column onMouseLeave={() => setToolbarVisible(false)}>
          <div
            ref={titleRef}
            onMouseEnter={() => setToolbarVisible(true)}
            onKeyDown={handleTitleKeydown}
            className={css({
              fontWeight: 600,
              fontSize: 20,
              minWidth: 380,
              lineHeight: '20px',
              marginBottom: 4,
              outline: 'none',
              padding: '4px 2px',
              borderRadius: 4,
              transition: 'all 0.2s ease'
            })}
          >
            {obj?.keyword}
          </div>
          <AnimatePresence exitBeforeEnter>
            {toolbarVisible ? (
              <motion.div
                key="toolbar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={css({
                  color: defaultFontColorGrey,
                  fontSize: 14,
                  display: 'flex',
                  flexWrap: 'wrap',
                  rowGap: 5,
                  columnGap: 10,
                  width: 380
                })}
              >
                <label
                  htmlFor="file-upload"
                  className={css({
                    flex: '0 0 calc(33% - 10px)',
                    maxWidth: 120
                  })}
                >
                  <Content
                    gap={4}
                    flex
                    alignItems="center"
                    className={css({
                      cursor: 'pointer',
                      borderRadius: 4,
                      transition: 'inherit',
                      padding: 4,
                      ':hover': {
                        background: 'rgba(0,0,0,0.06)'
                      }
                    })}
                  >
                    <Icon name="park-new-picture" />
                    <span>Add cover</span>
                  </Content>
                </label>
                {!addCommentVisible && !obj?.commentIds?.length && (
                  <Content
                    flex
                    alignItems="center"
                    gap={4}
                    onClick={toggleAddCommentVisible}
                    className={css({
                      cursor: 'pointer',
                      borderRadius: 4,
                      padding: 4,
                      maxWidth: 120,
                      transition: 'inherit',
                      flex: '0 0 calc(33% - 10px)',
                      ':hover': {
                        background: 'rgba(0,0,0,0.06)'
                      }
                    })}
                  >
                    <Icon name="park-message" />
                    <span>Add comment</span>
                  </Content>
                )}
                <Content
                  gap={4}
                  flex
                  alignItems="center"
                  onClick={handleAddNote}
                  className={css({
                    cursor: 'pointer',
                    borderRadius: 4,
                    transition: 'inherit',
                    maxWidth: 120,
                    padding: 4,
                    flex: '0 0 calc(33% - 10px)',
                    ':hover': {
                      background: 'rgba(0,0,0,0.06)'
                    }
                  })}
                >
                  <Icon name="park-notes" />
                  <span>Add Note</span>
                </Content>
                <Content
                  gap={4}
                  flex
                  alignItems="center"
                  onClick={handleOpenGraph}
                  className={css({
                    cursor: 'pointer',
                    borderRadius: 4,
                    transition: 'inherit',
                    maxWidth: 120,
                    flex: '0 0 calc(33% - 10px)',
                    padding: 4,
                    ':hover': {
                      background: 'rgba(0,0,0,0.06)'
                    }
                  })}
                >
                  <Icon name="park-relational-graph" />
                  <span>Open graph</span>
                </Content>
                <Content
                  gap={4}
                  flex
                  alignItems="center"
                  onClick={handleRename}
                  className={css({
                    cursor: 'pointer',
                    borderRadius: 4,
                    transition: 'inherit',
                    flex: '0 0 calc(33% - 10px)',
                    maxWidth: 120,
                    padding: 4,
                    ':hover': {
                      background: 'rgba(0,0,0,0.06)'
                    }
                  })}
                >
                  <Icon name="park-write" />
                  <span>Rename</span>
                </Content>
                <Content
                  gap={4}
                  flex
                  alignItems="center"
                  onClick={handleDeleteMetaObject}
                  className={css({
                    cursor: 'pointer',
                    borderRadius: 4,
                    transition: 'inherit',
                    flex: '0 0 calc(33% - 10px)',
                    maxWidth: 120,
                    color: '#e0245e',
                    padding: 4,
                    ':hover': {
                      background: 'rgba(0,0,0,0.06)'
                    }
                  })}
                >
                  <Icon name="park-delete" />
                  <span>Delete</span>
                </Content>
              </motion.div>
            ) : (
              <motion.div
                key="details"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={css({
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  color: defaultFontColorGrey,
                  fontSize: 12
                })}
              >
                {obj && (
                  <>
                    <div>Created at: {format(obj.createdAt, DATE_FORMAT.DefaultFormat)}</div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Content>
        <MetaNoteContainer onNoteClick={onNoteClick} obj={obj} />
        {(addCommentVisible || (obj?.commentIds && obj?.commentIds?.length > 0)) && <MetaCommentContainer obj={obj} />}
      </Content>
    </Content>
  )
}
export default MetaDetailsCard
