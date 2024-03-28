import { FlipCardEnter, FlipCardExit } from '@/common/animation/flip'
import ClassName from '@/styles/classNames'
import getEmoji from '@/utils/emoji'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { capitalize } from 'lodash'
import { CSSProperties, Fragment, ReactNode, useMemo, useState } from 'react'
import { Flipped, Flipper } from 'react-flip-toolkit'
import { useTranslation } from 'react-i18next'
import { Button, Content, Form, Icon } from '../index'
import { defaultBgColor } from '../picker/colorPicker'
import { ObjectTag } from '@/core'
import FormColorPicker from './objectEdit/FormColorPicker'
import FormIconPicker from './objectEdit/FormIconPicker'
import FormImagePicker from './objectEdit/FormImagePicker'
import FormTagPicker from './objectEdit/FormTagPicker'
import Colors from '@/consts/colors'
import { useToggle } from '@/hooks'
import { MetaFormLayoutItem, MetaObject } from '~/typings'
import FormFromDisplayer from './objectEdit/FormFromDisplayer'
import FormFilePathPicker from './objectEdit/FormFilePathPicker'
import { FormAttachmentManager } from './objectEdit/FormAttachment'
import FormNoteImporter from './objectEdit/FormNoteImporter'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'

type useFlipFormOptions = {
  layout: FlipFormLayoutItem[]
  containerStyle?: CSSProperties
  onSubmit?: VoidFunction
  onBack?: VoidFunction
  formTitle?: string
  submitText?: string
}

export type FlipFormLayoutItem = MetaFormLayoutItem

interface FormInnerState {
  mainVisible: boolean
  tagPickerVisible: boolean
  iconPickerVisible: boolean
  descVisible: boolean
  colorPickerVisible: boolean
  attachmentManagerVisible: boolean
}
export const groupClassName = css({
  boxShadow: `${Colors.Background.ButtonHover} 0px 0px 0px 1px`,
  borderRadius: 6,
  padding: 6,
  fontWeight: 500,
  fontSize: 14,
  position: 'relative'
})

export const hoverLabelClassName = css({
  position: 'absolute',
  top: -10,
  left: 10,
  fontWeight: 600,
  fontSize: '0.857rem'
})
const handleEnterUpdateDelete = ({ animateExitingElements, animateEnteringElements, hideEnteringElements, animateFlippedElements }) => {
  hideEnteringElements()
  animateExitingElements()
  animateFlippedElements()
  animateEnteringElements()
}
const useFlipForm = (options: useFlipFormOptions) => {
  const { layout, onBack, onSubmit, formTitle, containerStyle, submitText } = options
  const [formInnerState, setFormInnerState] = useState<Partial<FormInnerState>>({
    mainVisible: true,
    descVisible: false
  })
  const { mainVisible, tagPickerVisible, iconPickerVisible, colorPickerVisible, attachmentManagerVisible } = formInnerState
  const mainFlipId = useMemo(() => Id.getStrId(), [])
  const tagPickerFlipId = useMemo(() => Id.getStrId(), [])
  const colorPickerFlipId = useMemo(() => Id.getStrId(), [])
  const iconPickerFlipId = useMemo(() => Id.getStrId(), [])
  const attachmentManagerFlipId = useMemo(() => Id.getStrId(), [])
  const [enlarged, toggleEnlarged] = useToggle(false)
  const { t } = useTranslation()
  const flattenedLayout = useMemo(
    () =>
      layout.reduce(
        (prev, curr) => {
          if (!curr) return prev
          if (!('children' in curr)) {
            prev.push(curr)
          } else {
            const items = Array.isArray(curr.children) ? curr.children.flat(0) : [curr.children]
            items.forEach(i => prev.push(i))
          }
          return prev
        },
        [] as Required<FlipFormLayoutItem[]>
      ),
    [layout]
  )

  const renderMainItem = (i: FlipFormLayoutItem) => {
    if (!i) return
    switch (i.type) {
      case 'input':
        return (
          <Form.Item
            style={{
              padding: '12px 10px'
            }}
            autoFocus={i.autoFocus}
            text={capitalize(i.text)}
            disable={i.disabled}
            type="input"
            value={i.value}
            onChange={i.onChange}
          />
        )
      case 'nameInput':
        return (
          <Form.Item
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                e.preventDefault()
                onSubmit?.()
              }
            }}
            autoFocus={i.autoFocus}
            text={capitalize(t('general.name'))}
            disable={i.disabled}
            type="textarea"
            minRows={1}
            maxRows={7}
            style={{ fontSize: enlarged ? '1rem' : undefined, padding: '10px 10px 0px', wordBreak: 'break-all' }}
            value={i.value}
            onChange={i.onChange}
          />
        )
      case 'descriptionInput':
        if (!i.value && !formInnerState.descVisible) return null
        return (
          <Form.Item
            text={capitalize(t('general.description'))}
            minRows={enlarged ? 10 : undefined}
            style={{ fontSize: enlarged ? '1rem' : undefined, padding: '10px 10px 0px' }}
            type="textarea"
            maxRows={enlarged ? 18 : 10}
            value={i.value}
            onChange={i.onChange}
            autoFocus={false}
          />
        )
      case 'filePathPicker':
        return (
          <FormFilePathPicker
            enableWeb={i.enableWeb}
            baidudiskCategory={i.baidudiskCategory}
            enableBaidudisk={i.enableBaidudisk}
            accept={i.accept}
            maxWidth={enlarged ? '100%' : 400}
            filePath={i.filePath}
            onChange={i.onChange}
          />
        )
      case 'addDesc':
        if (i.value || formInnerState.descVisible) return null
        return (
          <Button.IconButton
            onClick={() => setFormInnerState(s => ({ ...s, descVisible: true }))}
            icon={'park-info'}
            text={t('general.add description')}
          />
        )
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
      case 'markdownImporter':
        return <FormNoteImporter onClose={i.onClose} />
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
          <Content
            alignItems="center"
            justifyContent="space-between"
            flex
            className={ClassName.flatButton()}
            onClick={() => {
              if (i.icon) {
                i.onChange(undefined)
              } else {
                setFormInnerState({ iconPickerVisible: true })
              }
            }}
          >
            <Content gap={8} flex style={{ textTransform: 'capitalize' }}>
              <Icon name="park-emotion-happy" />
              <span>{t('general.icon')}</span>
            </Content>
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
          </Content>
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
          <Content
            alignItems="center"
            justifyContent="space-between"
            flex
            className={ClassName.flatButton()}
            onClick={() => setFormInnerState({ colorPickerVisible: true })}
          >
            <Content gap={8} flex style={{ textTransform: 'capitalize' }}>
              <Icon name="park-background-color" />
              <span>{t('general.color')}</span>
            </Content>
            {i?.color ? (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  background: i.color
                }}
              ></div>
            ) : (
              <Icon name="park-right" />
            )}
          </Content>
        )
      case 'attchmentManager':
        return (
          <Content
            alignItems="center"
            justifyContent="space-between"
            flex
            className={ClassName.flatButton()}
            onClick={() => setFormInnerState({ attachmentManagerVisible: true })}
          >
            <Content gap={8} flex>
              <Icon name="park-link" />
              <span>{i.attachments?.length ? t('general.num attachments', { num: i.attachments.length }) : t('general.attachments')}</span>
            </Content>
            <Icon name="park-right" />
          </Content>
        )
      case 'imagePicker':
        return <FormImagePicker imageUrl={i.imageUrl} onChange={i.onChange} name={i.name} />
      case 'previewGraph':
        return (
          <div
            className={ClassName.flatButton()}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              textTransform: 'capitalize'
            }}
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
      style={{
        minWidth: enlarged ? '80vw' : 320,
        maxWidth: enlarged ? '80vw' : 600,
        justifyContent: 'space-between',
        ...containerStyle
      }}
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
  const renderAttachmentManager = () => {
    const attachmentManagerItem = flattenedLayout.find(i => i && i.type === 'attchmentManager') as
      | (FlipFormLayoutItem & { type: 'attchmentManager' })
      | undefined
    if (attachmentManagerItem) {
      return (
        <Flipped flipId={attachmentManagerFlipId} onAppear={FlipCardEnter} onExit={FlipCardExit}>
          <FormAttachmentManager
            metaId={attachmentManagerItem.metaId}
            onClose={() => setFormInnerState({ mainVisible: true })}
            attachments={attachmentManagerItem.attachments}
            onAttachmentsChange={attachmentManagerItem.onChange}
          />
        </Flipped>
      )
    }
  }
  const renderForm = () => {
    return (
      <Flipper
        handleEnterUpdateDelete={handleEnterUpdateDelete}
        flipKey={`${JSON.stringify(formInnerState)}_${enlarged}`}
        spring={{ stiffness: 1600, damping: 100 }}
      >
        <Flipped flipId={mainFlipId}>
          <div
            style={{
              padding: tagPickerVisible ? '8px 6px' : 16,
              borderRadius: 8,
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div
              className={'FormDrag'}
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                right: 20,
                zIndex: 20,
                height: 24,
                width: 'calc(100% - 60px)',
                cursor: 'grab'
              }}
            ></div>
            {mainVisible && renderMain()}
            {iconPickerVisible && renderIconPicker()}
            {tagPickerVisible && renderTagPicker()}
            {colorPickerVisible && renderColorPicker()}
            {attachmentManagerVisible && renderAttachmentManager()}
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
