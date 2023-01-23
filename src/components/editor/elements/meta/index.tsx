import { AnimatePopover, Content, Icon, IconWithPopover, Image, WithBorder } from '@/components/base'
import Modal from '@/components/base/Modal'
import EditMetaObjectForm from '@/components/form/EditMetaObjectForm'
import { GlobalGraphInstance } from '@/components/graph/GlobalGraph'
import { typeToTypeRecord } from '@/components/knowledgeDatabase/card/DatabaseCard'
import { useTheme, useToggle } from '@/hooks'
import { GlobalScope } from '@/jotai/jotaiScope'
import useMetaStore, { metaObjectsAtom, relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import { notesAtom } from '@/stores/note.store'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { AnimatePresence, motion } from 'framer-motion'
import { atom, useAtomValue } from 'jotai'
import { FC, memo, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { RenderElementProps } from 'slate-react'
import { MetaObject as MetaObjectType } from '~/typings/data'
import { useSlate } from '../../slate-react'
import { MetaObjectElement } from '../../types/outerElementTypes'
import NoteCard from '../cards/NoteCard'

const MetaObject: FC<RenderElementProps> = memo(({ children, element }) => {
  const metaEle = element as MetaObjectElement
  const { originId } = metaEle
  const editor = useSlate()
  const { updateMetaObject } = useMetaStore()
  const metaAtom = useMemo(() => (originId ? atom(get => get(metaObjectsAtom).get(originId)) : atom(null)), [originId])
  const metaObject = useAtomValue(metaAtom, GlobalScope)
  const related = useAtomValue(relatedMetaObjectsMapAtom, GlobalScope)
  const relatedSet = metaObject?.id ? related.get(metaObject.id) : null
  const relatedObjectsAtom = useMemo(
    () =>
      relatedSet && relatedSet.size > 0
        ? atom(get => {
            const map = get(metaObjectsAtom)
            const items = Array.from(relatedSet.keys())
              .map(i => map.get(i))
              .filter(i => i !== undefined) as MetaObjectType[]
            return items
          })
        : atom(null),
    [relatedSet]
  )
  const relatedObjects = useAtomValue(relatedObjectsAtom, GlobalScope)

  const hasDescription = metaObject?.description
  const alsoMentionedSize = relatedObjects?.filter(i => (i.type === 'note' || i.type === 'pdf') && i.objectId !== editor.noteId).length
  const relatedObjectsSize = relatedObjects?.filter(i => i.type === 'normal' || i.type === 'noteElement' || i.type === 'pdfElement').length
  const [showRelated, toggleShowRelated] = useToggle(false)
  const [showRelatedObjects, toggleShowRelatedObjects] = useToggle(false)
  const [editMetaVisible, toggleEditMetaVisible] = useToggle(false)
  const renderMain = () => (
    <Content
      className={css([
        {
          padding: hasDescription ? 4 : 2,
          cursor: 'pointer',
          gap: 7,
          borderRadius: 4,
          width: 'max(100%, 400px)',
          paddingLeft: 12
        },
        ClassName.title('13px')
      ])}
      centered
      contentEditable={false}
    >
      <Content flex column>
        <Content flex justifyContent="space-between" alignItems="center">
          <div className={ClassName.tag(ClassName.TagBackgrounds.grey)} style={{ textTransform: 'uppercase' }}>
            {typeToTypeRecord[metaObject?.type || 'normal']}
          </div>
          <IconWithPopover
            style={{ marginLeft: 10 }}
            className={ClassName.circleButton()}
            name="park-more"
            content={
              <WithBorder
                style={{ padding: 4, width: 150, backdropFilter: 'saturate(1.5) blur(5px)', background: 'rgba(255,255,255,0.8)' }}
              >
                <Content flex column gap={3} className={ClassName.defaultFont()}>
                  <Content
                    className={ClassName.flatButton()}
                    flex
                    gap={15}
                    onClick={() => metaObject && GlobalGraphInstance?.open(metaObject)}
                  >
                    <Icon name="park-relational-graph" />
                    Graph
                  </Content>
                  <Content className={ClassName.flatButton()} flex gap={15} onClick={toggleEditMetaVisible}>
                    <Icon name="park-edit" />
                    Edit
                  </Content>
                </Content>
              </WithBorder>
            }
          />
        </Content>
        <span className={css([ClassName.title('18px'), ClassName.ellipsisFont(1)], ClassName.flexLayout('center', 'flex-start'))}>
          {metaObject?.name}
        </span>
        {metaObject?.description && <span className={ClassName.description()}>{metaObject?.description}</span>}
        <span
          className={css([ClassName.description('12px'), ClassName.flatButton(undefined, '0px 4px')])}
          style={{ display: 'flex', gap: 2, marginLeft: -18, alignItems: 'center', marginTop: 6, width: 'fit-content' }}
          onClick={toggleShowRelated}
        >
          <Icon
            theme="filled"
            size={13}
            name="park-right-one"
            style={{ transform: showRelated ? 'rotate(90deg)' : undefined, transition: 'transform 0.3s ease' }}
          />
          <span>Also mentioned at {alsoMentionedSize} places</span>
        </span>
        <AnimatePresence>
          {showRelated && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              {relatedObjects?.map(i => {
                if (i.type === 'note' && i.objectId !== editor.noteId) {
                  return <RelatedNote noteId={i.objectId} />
                }
                return null
              })}
            </motion.div>
          )}
        </AnimatePresence>
        <span
          className={css([ClassName.description('12px'), ClassName.flatButton(undefined, '0px 4px')])}
          style={{ display: 'flex', gap: 2, marginLeft: -18, alignItems: 'center', marginTop: 6, width: 'fit-content' }}
          onClick={toggleShowRelatedObjects}
        >
          <Icon
            theme="filled"
            size={13}
            name="park-right-one"
            style={{ transform: showRelatedObjects ? 'rotate(90deg)' : undefined, transition: 'transform 0.3s ease' }}
          />
          <span>Related with {relatedObjectsSize} objects </span>
        </span>
        <AnimatePresence>
          {showRelatedObjects && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              {relatedObjects?.map(i => {
                if (i.type === 'normal') {
                  return <div>{i.name}</div>
                }
                return null
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </Content>
      <Modal width={300} visible={!!metaObject && editMetaVisible} onClose={toggleEditMetaVisible}>
        <EditMetaObjectForm
          title="Edit object"
          metaObject={metaObject!}
          onUpdate={obj => {
            updateMetaObject(obj)
            toggleEditMetaVisible(false)
          }}
        />
      </Modal>
    </Content>
  )
  const renderLineMain = () => (
    <Content
      onClick={() => metaObject && GlobalGraphInstance?.open(metaObject)}
      contentEditable={false}
      flex
      auto
      alignItems="center"
      justifyContent="space-between"
      gap={20}
    >
      <div style={{ fontWeight: 600 }} className={ClassName.animatedBorderBottom(undefined, undefined, 1)}>
        {metaObject?.name}
      </div>
      <Content flex gap={6}>
        <div className={ClassName.tag(element.background ? ClassName.TagBackgrounds.transparent : ClassName.TagBackgrounds.grey)}>
          Mentioned : {alsoMentionedSize || 0}
        </div>
        <div className={ClassName.tag(element.background ? ClassName.TagBackgrounds.transparent : ClassName.TagBackgrounds.grey)}>
          Related : {relatedObjectsSize || 0}
        </div>
        <div className={ClassName.tag(element.background ? ClassName.TagBackgrounds.transparent : ClassName.TagBackgrounds.grey)}>
          Object
        </div>
      </Content>
    </Content>
  )
  return (
    <NoteCard
      pictureUrl={metaObject?.coverImgSrc}
      main={metaEle?.cardType === 'line' || metaEle?.cardType === undefined ? renderLineMain() : renderMain()}
      element={{ ...element, noteId: metaObject?.noteId }}
      children={children}
      type="meta"
    />
  )
})

const RelatedNote = ({ noteId }: { noteId?: number }) => {
  const noteAtom = useMemo(() => (noteId ? atom(get => get(notesAtom).get(noteId)) : atom(null)), [noteId])
  const note = useAtomValue(noteAtom, GlobalScope)
  const navigate = useNavigate()
  return (
    <Content flex gap={6}>
      <span>📝</span>
      <span onClick={() => navigate(`/editor/${noteId}`)} className={ClassName.animatedBorderBottom(undefined, undefined, 1)}>
        {note?.title}
      </span>
    </Content>
  )
}

const RelatedObject = () => {}
export default MetaObject
