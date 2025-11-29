import { AnimatePopover, Icon, IconWithPopover, WithBorder, ContentEditor, Markdown } from '@/components'
import { MetaStore, ObjectStore } from '@/api/stores'
import { CSSProperties, useState } from 'react'
import LabelActionMenu, { LabelActionEvent } from '../menus/LabelActionMenu'
import { InlineObject } from '../index'
import { useTranslation } from 'react-i18next'
import { Colors, Icons } from '@/consts'
import { useIsIn } from '@/hooks'
import { ILabel } from '~/typings'
import { GlobalSetting, ObjectTag } from '@/core'
import classnames from 'classnames'
import QuestionCard from '@/core/ai/components/question/QuestionCard'
import { DateFormat } from '@/utils'
import MetaTagPicker from '@/core/object/MetaTagPicker'
import toast from 'react-hot-toast'
import trans from '@/consts/trans'
const DEFAULT_LABEL_NAME = 'Unnamed Label'
const useRenderLabel = (opts: {
  objectId: number
  type: 'videoLabel' | 'pdfLabel' | 'noteLabel' | 'webpageLabel'
  onDelete?: VoidFunction
  onMove: VoidFunction
}) => {
  const { objectId, type, onMove } = opts
  const label = ObjectStore(opts.type).useValue(opts.objectId) as ILabel | undefined
  const parentMeta = MetaStore.useObjectToMetaValue(label?.parentObjectId)
  const labelMeta = MetaStore.useObjectToMetaValue(opts.objectId)
  const collapseLongText = GlobalSetting.useSelectSettingAtom('collapseLabelText')
  const { t } = useTranslation()
  const [labelState, setLabelState] = useState<{
    addingAttachment: boolean
    addingDescription: boolean
    focused: boolean
    editingName: boolean
    showMoreText: boolean
    editingOrigin: boolean
  }>({
    focused: false,
    editingOrigin: false,
    editingName: false,
    addingDescription: false,
    addingAttachment: false,
    showMoreText: false
  })
  const { ref, isIn } = useIsIn()
  const currentLabelHasName = label && label.name && label.name !== DEFAULT_LABEL_NAME
  const relatedMap = MetaStore.useIndexedMetaLinks().relatedIdsMap
  const metaRelated = labelMeta ? relatedMap.get(labelMeta.id) : []
  const realRelated = new Set(metaRelated)
  // trigger related change
  MetaStore.useIndexedMetaObjects()
  if (parentMeta) {
    realRelated.delete(parentMeta.id)
  }
  realRelated.forEach(i => {
    const m = MetaStore.getCachedMetaObject(i)
    if (!m || m.deleted) {
      realRelated.delete(i)
    }
  })
  const renderName = (options?: { style?: CSSProperties; defaultVisible?: boolean }) => {
    return labelState.editingName ? (
      <ContentEditor
        style={options?.style}
        placeholder={`${t('general.Add note')}...`}
        value={currentLabelHasName ? label?.name : undefined}
        onChange={async v => {
          if (labelMeta) {
            await MetaStore.updateMetaObject({ id: labelMeta.id, name: v })
            setLabelState(s => ({ ...s, editingName: false }))
            return
          }
          await ObjectStore(type).updateOne({ id: objectId, name: v })
          setLabelState(s => ({ ...s, editingName: false }))
        }}
      />
    ) : currentLabelHasName || options?.defaultVisible ? (
      currentLabelHasName ? (
        <Markdown className={'break-all'}>{label?.name}</Markdown>
      ) : (
        <div
          className={'super-transparent-font cursor-pointer w-fit'}
          onClick={e => {
            e.preventDefault()
            setLabelState(s => ({ ...s, editingName: true }))
          }}
        >
          {t('general.Add note')}...
        </div>
      )
    ) : null
  }

  const renderContextMenu = (on?: (e: LabelActionEvent) => void, onClose?: VoidFunction) => {
    return (
      <LabelActionMenu
        onClose={() => onClose?.()}
        on={async event => {
          on?.(event)
          switch (event.type) {
            case 'move':
              onMove()
              break
            case 'addNote': {
              setLabelState(s => ({ ...s, editingName: true }))
              break
            }
            case 'editOriginal': {
              setLabelState(s => ({ ...s, editingOrigin: true }))
              break
            }
            case 'delete':
              opts?.onDelete?.()
              break
            case 'changeName':
              setLabelState(s => ({ ...s, editingName: true }))
              break
          }
        }}
        objectId={objectId}
        type={type}
      />
    )
  }

  const renderHeader = (options?: {
    on?: (e: LabelActionEvent) => void
    style?: CSSProperties
    showEdit?: boolean
    showPage?: boolean
    showTime?: boolean
    showPath?: number[]
  }) => {
    return (
      <div className={'transparent-font flex justify-between relative'} style={options?.style}>
        <div className={'font-size-11 leading-none'}>
          {label &&
            options?.showPage &&
            'page' in label &&
            typeof label.page === 'number' &&
            label.page !== undefined &&
            `${t('general.Page', { num: label.page + 1 })}`}
          {label && options?.showPath && t('general.Paragraph num', { num: options.showPath[0] + 1 })}
          {label && options?.showTime && 'time' in label && typeof label.time === 'number' && `${DateFormat.formatDuration(label.time)}`}
          {label &&
            !options?.showPath &&
            !options?.showPage &&
            !options?.showTime &&
            DateFormat.formatDistanceToNowStrict(label.createdAt, true)}
        </div>
        <div
          className={classnames('items-center gap-3.5 flex transition-opacity absolute top-0 right-0', isIn ? 'opacity-100' : 'opacity-0')}
        >
          <Icon
            className={'cursor-pointer'}
            name={Icons.Edit}
            size={14}
            onClick={e => {
              e.preventDefault()
              setLabelState(s => ({ ...s, editingName: !s.editingName }))
            }}
          />
          <Icon
            name={Icons.Link}
            className={'cursor-pointer'}
            onClick={async e => {
              e.preventDefault()
              if (labelMeta) {
                Global.metaOps.copyLink(labelMeta.id)
              }
            }}
            size={14}
          />
          <IconWithPopover
            name={Icons.More}
            size={14}
            className={'cursor-pointer'}
            placement={['right', 'left']}
            renderOnParent={false}
            align={'start'}
            onClick={e => e.preventDefault()}
            content={setV => renderContextMenu(options?.on, () => setV(false))}
          ></IconWithPopover>
        </div>
      </div>
    )
  }

  const renderTags = (style?: CSSProperties) => {
    if (!labelMeta) return null
    if (labelMeta && !labelMeta.tags?.length && !realRelated.size) return null
    const tags = labelMeta.tags
    return (
      <div className={'gap-2 flex flex-wrap'} style={style}>
        {realRelated.size > 0 && (
          <AnimatePopover
            containerStyle={{
              zIndex: '500'
            }}
            align={'center'}
            disableNudge
            positions={['top', 'bottom']}
            content={
              <WithBorder onClick={e => e.stopPropagation()} className={'max-w-md min-w-48 p-1.5'}>
                <div className={'menu-sub-title'}>{t('general.related objects')}</div>
                {Array.from(realRelated.values()).map(i => (
                  <InlineObject id={i} key={i} />
                ))}
              </WithBorder>
            }
          >
            <div
              style={{
                lineHeight: 1.4,
                padding: '0px 6px'
              }}
              onClick={e => e.stopPropagation()}
              className={'font-size-12 cursor-pointer em:rounded select-color-font select-color-transparent-bg'}
            >
              {realRelated.size} {t('general.related')}
            </div>
          </AnimatePopover>
        )}
        {tags?.map(i => <ObjectTag className={'font-size-12'} key={i} tag={i} hideDelete square />)}
      </div>
    )
  }

  const renderOriginalText = (options: { text: string; style?: CSSProperties; editorStyle?: CSSProperties; hideIfImage?: boolean }) => {
    if (labelState.editingOrigin) {
      return (
        <ContentEditor
          style={options.editorStyle}
          value={options.text}
          onChange={v => {
            setLabelState(s => ({ ...s, editingOrigin: false }))
            ObjectStore(type).updateOne({ id: label?.id, selectedText: v })
          }}
        />
      )
    }
    if (!options.text) return null
    if (label?.imageUrl && options.hideIfImage !== false) return null
    return (
      <div
        className={classnames(
          'font-size-13 transparent-font mt-0.5 whitespace-pre-wrap break-words em:pr-2 em:pl-3',
          collapseLongText && 'line-clamp-3'
        )}
        style={{
          borderLeft: label?.color ? `3px solid ${Colors.getAdaptColor(label.color)}` : `3px solid ${Colors.Emphasis.Emphasis}`,
          ...options.style
        }}
      >
        {options.text}
      </div>
    )
  }

  const renderQuestions = (opts?: { style?: CSSProperties }) => {
    if (labelMeta?.properties) {
      const questionProperties = Object.entries(labelMeta.properties).filter(
        i => MetaStore.property.getPropDetails(i[0])?.propType === 'question' && i[1].value
      )
      if (questionProperties.length) {
        return (
          <div onClick={e => e.preventDefault()} style={opts?.style} className={'flex flex-col gap-3'}>
            {questionProperties.map(p => (
              <div key={p[1].value}>
                <div className={'font-size-11 transparent-font flex items-center gap-1.5 mb-1'}>
                  <Icon name={Global.utils.getIcon('question')} />
                  {MetaStore.property.getPropDetails(p[0])?.name}
                </div>
                <QuestionCard
                  autoFocus={false}
                  id={p[1].value}
                  display={{
                    more: false
                  }}
                  styles={{
                    smallFontSize: '0.82em',
                    contentFontSize: '0.9em'
                  }}
                  containerStyle={{
                    padding: 0
                  }}
                />
              </div>
            ))}
          </div>
        )
      }
    }
  }
  return {
    renderName,
    renderOriginalText,
    renderTags,
    renderQuestions,
    renderHeader,
    labelMeta,
    renderContextMenu,
    label,
    setDraggingDetails: d => {
      Global.values.draggingDetails = d
    },
    ref
  }
}

export default useRenderLabel
