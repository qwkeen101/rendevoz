import { FlipCardEnter, FlipCardExit } from '@/common/animation/flip'
import ClassName from '@/styles/classNames'
import getEmoji from '@/utils/emoji'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { capitalize } from 'lodash'
import { CSSProperties, Fragment, ReactNode, useMemo, useState } from 'react'
import { Flipped, Flipper } from 'react-flip-toolkit'
import { useTranslation } from 'react-i18next'
import { Content, Form, Icon } from '..'
import { defaultBgColor } from '../picker/colorPicker'
import { ObjectTag } from '@/core'
import FormColorPicker from './FormColorPicker'
import FormIconPicker from './FormIconPicker'
import FormImagePicker from './FormImagePicker'
import FormTagPicker from './FormTagPicker'
import Colors from '@/consts/colors'
import { useToggle } from '@/hooks'
import { MetaObject } from '~/typings'
import FormFromDisplayer from './FormFromDisplayer'
import FormFilePathPicker from './FormFilePathPicker'

type useFlipFormOptions = {
  layout: FlipFormLayoutItem[]
  containerStyle?: CSSProperties
  onSubmit?: VoidFunction
  onBack?: VoidFunction
  formTitle?: string
  submitText?: string
}

export type FlipFormLayoutItem =
  | {
      type: 'nameInput'
      disabled?: boolean
      onChange: (v: string) => void
      value?: string
    }
  | {
      type: 'input'
      disabled?: boolean
      onChange?: (v: string) => void
      value?: string
      text?: string
    }
  | {
      type: 'descriptionInput'
      onChange: (v: string) => void
      value?: string
    }
  | {
      type: 'tagPicker'
      tags?: number[]
      onChange: (tags: string[]) => void
    }
  | {
      type: 'colorPicker'
      color?: string
      onChange?: (color: string | undefined) => void
    }
  | {
      type: 'tagDisplayer'
      tags?: number[]
    }
  | {
      type: 'iconPicker'
      icon?: string
      onChange: (icon: string | undefined) => void
    }
  | {
      type: 'imagePicker'
      imageUrl?: string
      onChange: (url: string | undefined) => void
      name: string
    }
  | {
      type: 'group'
      children: FlipFormLayoutItem[] | FlipFormLayoutItem | undefined
    }
  | {
      type: 'previewGraph'
      onClick?: React.MouseEventHandler
    }
  | {
      type: 'custom'
      children: ReactNode
    }
  | {
      type: 'fromDisplayer'
      object: Partial<MetaObject>
      onRemove?: VoidFunction
    }
  | {
      type: 'filePathPicker'
      filePath: string
      onChange: (filePath: string | undefined, fileName: string | undefined) => void
    }
  | undefined
interface FormInnerState {
  mainVisible: boolean
  tagPickerVisible: boolean
  iconPickerVisible: boolean
  colorPickerVisible: boolean
}
export const groupClassName = css({
  boxShadow: `${Colors.Background.ButtonHover} 0px 0px 0px 1px inset`,
  borderRadius: 6,
  padding: 8,
  background: 'rgba(31,34,37,0.03)',
  position: 'relative'
})

export const hoverLabelClassName = css({
  position: 'absolute',
  top: -10,
  left: 10,
  fontWeight: 600,
  fontFamily: 'Muli',
  fontSize: '0.857rem'
})
const useFlipForm = (options: useFlipFormOptions) => {
  const { layout, onBack, onSubmit, formTitle, containerStyle, submitText } = options
  const [formInnerState, setFormInnerState] = useState<Partial<FormInnerState>>({
    mainVisible: true
  })
  const { mainVisible, tagPickerVisible, iconPickerVisible, colorPickerVisible } = formInnerState
  const mainFlipId = useMemo(() => Id.getStrId(), [])
  const tagPickerFlipId = useMemo(() => Id.getStrId(), [])
  const colorPickerFlipId = useMemo(() => Id.getStrId(), [])
  const iconPickerFlipId = useMemo(() => Id.getStrId(), [])
  const [enlarged, toggleEnlarged] = useToggle(false)
  const { t } = useTranslation()
  const flattenedLayout = useMemo(
    () =>
      layout.reduce((prev, curr) => {
        if (!curr) return prev
        if (!('children' in curr)) {
          prev.push(curr)
        } else {
          const items = Array.isArray(curr.children) ? curr.children.flat(0) : [curr.children]
          items.forEach(i => prev.push(i))
        }
        return prev
      }, [] as Required<FlipFormLayoutItem[]>),
    [layout]
  )

  const renderMainItem = (i: FlipFormLayoutItem) => {
    if (!i) return
    switch (i.type) {
      case 'input':
        return <Form.Item text={capitalize(i.text)} disable={i.disabled} type="input" value={i.value} onChange={i.onChange} />
      case 'nameInput':
        return (
          <Form.Item
            autoFocus
            text={capitalize(t('general.name'))}
            disable={i.disabled}
            type="input"
            style={{ fontSize: enlarged ? '1rem' : undefined }}
            value={i.value}
            onChange={i.onChange}
          />
        )
      case 'descriptionInput':
        return (
          <Form.Item
            text={capitalize(t('general.description'))}
            minRows={enlarged ? 10 : undefined}
            style={{ fontSize: enlarged ? '1rem' : undefined }}
            type="textarea"
            maxRows={enlarged ? 18 : 10}
            value={i.value}
            onChange={i.onChange}
            autoFocus={false}
          />
        )
      case 'filePathPicker':
        return <FormFilePathPicker maxWidth={enlarged ? '100%' : 400} filePath={i.filePath} onChange={i.onChange} />
      case 'tagPicker':
        return (
          <Content
            alignItems="center"
            justifyContent="space-between"
            flex
            className={ClassName.flatButton()}
            onClick={() => setFormInnerState({ tagPickerVisible: true })}
          >
            <Content gap={8} flex style={{ textTransform: 'capitalize' }}>
              <Icon name="park-tag-one" />
              <span>{t('general.tags')}</span>
            </Content>
            <Icon name="park-right" />
          </Content>
        )
      case 'group':
        return (
          <Form.Item type="component">
            <div className={groupClassName}>
              {(Array.isArray(i.children) ? i.children : [i.children]).map(
                (i, idx) => i && <Fragment key={idx}>{renderMainItem(i)}</Fragment>
              )}
            </div>
          </Form.Item>
        )
      case 'iconPicker': {
        const emoji = i.icon ? getEmoji(i.icon) : undefined
        return (
          <div
            className={ClassName.flatButton()}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textTransform: 'capitalize' }}
            onClick={() => {
              if (i.icon) {
                i.onChange(undefined)
              } else {
                setFormInnerState({ iconPickerVisible: true })
              }
            }}
          >
            {i.icon ? `${t('general.delete')} ${t('general.icon')}` : t('general.icon')}
            {emoji ? (
              <Content flex centered style={{ width: 20, height: 20 }}>
                <img
                  src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
                  style={{
                    width: '1.2em',
                    height: '1.2em',
                    backgroundImage: `url(${emoji.imageSrc})`,
                    backgroundPositionX: `${(emoji.x * 100) / 60}%`,
                    backgroundPositionY: `${(emoji.y * 100) / 60}%`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '6100% 6100%',
                    verticalAlign: '-0.1em',
                    marginRight: 2
                  }}
                />
              </Content>
            ) : (
              <Icon name="park-right" onClick={() => setFormInnerState({ iconPickerVisible: true })} />
            )}
          </div>
        )
      }
      case 'tagDisplayer': {
        if (i.tags && i.tags.length > 0) {
          return (
            <div className={groupClassName}>
              <div className={hoverLabelClassName}>{t('general.tags')}</div>
              <Content flex gap={4} style={{ flexWrap: 'wrap' }}>
                {i.tags.map(i => (
                  <ObjectTag key={i} hideSize small tag={i} />
                ))}
              </Content>
            </div>
          )
        }
        break
      }
      case 'fromDisplayer': {
        return (
          <FormFromDisplayer
            onRemove={() => {
              i.onRemove?.()
            }}
            initialObject={i.object}
          />
        )
      }
      case 'colorPicker':
        return (
          <div
            className={ClassName.flatButton()}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textTransform: 'capitalize' }}
            onClick={() => setFormInnerState({ colorPickerVisible: true })}
          >
            {t('general.color')}
            {i?.color ? <div style={{ width: 20, height: 20, borderRadius: 4, background: i.color }}></div> : <Icon name="park-right" />}
          </div>
        )
      case 'imagePicker':
        return <FormImagePicker imageUrl={i.imageUrl} onChange={i.onChange} name={i.name}/>
      case 'previewGraph':
        return (
          <div
            className={ClassName.flatButton()}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textTransform: 'capitalize' }}
            onClick={i.onClick}
          >
            <Content gap={8} flex>
              <Icon name="park-share-one" />
              <span> {t('form.preview graph', { graph: t('general.graph') })}</span>
            </Content>
            <Icon name="park-right" />
          </div>
        )
      case 'custom':
        return i.children
    }
  }
  const renderMain = () => (
    <Form
      submitText={submitText}
      onSubmit={onSubmit}
      onBack={onBack}
      title={formTitle || 'Untitled Form'}
      extra={
        <Icon
          onClick={toggleEnlarged}
          name={enlarged ? 'park-collapse-text-input' : 'park-expand-text-input'}
          className={ClassName.circleButton()}
        />
      }
      style={{ minWidth: enlarged ? '80vw' : 320, maxWidth: enlarged ? '80vw' : 600, justifyContent: 'space-between', ...containerStyle }}
    >
      {layout.map((i, idx) => (
        <Fragment key={idx}>{renderMainItem(i)}</Fragment>
      ))}
    </Form>
  )

  const renderTagPicker = () => {
    const tagLayoutItem = flattenedLayout.find(i => i && i.type === 'tagPicker') as (FlipFormLayoutItem & { type: 'tagPicker' }) | undefined
    if (tagLayoutItem) {
      return (
        <Flipped flipId={tagPickerFlipId} onAppear={FlipCardEnter} onExit={FlipCardExit}>
          <FormTagPicker
            tags={tagLayoutItem.tags}
            onChange={v => {
              const set = new Set([...v])
              tagLayoutItem.onChange(Array.from(set))
            }}
            onClose={() => setFormInnerState({ mainVisible: true })}
          />
        </Flipped>
      )
    }
  }

  const renderIconPicker = () => {
    const iconPickItem = flattenedLayout.find(i => i && i.type === 'iconPicker') as
      | (FlipFormLayoutItem & { type: 'iconPicker' })
      | undefined
    if (iconPickItem) {
      return (
        <Flipped flipId={iconPickerFlipId} onAppear={FlipCardEnter} onExit={FlipCardExit}>
          <FormIconPicker
            onClose={() => setFormInnerState({ mainVisible: true })}
            onPick={v => {
              iconPickItem.onChange?.(v)
              setFormInnerState({ mainVisible: true })
            }}
          />
        </Flipped>
      )
    }
  }
  const renderColorPicker = () => {
    const colorPickerItem = flattenedLayout.find(i => i && i.type === 'colorPicker') as
      | (FlipFormLayoutItem & { type: 'colorPicker' })
      | undefined
    if (colorPickerItem) {
      return (
        <Flipped flipId={colorPickerFlipId} onAppear={FlipCardEnter} onExit={FlipCardExit}>
          <FormColorPicker
            disableLinear
            onClose={() => setFormInnerState({ mainVisible: true })}
            onPick={v => {
              if (v === defaultBgColor) {
                colorPickerItem.onChange?.(undefined)
              } else {
                colorPickerItem.onChange?.(v)
              }
              setFormInnerState({ mainVisible: true })
            }}
          />
        </Flipped>
      )
    }
  }
  const renderForm = () => {
    return (
      <Flipper
        handleEnterUpdateDelete={({ animateExitingElements, animateEnteringElements, hideEnteringElements, animateFlippedElements }) => {
          hideEnteringElements()
          animateExitingElements()
          animateFlippedElements()
          animateEnteringElements()
        }}
        flipKey={`${JSON.stringify(formInnerState)}_${enlarged}`}
        spring={{ stiffness: 1600, damping: 100 }}
      >
        <Flipped flipId={mainFlipId}>
          <div
            className={ClassName.Background.pseudoBlurContrastBackground}
            style={{
              padding: '16px 24px',
              borderRadius: 8,
              boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)',
              overflow: 'hidden'
            }}
          >
            {mainVisible && renderMain()}
            {iconPickerVisible && renderIconPicker()}
            {tagPickerVisible && renderTagPicker()}
            {colorPickerVisible && renderColorPicker()}
          </div>
        </Flipped>
      </Flipper>
    )
  }

  return {
    renderForm
  }
}

export default useFlipForm
