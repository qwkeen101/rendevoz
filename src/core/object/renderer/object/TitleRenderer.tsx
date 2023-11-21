import { css } from '@emotion/css'
import ClassName from '@/styles/classNames'
import { CSSProperties, useState } from 'react'
import { MetaObject } from '~/typings'
import { ContentEditor } from '@/components'
import { MetaStore } from '@/api/stores'
import { GlobalInstance } from '@/hooks'
import Colors from '../../../../consts/colors'
import { DefaultObjectTitleRenderClazzName, keyboard } from '@/core/object/useRenderObject'
import OriginalTextRenderer from '@/core/object/renderer/object/OriginalTextRenderer'

export type TitleRendererProps = {
  titleClassName?: string
  onTitleClick?: React.MouseEventHandler
  style?: CSSProperties
  ellipsisLine?: number
  originalText?: string
  metaObject?: MetaObject
  originalTextStyle?: CSSProperties
  showAddNote?: boolean
  clickToEdit?: boolean
  clickOriginToEdit?: boolean
}
export default ({
  ellipsisLine = 2,
  titleClassName = css([ellipsisLine ? ClassName.ellipsisFont(ellipsisLine) : undefined, DefaultObjectTitleRenderClazzName]),
  onTitleClick,
  style,
  originalText,
  metaObject,
  originalTextStyle,
  clickOriginToEdit = false,
  clickToEdit = false,
  showAddNote = true
}: TitleRendererProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const showLabelName = metaObject?.name !== 'Unnamed Label'
  return (
    <>
      {originalText && metaObject && (
        <OriginalTextRenderer
          clickToEdit={clickOriginToEdit}
          onClick={onTitleClick}
          objectId={metaObject.objectId}
          type={metaObject.type}
          style={originalTextStyle}
        />
      )}
      {isEditing ? (
        <ContentEditor
          style={{ marginTop: 8 }}
          onChange={v => {
            setIsEditing(false)
            if (!v) {
              if (originalText && metaObject?.id) {
                MetaStore.updateMetaObject({ id: metaObject.id, name: 'Unnamed Label' }, true)
              }
              return
            }
            if (v !== metaObject?.name && metaObject?.id) {
              MetaStore.updateMetaObject({ id: metaObject.id, name: v }, true)
            }
          }}
          placeholder={originalText ? 'Add note...' : undefined}
          value={metaObject?.name === 'Unnamed Label' ? '' : metaObject?.name}
        />
      ) : (
        <>
          {showLabelName ? (
            <div
              onContextMenu={() => setIsEditing(!isEditing)}
              onClick={e => {
                if (clickToEdit) {
                  setIsEditing(!isEditing)
                  return
                }
                if (keyboard.ctrl && metaObject) {
                  GlobalInstance.metaOps?.copyLink(metaObject.id)
                } else {
                  onTitleClick?.(e)
                }
              }}
              style={{ color: metaObject?.color, ...style }}
              className={titleClassName}
            >
              {metaObject?.name}
            </div>
          ) : null}
          {(!originalText || showAddNote) && metaObject?.name === 'Unnamed Label' && (
            <div onClick={() => setIsEditing(!isEditing)} style={{ fontSize: 13, color: Colors.Font.Transparent, cursor: 'pointer' }}>
              Add note...
            </div>
          )}
        </>
      )}
    </>
  )
}
