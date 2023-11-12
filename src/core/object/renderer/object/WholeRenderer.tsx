import { CSSProperties, memo, useState } from 'react'
import { MetaObject } from '~/typings'
import { useTranslation } from 'react-i18next'
import { useSelectGlobalAtomValue } from '@/hooks'
import { SettingAtom } from '@/core'
import { ObjectStore } from '@/stores'
import { Content } from '@/components'
import { css } from '@emotion/css'
import { Rendevoz } from '@/core/rendevoz'
import TagRenderer, { TagRendererProps } from '@/core/object/renderer/object/TagRenderer'
import OriginalTextRenderer, { OriginalTextRendererProps } from '@/core/object/renderer/object/OriginalTextRenderer'
import DescriptionRenderer, { DescriptionRendererProps } from '@/core/object/renderer/object/DescriptionRenderer'
import OptionRenderer, { OptionRendererProps } from '@/core/object/renderer/object/OptionRenderer'
import ImageRenderer, { ImageRenderProps } from '@/core/object/renderer/object/ImageRenderer'
import TitleRenderer, { TitleRendererProps } from '@/core/object/renderer/object/TitleRenderer'
import FromRenderer, { FromRendererProps } from '@/core/object/renderer/object/FromRenderer'
import { Colors } from '@/consts'

export type WholeRendererProps = {
  options?: {
    columnGap?: number
    rowGap?: number
    containerClassName?: string
    tagAboveImage?: boolean
    containerStyle?: CSSProperties
    containerOnClick?: React.MouseEventHandler
    mainContainerStyle?: CSSProperties
    tagsOptions?: TagRendererProps
    titleOptions?: TitleRendererProps
    imageOptions?: ImageRenderProps
    fromOptions?: FromRendererProps
    originalTextOptions?: OriginalTextRendererProps
    optionOptions?: OptionRendererProps
    descriptionOptions?: DescriptionRendererProps
    renderOptions: {
      renderImage?: boolean
      renderTitle?: boolean
      renderTags?: boolean
      renderDescription?: boolean
      renderFrom?: boolean
      renderOption?: boolean
      renderOriginalText?: boolean
      renderWebpageFrom?: boolean
      imageMode?: 'thumbnail' | 'whole'
    }
  }
  metaObject?: MetaObject
  relatedNum?: number
}

const noshrinkClass = css({
  '> *': {
    flexShrink: 0
  }
})

export default memo(({ options, metaObject, relatedNum = 0 }: WholeRendererProps) => {
  const {
    renderOptions = {},
    columnGap,
    rowGap = 10,
    titleOptions = {},
    descriptionOptions = {},
    tagsOptions = {
      containerStyle: {
        marginBottom: 4
      }
    },
    imageOptions = {},
    originalTextOptions = {
      style: {
        padding: '2px 6px 4px',
        margin: '2px 0px 3px'
      }
    },
    fromOptions = {
      style: {
        marginTop: 3
      }
    },
    optionOptions = {},
    containerClassName,
    containerStyle,
    containerOnClick,
    mainContainerStyle,
    tagAboveImage = false
  } = options || {}
  const { t } = useTranslation()
  const [imgDisplayFlexMode, setImgDisplayFlexMode] = useState<CSSProperties['flexDirection']>(renderOptions?.imageMode === 'whole' ? 'column' : 'row')
  const originalTextVisible = useSelectGlobalAtomValue(SettingAtom, s => s.label.showOriginalText)
  const [imgSize, setImgSize] = useState<{
    width?: number | string
    height?: number | string
    ratio?: number | string
    minWidth?: number
  }>(
    renderOptions.imageMode === 'whole'
      ? { width: '100%', ratio: 0.5625, minWidth: 280 }
      : {
          width: 64,
          height: 64,
          ratio: 1
        }
  )
  const originalObject = ObjectStore(metaObject?.type).useValue(metaObject?.objectId)
  const showOriginalTextAsName = originalObject?.selectedText

  if (!metaObject || metaObject.deleted) return null

  const renderOiginalText = () =>
    originalTextVisible &&
    !showOriginalTextAsName &&
    (metaObject.type as string | undefined)?.includes('Label') &&
    renderOptions.renderOriginalText !== false &&
    metaObject.objectId && (
      <OriginalTextRenderer {...originalTextOptions} name={metaObject.name} type={metaObject.type} objectId={metaObject.objectId} />
    )

  const renderTitle = () =>
    renderOptions?.renderTitle !== false && (
      <TitleRenderer
        originalTextStyle={originalTextOptions.style}
        {...titleOptions}
        onTitleClick={
          titleOptions.onTitleClick ||
          (() => {
            metaObject && Rendevoz.Actions.Open.Meta.openMetaObject(metaObject.id)
          })
        }
        originalText={showOriginalTextAsName}
        metaObject={metaObject}
      />
    )

  const renderDescription = () =>
    renderOptions?.renderDescription !== false && <DescriptionRenderer {...descriptionOptions} description={metaObject.description} />

  const renderFrom = () => renderOptions?.renderFrom !== false && <FromRenderer {...fromOptions} metaObject={metaObject} />

  const renderTags = () => (
    <TagRenderer
      {...tagsOptions}
      containerStyle={{
        ...tagsOptions.containerStyle,
        paddingRight: renderOptions.renderOption ? '40px' : undefined
      }}
      relatedNum={relatedNum}
      metaObject={metaObject}
      t={t}
    />
  )

  return metaObject?.coverImgSrc && renderOptions.renderImage !== false ? (
    <>
      <Content flex>
        {renderOptions?.renderTags !== false && tagAboveImage && renderTags()}
        {renderOptions.renderOption && tagAboveImage && <OptionRenderer {...optionOptions} metaId={metaObject.id} />}
      </Content>
      <Content
        flex
        alignItems="stretch"
        gap={rowGap}
        className={css([containerClassName, noshrinkClass])}
        style={{
          ...containerStyle,
          flexDirection: imgDisplayFlexMode,
          padding: renderOptions.imageMode === 'whole' ? 0 : containerStyle?.padding,
          alignItems: imgDisplayFlexMode === 'row-reverse' && renderOptions.imageMode === 'whole' ? 'stretch' : undefined
        }}
      >
        <ImageRenderer {...imgSize} {...imageOptions} imageSrc={metaObject.coverImgSrc} />
        <Content onClick={containerOnClick} style={mainContainerStyle} flex column gap={columnGap} justifyContent="center">
          {renderOptions.renderOption && !tagAboveImage && <OptionRenderer {...optionOptions} metaId={metaObject.id} />}
          {renderOptions?.renderTags !== false && !tagAboveImage && renderTags()}
          {renderOiginalText()}
          {renderTitle()}
          {renderDescription()}
          {renderFrom()}
        </Content>
      </Content>
    </>
  ) : (
    <Content
      onClick={containerOnClick}
      flex
      column
      gap={columnGap}
      className={css([containerClassName, noshrinkClass])}
      style={{ ...containerStyle, ...mainContainerStyle }}
    >
      {renderOptions?.renderOption && <OptionRenderer {...optionOptions} metaId={metaObject.id} />}
      {renderOptions?.renderTags !== false && renderTags()}
      {renderOiginalText()}
      {renderTitle()}
      {renderDescription()}
      {renderFrom()}
    </Content>
  )
})
