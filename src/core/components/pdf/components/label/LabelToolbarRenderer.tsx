import usePDFState from '@/core/components/pdf/hooks/usePDFState'
import { MetaStore, ObjectStore } from '@/api/stores'
import { AnimatePopover, Menu, ToolbarV2, WithBorder } from '@/components'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { useEffect, useState } from 'react'
import { useMemoizedFn } from '@/hooks'
import BlockColorPicker from '@/core/components/editor/components/BlockColorPicker'
import trans from '@/consts/trans'
import { Icons, Shortcuts } from '@/consts'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import useExplainButton from '@/core/global/components/useExplainButton'
import OcrService from '@/api/services/ocr.service'
import TooltipWithCmd from '@/components/TooltipWithCmd'
import isHotkey from 'is-hotkey'
import MetaTagPicker from '@/core/object/MetaTagPicker'
import { XYPosition } from '~/typings'
import LabelNoteRenderer from '@/core/object/renderer/LabelNoteRenderer'

const LabelToolbarRenderer = () => {
  const [state, setState] = usePDFState()
  const [v, setV] = useState(false)
  const [pos, setPos] = useState<XYPosition>()
  const { t } = useTranslation()
  useEffect(() => {
    if (state.currentFocusedLabel) {
      setV(true)
      setPos(state.currentFocusedLabel.position)
    }
  }, [state.currentFocusedLabel])
  const keydownHandler = useMemoizedFn((e: KeyboardEvent) => {
    if (isHotkey(Shortcuts.Copy[0], e)) {
      close()
      if (currentLabel) {
        const m = MetaStore.getMetaObjectByObjectId(currentLabel?.id)
        if (m) {
          Global.metaOps?.copyLink(m.id)
        }
      }
    }
  })
  useEffect(() => {
    if (v) {
      document.addEventListener('keydown', keydownHandler)
      return () => {
        document.removeEventListener('keydown', keydownHandler)
      }
    }
  }, [v])
  const currentLabel = ObjectStore('pdfLabel').useValue(state.currentFocusedLabel?.labelId)
  const labelMeta = MetaStore.useObjectToMetaValue(state.currentFocusedLabel?.labelId)
  const instance = usePDFInstance()
  let layout: string[] = []

  if (currentLabel && state.currentFocusedLabel?.position) {
    layout = layout.concat('edit', 'info', 'rightBar', 'separator', 'colorPicker')
    if (currentLabel.type === 'highlight') {
      layout.push('copy')
      layout = layout.concat('searcher', 'translator')
    }
    layout.push('separator', 'delete')
  }
  const close = () => {
    setV(false)
    setTimeout(() => {
      setState(s => ({ ...s, currentFocusedLabel: undefined }))
    }, 160)
  }
  const text = currentLabel?.selectedText
  const explainItem = useExplainButton({
    onGetExplain: () => {
      close()
      if (currentLabel) {
        return {
          query: text,
          image: currentLabel.imageUrl,
          targetChatId: instance.aiOps?.getActiveChatId(),
          source: {
            type: 'pdf',
            selectedText: text,
            page: currentLabel.page,
            labelId: currentLabel.id,
            objectId: currentLabel.parentObjectId
          }
        }
      }
    }
  })
  const hasTag = labelMeta && Global.metaOps.hasTag(labelMeta)
  return (
    <AnimatePopover
      padding={10}
      positions={['top']}
      visible={v}
      onClickOutside={() => close()}
      position={{
        left: pos?.x ?? 0,
        top: pos?.y ?? 0
      }}
      withClickCover={true}
      content={
        <WithBorder>
          {currentLabel && <LabelNoteRenderer id={currentLabel.id} />}
          <ToolbarV2
            layout={[
              {
                type: 'button',
                key: 'edit',
                text: t(trans.Edit),
                icon: Icons.Edit,
                onClick: () => {
                  close()
                  if (currentLabel && pos) {
                    instance.labelOps?.openEditLabelPopover(
                      currentLabel,
                      {
                        width: 0,
                        height: 0,
                        top: pos.y - 20,
                        left: pos.x
                      },
                      'top'
                    )
                  }
                }
              },
              explainItem,
              currentLabel
                ? {
                    type: 'button',
                    key: 'translate',
                    icon: Icons.Translate,
                    text: t(trans.Translate),
                    onClick: e => {
                      close()
                      Global.commonOps?.translate?.({
                        query: text,
                        e,
                        image: currentLabel?.imageUrl,
                        targetChatId: instance.aiOps?.getActiveChatId(),
                        source: {
                          type: 'pdf',
                          labelId: currentLabel.id,
                          objectId: currentLabel.parentObjectId,
                          page: currentLabel.page,
                          selectedText: text
                        }
                      })
                    }
                  }
                : undefined,
              {
                type: 'separator',
                key: 's-1'
              },
              {
                icon: Icons.Tag,
                key: 'tag',
                type: 'button',
                theme: hasTag ? 'filled' : undefined,
                className: hasTag ? 'text-yellow-500' : undefined,
                popover: () => (
                  <WithBorder className={'min-w-72'}>
                    <MetaTagPicker
                      alreadyTags={labelMeta?.tags || []}
                      onChange={v => {
                        if (labelMeta) {
                          MetaStore.updateMetaObject({ id: labelMeta.id, tags: v })
                        }
                      }}
                    />
                  </WithBorder>
                )
              },
              {
                type: 'button',
                key: 'color',
                icon: 'park-platte',
                popover: setV => (
                  <WithBorder>
                    <BlockColorPicker
                      showFont={false}
                      showBg={true}
                      bgBackDefault={false}
                      onPickBackgroundColor={c => {
                        setV(false)
                        if (!currentLabel) return
                        ObjectStore('pdfLabel').updateOne({ id: currentLabel?.id, color: c })
                      }}
                    />
                  </WithBorder>
                )
              },
              currentLabel?.imageUrl
                ? {
                    tooltip: t('general.Extract text'),
                    key: 'ocr',
                    icon: 'park-text-recognition',
                    type: 'button',
                    onClick: () => {
                      close()
                      const url = currentLabel?.imageUrl
                      if (url) {
                        OcrService.ocrImage(url).then(res => {
                          ObjectStore('pdfLabel').updateOne({ id: currentLabel!.id, selectedText: res })
                        })
                      }
                    }
                  }
                : undefined,
              {
                icon: Icons.Link,
                tooltip: <TooltipWithCmd name={t(trans.CopyLink)} cmd={Shortcuts.Copy[1]} />,
                key: 'copy-link',
                type: 'button',
                onClick: () => {
                  close()
                  if (currentLabel) {
                    const m = MetaStore.getMetaObjectByObjectId(currentLabel?.id)
                    if (m) {
                      Global.metaOps?.copyLink(m.id)
                    }
                  }
                }
              },
              {
                type: 'button',
                key: 'more',
                icon: Icons.More,
                strokeWidth: 6,
                popover: (
                  <WithBorder className={'py-1 min-w-52'}>
                    <Menu.NavigationMenu
                      layout={[
                        {
                          icon: Icons.Info,
                          text: t(trans.Meta.ViewDetails),
                          key: 'view-info',
                          type: 'item',
                          onSelect: () => {
                            close()
                            if (currentLabel) {
                              const m = MetaStore.getMetaObjectByObjectId(currentLabel?.id)
                              if (m) {
                                Global.metaOps?.openDetails(m.id)
                              }
                            }
                          }
                        },
                        {
                          type: 'item',
                          key: 'open-in-sidebar',
                          icon: 'custom-right-bar',
                          text: t('general.Open in sidebar'),
                          onSelect: () => {
                            close()
                            if (currentLabel) {
                              instance.jumpToLabelInSidebar?.(currentLabel?.id)
                            }
                          }
                        },
                        {
                          icon: Icons.MoveTo,
                          text: t(trans.Meta.MoveTo),
                          key: 'move-to',
                          type: 'item',
                          onSelect: () => {
                            close()
                            if (currentLabel) {
                              const m = MetaStore.getMetaObjectByObjectId(currentLabel?.id)
                              if (m) {
                                Global.metaOps?.quickAdd(m.id)
                              }
                            }
                          }
                        },
                        {
                          icon: Icons.Delete,
                          text: t(trans.Delete),
                          key: 'delete',
                          type: 'item',
                          onSelect: () => {
                            close()
                            setTimeout(() => {
                              if (currentLabel) {
                                instance.deleteLabel?.(currentLabel.id)
                              }
                              setState(s => ({ ...s, currentFocusedLabel: undefined }))
                            }, 200)
                          }
                        }
                      ]}
                    />
                  </WithBorder>
                )
              }
            ]}
          ></ToolbarV2>
        </WithBorder>
      }
    ></AnimatePopover>
  )
}

export default LabelToolbarRenderer
