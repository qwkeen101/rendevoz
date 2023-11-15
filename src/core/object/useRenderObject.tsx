import { useGlobalAtomValue, useSelectGlobalAtomValue } from '@/hooks/jotai'
import { metaObjectsAtom, relatedMetaObjectsMapAtom } from '@/api/stores/meta.store'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { selectAtom } from 'jotai/utils'
import { CSSProperties, memo, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Content, ContentEditor, Icon, IconWithPopover, Image, WithBorder } from '@/components'
import { Editor } from '../editor/Editor'
import { ObjectActionPopover, TypeToTypeName } from './card/DatabaseCard'
import { ObjectTag, SettingAtom, useRenderLabel, Whiteboard } from '@/core'
import DateFormat from '@/utils/dateFormat'
import FromRenderer, { FromRendererProps } from './renderer/object/FromRenderer'
import WebpageSourceRenderer from './WebpageSourceRenderer'
import Colors from '@/consts/colors'
import { TFunction } from 'i18next'
import { MetaObject, Size } from '~/typings'
import { Rendevoz } from '../rendevoz'
import HoverAttachment from './HoverAttachment'
import HoverObjectDetails from './HoverObjectDetails'
import { useUpdate } from 'react-use'
import Pdf from '@/core/pdf'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { MetaStore, ObjectStore } from '@/api/stores'
import FontSize from '@/consts/font'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { toast } from 'react-hot-toast'
import { GlobalInstance } from '@/hooks'
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
export const DefaultObjectTitleRenderClazzName = css([
  ClassName.title('14px'),
  {
    position: 'relative',
    width: 'fit-content',
    lineHeight: '18px',
    maxWidth: '100%',
    ':hover': {
      color: Colors.Common.SelectColor
    },
    transition: 'color 0.2s ease',
    cursor: 'pointer'
  }
])

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
        return <Whiteboard enableMiniMap={false} whiteboardId={objectId} />
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
