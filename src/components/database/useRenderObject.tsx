import Actions from '@/Actions'
import { useGlobalAtomValue } from '@/jotai/jotaiScope'
import { globalStore, LabelStore, NoteStore } from '@/stores'
import { metaObjectsAtom, objectIdToMetaObjectIdMapAtom, relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { Atom, atom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { CSSProperties, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MetaObject } from '~/typings/data'
import { Content, Image } from '../base'
import { Editor } from '../editor/Editor'
import { Tag } from '../form/EditMetaObjectForm'
import { PdfViewer } from '../pdf/PdfViewer'
import Whiteboard from '../whiteboard/Whiteboard'
import { TypeToTypeName } from './card/DatabaseCard'

const useRenderObject = (options: { metaObjectId: number }) => {
  const { metaObjectId } = options
  const { metaObjectAtom, relatedSetAtom } = useMemo(() => {
    const metaObjectAtom = selectAtom(metaObjectsAtom, m => m.get(metaObjectId))
    const relatedSetAtom = selectAtom(relatedMetaObjectsMapAtom, m => m.get(metaObjectId))
    return {
      metaObjectAtom,
      relatedSetAtom
    }
  }, [metaObjectId])
  const [fromAtom, setFromAtom] = useState<Atom<MetaObject | undefined>>(atom(() => undefined))
  const metaObject = useGlobalAtomValue(metaObjectAtom)
  const relatedSet = useGlobalAtomValue(relatedSetAtom)
  const from = useGlobalAtomValue(fromAtom)
  const fromString = metaObject?.type === 'pdfElement' ? 'From Book' : metaObject?.type === 'noteElement' ? 'From Note' : undefined
  const uniqueId = useMemo(() => Id.getStrId(), [])
  useEffect(() => {
    if (metaObject?.objectId) {
      if (metaObject?.type === 'pdfElement') {
        LabelStore.getLabelById(metaObject.objectId).then(label => {
          if (label) {
            const documentObject = globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(label.documentId!)
            if (documentObject) {
              setFromAtom(selectAtom(metaObjectsAtom, d => d.get(documentObject)))
            }
          }
        })
      }
      if (metaObject.type === 'noteElement') {
        NoteStore.getBlockById(metaObject.objectId).then(block => {
          if (block) {
            const noteObject = globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(block.noteId)
            if (noteObject) {
              setFromAtom(selectAtom(metaObjectsAtom, n => n.get(noteObject)))
            }
          }
        })
      }
    }
  }, [metaObject?.objectId])
  const { t } = useTranslation()
  const renderTags = ({
    gap = 4,
    flexWrap = 'wrap',
    containerStyle
  }: {
    gap?: number
    flexWrap?: CSSProperties['flexWrap']
    containerStyle?: CSSProperties
  }) => {
    return (
      <Content
        flex
        gap={gap}
        style={{
          flexWrap,
          fontFamily: 'Muli',
          ...containerStyle
        }}
        className={css({
          '> *': {
            fontSize: '10px !important'
          }
        })}
      >
        <div style={{ textTransform: 'capitalize' }} className={ClassName.objectTag}>
          {t(`general.${TypeToTypeName[metaObject?.type || 'normal']}`)}
        </div>
        {relatedSet && relatedSet?.size > 0 && (
          <div style={{ textTransform: 'capitalize' }} className={ClassName.objectTag}>
            {relatedSet.size} {t('general.related')}
          </div>
        )}
        {metaObject?.tags?.map(i => (
          <Tag key={i} tag={i} hideAdd hideDelete hideSize small />
        ))}
      </Content>
    )
  }

  const renderTitle = ({
    titleClassName = css([
      ClassName.title('16px'),
      {
        position: 'relative',
        width: 'fit-content',
        textDecoration: 'underline 1px rgba(0,0,0,0)',
        transition: 'text-decoration-color 0.3s ease',
        ':hover': {
          textDecorationColor: 'rgba(0,0,0,0.8)'
        },
        cursor: 'pointer'
      }
    ]),
    onTitleClick = () => Actions.navigateToTargetObject(metaObjectId),
    style
  }: {
    titleClassName?: string
    onTitleClick?: React.MouseEventHandler
    style?: CSSProperties
  }) => {
    return fromString && from ? (
      <div>
        <div onClick={onTitleClick} style={style} className={titleClassName}>
          {metaObject?.name}
        </div>
        <div className={ClassName.description('11px', undefined, '#37352f80')}>
          {fromString}: {from.name}
        </div>
      </div>
    ) : (
      <div onClick={onTitleClick} style={style} className={titleClassName}>
        {metaObject?.name}
      </div>
    )
  }

  const renderDescription = ({
    descriptionClassName = ClassName.description(),
    style
  }: {
    descriptionClassName?: string
    style?: CSSProperties
  }) => {
    if (metaObject?.description) {
      return (
        <div className={descriptionClassName} style={style}>
          {metaObject?.description}
        </div>
      )
    }
  }

  const renderImage = ({
    width = 40,
    height = 40,
    ratio = 1,
    borderRadius = 4,
    style
  }: {
    width?: number
    height?: number
    ratio?: number
    borderRadius?: number
    style?: CSSProperties
  }) => {
    if (metaObject?.coverImgSrc) {
      return (
        <Image
          draggable={false}
          style={{
            borderRadius,
            flexShrink: 0,
            ...style
          }}
          className={css({ margin: 'auto' })}
          src={metaObject.coverImgSrc}
          width={width}
          height={height}
          ratio={ratio}
        />
      )
    }
  }
  const renderWhole = ({
    gap = 3,
    titleOptions = {},
    descriptionOptions = {},
    tagsOptions = {},
    imageOptions = {},
    containerClassName,
    containerStyle,
    containerOnClick
  }: {
    gap?: number
    containerClassName?: string
    containerStyle?: CSSProperties
    containerOnClick?: React.MouseEventHandler
    tagsOptions?: Parameters<typeof renderTags>[0]
    titleOptions?: Parameters<typeof renderTitle>[0]
    imageOptions?: Parameters<typeof renderImage>[0]
    descriptionOptions?: Parameters<typeof renderDescription>[0]
  }) => {
    return metaObject?.coverImgSrc ? (
      <Content flex alignItems="stretch" gap={10} className={containerClassName} style={containerStyle}>
        {renderImage(imageOptions)}
        <Content onClick={containerOnClick} flex column gap={gap}>
          {renderTags(tagsOptions)}
          {renderTitle(titleOptions)}
          {renderDescription(descriptionOptions)}
        </Content>
      </Content>
    ) : (
      <Content onClick={containerOnClick} flex column gap={gap} className={containerClassName} style={containerStyle}>
        {renderTags(tagsOptions)}
        {renderTitle(titleOptions)}
        {renderDescription(descriptionOptions)}
      </Content>
    )
  }
  const renderExpand = ({ editorTitleStyle = { padding: '20px 10px 10px 50px' } }: { editorTitleStyle?: CSSProperties }) => {
    if (!metaObject || !metaObject.objectId) return null
    const { objectId } = metaObject
    switch (metaObject?.type) {
      case 'pdf':
        return <PdfViewer documentId={objectId} />
      case 'note':
        return <Editor titleStyle={editorTitleStyle} id={uniqueId} noteId={objectId} />
      case 'normal':
        return <Editor titleStyle={editorTitleStyle} id={uniqueId} noteId={objectId} />
      case 'whiteboard':
        return <Whiteboard enableMiniMap={false} whiteboardId={objectId} />
    }
    return null
  }
  return {
    renderTitle,
    renderTags,
    renderDescription,
    renderWhole,
    metaObject,
    renderExpand
  }
}

export default useRenderObject
