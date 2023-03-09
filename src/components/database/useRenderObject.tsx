import Actions from '@/Actions'
import { useGlobalAtomValue } from '@/jotai/jotaiScope'
import { globalStore, LabelStore } from '@/stores'
import { documentsAtom } from '@/stores/document.store'
import { metaObjectsAtom, relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { Atom, atom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { CSSProperties, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IPdfDocument } from '~/typings/data'
import { Content, Image } from '../base'
import { Tag } from '../form/EditMetaObjectForm'
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
  const [documentAtom, setDocumentAtom] = useState<Atom<IPdfDocument | undefined>>(atom(() => undefined))
  const metaObject = useGlobalAtomValue(metaObjectAtom)
  const relatedSet = useGlobalAtomValue(relatedSetAtom)
  console.log(relatedSet)
  const document = useGlobalAtomValue(documentAtom)
  useEffect(() => {
    if (metaObject?.type === 'pdfElement' && metaObject.objectId) {
      LabelStore.getLabelById(metaObject.objectId).then(label => {
        console.log(label)
        if (label) {
          setDocumentAtom(selectAtom(documentsAtom, d => d.get(label.documentId!)))
        }
      })
    }
  }, [metaObject])
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
          <Tag key={i} tag={i} hideAdd hideDelete hideSize />
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
        '::after': {
          content: "''",
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          // boxShadow: '0 0.1em 0.1em -0.1em var(--block-bg-color, black)',
          borderBottom: '1px solid var(--block-bg-color, black)',
          opacity: 0,
          transform: 'translateY(-100%)',
          transition: 'all 0.3s ease'
        },
        ':hover': {
          '::after': {
            transform: 'translateY(0px)',
            opacity: 1
          }
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
    return document ? (
      <div>
        <div onClick={onTitleClick} style={style} className={titleClassName}>
          {metaObject?.name}
        </div>
        <div className={ClassName.description('10px', undefined, '#37352f80')}>From Book: {document.metadata?.title || document.name}</div>
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
      <Content flex alignItems="center" gap={10} className={containerClassName} style={containerStyle}>
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
  return {
    renderTitle,
    renderTags,
    renderDescription,
    renderWhole
  }
}

export default useRenderObject
