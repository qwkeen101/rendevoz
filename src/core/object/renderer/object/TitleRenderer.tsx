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
  showEditBoxShadow?: boolean
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
  showEditBoxShadow,
  showAddNote
}: TitleRendererProps) => {
  const [isEditing, setIsEditing] = useState(false)
  console.log(isEditing)
  const enableAddNote = showAddNote && !metaObject?.name
  const name = metaObject?.name || (!originalText ? metaObject?.placeholderName : showAddNote ? 'Add note...' : null)
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
          style={{ marginTop: 8, boxShadow: showEditBoxShadow === false ? 'none' : undefined }}
          onChange={v => {
            setIsEditing(false)
            if (v !== metaObject?.name && metaObject?.id) {
              MetaStore.updateMetaObject({ id: metaObject.id, name: v }, true)
            }
          }}
          placeholder={originalText ? 'Add note...' : undefined}
          value={metaObject?.name}
        />
      ) : name ? (
        <div
          onClick={e => {
            if (clickToEdit || enableAddNote) {
              setIsEditing(!isEditing)
              return
            }
            onTitleClick?.(e)
          }}
          style={{
            color: enableAddNote ? Colors.Font.SuperTransparent : metaObject?.color,
            fontWeight: enableAddNote ? 400 : style?.fontWeight,
            ...style
          }}
          className={titleClassName}
        >
          {name}
        </div>
      ) : null}
    </>
  )
}
