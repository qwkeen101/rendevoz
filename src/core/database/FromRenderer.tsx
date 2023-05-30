import { IconNameItem } from '@/components/layout/sidebar/SidebarCollection'
import { getIcon } from '@/components/layout/sidebar/items/SidebarObjectItem'
import Colors from '@/consts/colors'
import { MetaStore } from '@/stores'
import { CSSProperties, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MetaObject } from '~/typings'
import Actions from '../Actions'
import { delay } from '@/utils/functions'
import FontSize from '@/consts/font'
import { css } from '@emotion/css'
import { goToBlock, selectBlock } from '../editor/utils'
import { Content, Tooltip } from '@/components'
import ClassName from '@/styles/classNames'
import WebpageSourceRenderer from './WebpageSourceRenderer'
import { PAGE_SPACING } from '../pdf/core/layouts/Layout'

const FromRenderer = ({
  metaObject: initialObject,
  style,
  onFromClick
}: {
  metaObject?: MetaObject
  style?: CSSProperties
  onFromClick?: () => void
}) => {
  const [fromState, setFromState] = useState<{
    name?: string
    icon?: string
  }>()
  const { t } = useTranslation()
  useEffect(() => {
    const setAction = async () => {
      if (!initialObject?.fromObject) {
        setFromState(undefined)
      }
      if (initialObject?.fromObject) {
        const { fromObject: from } = initialObject
        const fromMeta = await MetaStore.getMetaObjectById(from.metaId)
        if (!fromMeta) {
          setFromState(undefined)
          return
        }
        switch (from.type) {
          case 'pdf': {
            const { pages } = from
            const renderPages = pages && (pages.length > 1 ? `${pages[0] + 1}-${pages.pop()! + 1}` : `${pages[0] + 1}`)
            setFromState({
              name: `${fromMeta.name}${pages ? ' ' + t('general.page') + ': ' + renderPages : ''}`,
              icon: fromMeta.icon || getIcon('pdf')
            })
            break
          }
          case 'webpage':
          case 'whiteboard':
          case 'note': {
            setFromState({
              name: fromMeta.name,
              icon: fromMeta.icon || getIcon(from.type)
            })
            break
          }
        }
      }
    }
    setAction()
  }, [initialObject])
  const handleNavigateToFrom = async () => {
    if (initialObject?.fromObject) {
      const { fromObject: from } = initialObject
      const fromMeta = await MetaStore.getMetaObjectById(from.metaId)
      if (!fromMeta || !fromMeta.objectId) return
      const { objectId } = fromMeta
      switch (from.type) {
        case 'pdf': {
          const { pages, rect, selectedText } = from
          const pdf = await Actions.openPdf(objectId)
          if (pages) {
            await delay(100)
            pdf.jumpToPage?.(pages[0])
            if (rect) {
              const pageSize = pdf.getPageSize?.()
              if (pageSize) {
                const realPageHeight = pageSize.height * pageSize.scale
                pdf.scrollToOffset?.(
                  pages[0] * realPageHeight + rect.top * realPageHeight + (rect.height * realPageHeight) / 2 + pages[0] * PAGE_SPACING
                )
              }

              pdf.highlightArea?.(pages[0], rect)
            }
            if (selectedText) {
              pdf.highlightText?.(selectedText, pages[0])
            }
          }
          break
        }
        case 'note': {
          const editor = await Actions.openEditor(objectId)
          if (from.blockId) {
            await goToBlock(from.blockId, editor)
            selectBlock(from.blockId, editor)
          }
          break
        }
        case 'webpage': {
          const webpage = await Actions.openWebpage(objectId)
          if (from.blockId) {
            const editor = await webpage.transformToNote()
            await goToBlock(from.blockId, editor)
            selectBlock(from.blockId, editor)
          }
        }
      }
    }
    // if (initialObject?.type && initialObject.objectId) {
    //   const { type, objectId } = initialObject
    //   switch (type) {
    //     case 'image': {
    //       const image = await ObjectStore('image').getOneById(objectId)
    //       if (image) {
    //         const { from } = image
    //         if (from?.type === 'pdf') {
    //           const { pages, rect } = from
    //           const pdf = await Actions.openPdf(from.pdfId)
    //           if (pages) {
    //             await delay(100)
    //             pdf.jumpToPage?.(pages[0])
    //             if (rect) {
    //               const pageSize = pdf.getPageSize?.()
    //               if (pageSize) {
    //                 const realPageHeight = pageSize.height * pageSize.scale
    //                 pdf.scrollToOffset?.(pages[0] * realPageHeight + rect.top * realPageHeight + (rect.height * realPageHeight) / 2)
    //               }

    //               pdf.highlightArea?.(pages[0], rect)
    //             }
    //           }
    //         }
    //         if (from?.type === 'note') {
    //           const { noteId } = from
    //           Actions.openEditor(noteId)
    //         }
    //       }
    //       break
    //     }
    //     case 'noteLabel':
    //     case 'noteBlock': {
    //       const one = await ObjectStore(type).getOneById(objectId)
    //       if (one) {
    //         const { noteId } = one
    //         if (noteId) {
    //           Actions.openEditor(noteId)
    //         }
    //       }
    //       break
    //     }
    //     case 'pdfLabel': {
    //       const label = await ObjectStore(type).getOneById(objectId)
    //       if (label) {
    //         const { documentId } = label
    //         if (documentId) {
    //           Actions.openPdf(documentId)
    //         }
    //       }
    //     }
    //   }
    // }
  }
  if (!fromState?.name) return null

  return (
    <Tooltip
      content={
        <Content
          flex
          column
          style={{ maxWidth: 500, padding: 8 }}
          gap={7}
          // @ts-ignore
          className={css({
            p: {
              textTransform: 'none !important',
              margin: 0
            }
          })}
        >
          <div className={ClassName.description(FontSize['12px'])}>
            {t('general.from')} {t(`general.${initialObject?.fromObject?.type}`)}
          </div>
          <p className={ClassName.ellipsisFont(2)}>{fromState.name}</p>
          {initialObject?.fromObject?.selectedText && (
            <>
              <div className={ClassName.description(FontSize['12px'])}>{t('general.selected text')}</div>
              <p className={ClassName.ellipsisFont(5)}>{initialObject.fromObject.selectedText}</p>
            </>
          )}
        </Content>
      }
    >
      <IconNameItem
        className={css({
          ':hover': {
            textDecoration: 'underline'
          }
        })}
        style={{
          color: Colors.Font.Secondary,
          fontSize: FontSize['13px'],
          textTransform: 'none',
          cursor: 'pointer',
          width: 'fit-content',
          ...style
        }}
        onClick={() => {
          handleNavigateToFrom()
          onFromClick?.()
        }}
        name={fromState?.name}
        icon={fromState?.icon}
      />
    </Tooltip>
  )
}

export default FromRenderer
