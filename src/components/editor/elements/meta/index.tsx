import { Content, Icon, IconWithPopover, Image, WithBorder } from '@/components/base'
import { Tag } from '@/components/form/EditMetaObjectForm'
import { GlobalGraphInstance } from '@/components/graph/GlobalGraph'
import { TypeToTypeName } from '@/components/database/card/DatabaseCard'
import { useToggle } from '@/hooks'
import { documentsAtom } from '@/stores/document.store'
import { labelsAtom } from '@/stores/label.store'
import { metaObjectsAtom, relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import { notesAtom } from '@/stores/note.store'
import { globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { AnimatePresence, motion } from 'framer-motion'
import { useAtomValue } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { FC, memo, useMemo } from 'react'
import { RenderElementProps } from 'slate-react'
import { MetaObject as MetaObjectType } from '~/typings/data'
import { useSlate } from '../../slate-react'
import { MetaObjectElement } from '../../types/outerElementTypes'
import NoteCard from '../cards/NoteCard'
import Actions from '@/Actions'
import useRenderObject from '@/components/database/useRenderObject'

const MetaObject: FC<RenderElementProps> = memo(({ children, element }) => {
  const { collapsed } = element
  const metaEle = element as MetaObjectElement
  const { originId } = metaEle
  const editor = useSlate()
  const metaAtom = useMemo(() => (originId ? atom(get => get(metaObjectsAtom).get(originId)) : atom(null)), [originId])
  const metaObject = useAtomValue(metaAtom, { store: globalStore })

  const { renderWhole } = useRenderObject({
    metaObjectId: originId
  })
  const renderMain = () => (
    // <Content
    //   className={css([
    //     {
    //       padding: hasDescription ? 4 : 2,
    //       cursor: 'pointer',
    //       gap: 7,
    //       borderRadius: 4,
    //       width: 'max(100%, 400px)',
    //       paddingLeft: 12
    //     },
    //     ClassName.title('13px')
    //   ])}
    //   centered
    //   contentEditable={false}
    // >
    //   <Content flex column>
    //     <Content flex justifyContent="space-between" alignItems="center">
    //       <div className={ClassName.tag(ClassName.TagBackgrounds.grey)} style={{ textTransform: 'uppercase' }}>
    //         {TypeToTypeName[metaObject?.type || 'normal']}
    //       </div>
    //       <IconWithPopover
    //         style={{ marginLeft: 10 }}
    //         className={ClassName.circleButton()}
    //         name="park-more"
    //         content={
    //           <WithBorder
    //             style={{ padding: 4, width: 150, backdropFilter: 'saturate(1.5) blur(5px)', background: 'rgba(255,255,255,0.8)' }}
    //           >
    //             <Content flex column gap={3} className={ClassName.defaultFont()}>
    //               <Content
    //                 className={ClassName.flatButton()}
    //                 flex
    //                 gap={15}
    //                 onClick={() => metaObject && GlobalGraphInstance?.open(metaObject)}
    //               >
    //                 <Icon name="park-relational-graph" />
    //                 Graph
    //               </Content>
    //             </Content>
    //           </WithBorder>
    //         }
    //       />
    //     </Content>
    //     <span className={css([ClassName.title('18px'), ClassName.ellipsisFont(1)], ClassName.flexLayout('center', 'flex-start'))}>
    //       {metaObject?.name}
    //     </span>
    //     {metaObject?.description && <span className={ClassName.description()}>{metaObject?.description}</span>}
    //     <span
    //       className={css([ClassName.description('12px'), ClassName.flatButton(undefined, '0px 4px')])}
    //       style={{ display: 'flex', gap: 2, marginLeft: -18, alignItems: 'center', marginTop: 6, width: 'fit-content' }}
    //       onClick={toggleShowRelated}
    //     >
    //       <Icon
    //         theme="filled"
    //         size={13}
    //         name="park-right-one"
    //         style={{ transform: showRelated ? 'rotate(90deg)' : undefined, transition: 'transform 0.3s ease' }}
    //       />
    //       <span>Also mentioned at {alsoMentionedSize} places</span>
    //     </span>
    //     <AnimatePresence>
    //       {showRelated && (
    //         <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
    //           {relatedObjects?.map(i => {
    //             if (i.type === 'note' && i.objectId !== editor.noteId) {
    //               return <RelatedNote noteId={i.objectId} />
    //             }
    //             return null
    //           })}
    //         </motion.div>
    //       )}
    //     </AnimatePresence>
    //     <span
    //       className={css([ClassName.description('12px'), ClassName.flatButton(undefined, '0px 4px')])}
    //       style={{ display: 'flex', gap: 2, marginLeft: -18, alignItems: 'center', marginTop: 6, width: 'fit-content' }}
    //       onClick={toggleShowRelatedObjects}
    //     >
    //       <Icon
    //         theme="filled"
    //         size={13}
    //         name="park-right-one"
    //         style={{ transform: showRelatedObjects ? 'rotate(90deg)' : undefined, transition: 'transform 0.3s ease' }}
    //       />
    //       <span>Related with {relatedObjectsSize} objects </span>
    //     </span>
    //     <AnimatePresence>
    //       {showRelatedObjects && (
    //         <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
    //           {relatedObjects?.map(i => {
    //             if (i.type === 'normal') {
    //               return <div>{i.name}</div>
    //             }
    //             return null
    //           })}
    //         </motion.div>
    //       )}
    //     </AnimatePresence>
    //   </Content>
    // </Content>
    <div></div>
  )
  const renderLineMain = () =>
    renderWhole({
      gap: 0
    })
  return (
    <NoteCard
      pictureUrl={metaObject?.coverImgSrc}
      main={metaEle?.cardType === 'line' || metaEle?.cardType === undefined ? renderLineMain() : renderMain()}
      element={{ ...element, noteId: metaObject?.noteId }}
      children={children}
    />
  )
})

export default MetaObject
