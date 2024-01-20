import { css } from '@emotion/css'
import NoteContentDisplayer from '@/core/object/renderer/contentDisplayer/Note'
import { memo } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import { INote, IWebpage } from '~/typings'
import WhiteboardDisplayer from '@/core/object/renderer/contentDisplayer/Whiteboard'
import QuestionDisplayer from '@/core/object/renderer/contentDisplayer/Question'
import CodeDisplayer from '@/core/object/renderer/contentDisplayer/Code'
import ImageItem from '@/core/components/group/components/gallery/items/ImageItem'
import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'

// @ts-ignore
const nonNullClass = css({
  ':is(:not(:has(> :empty)):not(:empty),[data-show-cover="true"])': {
    paddingBottom: '75%',
    borderBottom: '1px solid var(--border-background)'
  },
  '*': {
    pointerEvents: 'none !important'
  }
})
export default memo(
  ({ metaId, hideCoverIfEmpty, onClick }: { metaId: number; hideCoverIfEmpty?: boolean; onClick: React.MouseEventHandler }) => {
    const meta = MetaStore.useValue(metaId)
    const fitImage = useSelectAtomValue(GroupStateAtom, s => s.currentView?.options.fitImage) ?? false
    const obj = ObjectStore(meta.type).useValue(meta?.objectId)
    let id: number | undefined = undefined
    if (obj && 'specType' in obj) {
      if (obj.specType === 'note') {
        id = (obj as INote).id
      }
      if (obj.specType === 'webpage') {
        id = (obj as IWebpage).noteId
      }
      if (obj.specType === 'whiteboard') {
        id = obj.id
      }
      if (obj.specType === 'question') {
        id = obj.id
      }
      if (obj.specType === 'code') {
        id = obj.id
      }
    }
    return (
      <div
        data-show-cover={!hideCoverIfEmpty}
        style={{
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onClick={onClick}
        className={nonNullClass}
      >
        {(id || meta?.coverImgSrc) && (
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            {id && (
              <>
                {(meta?.type === 'note' || meta?.type === 'webpage') && <NoteContentDisplayer id={id} />}
                {meta?.type === 'whiteboard' && <WhiteboardDisplayer id={id} />}
                {meta?.type === 'question' && <QuestionDisplayer id={id} />}
                {meta?.type === 'code' && <CodeDisplayer id={id} />}
              </>
            )}
            {!id && meta?.coverImgSrc && (
              <img
                src={meta.coverImgSrc}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: fitImage ? 'contain' : 'cover'
                }}
              />
            )}
          </div>
        )}
      </div>
    )
  }
)
