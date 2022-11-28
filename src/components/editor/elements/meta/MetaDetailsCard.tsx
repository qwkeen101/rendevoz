import { Content, Icon, Image } from '@/components'
import { DATE_FORMAT } from '@/consts/format'
import useEventEmitter from '@/events/useEventEmitter'
import { useTheme } from '@/hooks'
import useMetaStore from '@/stores/meta.store'
import Id from '@/utils/id'
import { saveImageLocally } from '@/utils/img'
import { css } from '@emotion/css'
import { format } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { useState, ChangeEventHandler } from 'react'
import { useToggle } from 'react-use'
import { MetaKnowledgeObject } from '~/typings/data'
import MetaCommentContainer from './MetaCommentContainer'
import MetaNoteContainer from './MetaNoteContainer'

const MetaDetailsCard = ({ obj, onNoteClick }: { obj?: MetaKnowledgeObject; onNoteClick?: React.MouseEventHandler }) => {
  const [toolbarVisible, setToolbarVisible] = useState(false)
  const [addCommentVisible, toggleAddCommentVisible] = useToggle(false)
  const { updateMetaObject } = useMetaStore()
  const emitter = useEventEmitter()
  const { defaultFontColorGrey } = useTheme('defaultFontColorGrey')
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
  return (
    <Content
      flex
      gap={20}
      className={css({
        padding: '18px 16px',
        minWidth: 250,
        maxWidth: 600,
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
            onMouseEnter={() => setToolbarVisible(true)}
            className={css({
              fontWeight: 600,
              fontSize: 20,
              lineHeight: '20px',
              marginBottom: 4
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
                  gap: 10
                })}
              >
                <label htmlFor="file-upload">
                  <Content
                    gap={4}
                    flex
                    centered
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
                    centered
                    gap={4}
                    onClick={toggleAddCommentVisible}
                    className={css({
                      cursor: 'pointer',
                      borderRadius: 4,
                      padding: 4,
                      transition: 'inherit',
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
                  centered
                  onClick={handleAddNote}
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
                  <Icon name="park-notes" />
                  <span>Add Note</span>
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
