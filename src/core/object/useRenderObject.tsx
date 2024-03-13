import { useGlobalAtomValue } from '@/hooks/jotai'
import { relatedMetaObjectsMapAtom } from '@/api/stores/meta/meta.store'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { selectAtom } from 'jotai/utils'
import { CSSProperties, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { IconWithPopover } from '@/components'
import { Editor } from '../components/editor/Editor'
import { ObjectActionPopover } from './card/DatabaseCard'
import { Whiteboard } from '@/core'
import FromRenderer, { FromRendererProps } from './renderer/object/FromRenderer'
import Colors from '@/consts/colors'
import { Rendevoz } from '../rendevoz'
import Pdf from '@/core/components/pdf'
import { MetaStore } from '@/api/stores'
import TagRenderer, { TagRendererProps } from '@/core/object/renderer/object/TagRenderer'
import TitleRenderer, { TitleRendererProps } from '@/core/object/renderer/object/TitleRenderer'
import DescriptionRenderer, { DescriptionRendererProps } from '@/core/object/renderer/object/DescriptionRenderer'
import WholeRenderer, { WholeRendererProps } from '@/core/object/renderer/object/WholeRenderer'
import OriginalTextRenderer, { OriginalTextRendererProps } from '@/core/object/renderer/object/OriginalTextRenderer'
import OptionRenderer, { OptionRendererProps } from '@/core/object/renderer/object/OptionRenderer'
import InlineRenderer, { InlineRendererProps } from '@/core/object/renderer/object/InlineRenderer'

export const keyboard = {
  ctrl: false
}
window.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey) {
      keyboard.ctrl = true
    }
  })
  document.addEventListener('keyup', e => {
    keyboard.ctrl = false
  })
})
export const DefaultObjectTitleRenderClazzName = css({
  fontWeight: 500,
  fontSize: 14,
  position: 'relative',
  width: 'fit-content',
  lineHeight: '18px',
  maxWidth: '100%',
  ':hover': {
    color: Colors.Common.SelectColor
  },
  transition: 'color 0.2s ease',
  cursor: 'pointer'
})

const defaultRenderWholeOptions = {
  columnGap: 3,
  rowGap: 10,
  renderOptions: {
    renderFrom: false,
    renderImage: true,
    renderOption: false
  }
}

const useRenderObject = (options: { metaObjectId: number }) => {
  const { metaObjectId } = options
  const { relatedSetAtom } = useMemo(() => {
    const relatedSetAtom = selectAtom(relatedMetaObjectsMapAtom, m => m.get(metaObjectId))
    return {
      relatedSetAtom
    }
  }, [metaObjectId])

  const metaObject = MetaStore.useValue(metaObjectId)
  const relatedSet = useGlobalAtomValue(relatedSetAtom)

  const uniqueId = useMemo(() => Id.getStrId(), [])

  const { t } = useTranslation()

  const renderTags = (options: TagRendererProps) => (
    <TagRenderer {...options} relatedNum={relatedSet?.size || 0} metaObject={metaObject} t={t} />
  )

  const renderTitle = (options: TitleRendererProps) => (
    <TitleRenderer
      {...options}
      onTitleClick={options.onTitleClick || (() => Rendevoz.Actions.Open.Meta.openMetaObject(metaObjectId))}
      metaObject={metaObject}
    />
  )

  const renderDescription = (options: DescriptionRendererProps) => (
    <DescriptionRenderer {...options} description={metaObject?.description} />
  )

  const renderWhole = (options?: WholeRendererProps['options']) => (
    <WholeRenderer options={options} metaObject={metaObject} relatedNum={relatedSet?.size} />
  )
  const renderInline = (options: InlineRendererProps) => <InlineRenderer {...options} metaObject={metaObject} />

  const renderExpand = ({ editorTitleStyle = { padding: '20px 10px 10px 50px' } }: { editorTitleStyle?: CSSProperties }) => {
    if (!metaObject || !metaObject.objectId) return null
    const { objectId } = metaObject
    switch (metaObject?.type) {
      case 'pdf':
        return <Pdf pdfId={objectId} />
      case 'note':
        return <Editor type="note" titleStyle={editorTitleStyle} id={uniqueId} noteId={objectId} />
      case 'normal':
        return <Editor type="note" titleStyle={editorTitleStyle} id={uniqueId} noteId={objectId} />
      case 'whiteboard':
        return <Whiteboard whiteboardId={objectId} />
    }
    return null
  }

  const renderFrom = (options: FromRendererProps) => metaObject && <FromRenderer metaObject={metaObject} {...options} />

  const renderOptions = (options: OptionRendererProps) => metaObject && <OptionRenderer {...options} metaId={metaObject.id} />

  const renderPopover = ({
    icon = 'park-more',
    position = 'left',
    align = 'center',
    ...rest
  }: {
    icon?: string
    position?: 'left' | 'top' | 'right' | 'bottom'
    align?: 'start' | 'center' | 'end'
  } & Partial<Parameters<typeof ObjectActionPopover>[0]>) => {
    return (
      <IconWithPopover
        withClickCover={true}
        content={<ObjectActionPopover {...rest} metaObjectId={metaObjectId} />}
        name={icon}
        align={align}
        placement={[position]}
      ></IconWithPopover>
    )
  }

  const renderOriginalText = (opts?: OriginalTextRendererProps) => {
    if (!metaObject || !metaObject.objectId) return null
    return <OriginalTextRenderer name={metaObject.name} objectId={metaObject.objectId} type={metaObject.type} {...opts} />
  }
  return {
    renderTitle,
    renderTags,
    renderDescription,
    renderWhole,
    metaObject,
    renderExpand,
    renderFrom,
    renderPopover,
    renderInline,
    renderOptions,
    renderOriginalText
  }
}

export default useRenderObject
