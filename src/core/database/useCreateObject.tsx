import { AnimatePopover, Button, Content, Icon, Modal, WithBorder } from '@/components'
import CreateDocumentForm from '@/components/form/CreateDocumentForm'
import { ObjectStore } from '@/stores'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import Actions from '../Actions'
import { AnimatePopoverProps } from '@/components/base/AnimatePopover'
import { Zindexes } from '@/consts'
import ClassName from '@/styles/classNames'

export const useCreateObject = (options?: {
  positions: AnimatePopoverProps['positions']
  padding?: number
  visiblities?: {
    note?: boolean
    pdf?: boolean
    whiteboard?: boolean
    webpage?: boolean
    localFile?: boolean
  }
}) => {
  const [modalState, setModalState] = useState<{
    createDoc?: boolean
  }>()
  const { t } = useTranslation()
  const [popoverState, setPopoverState] = useState<{
    visible: boolean
    popoverVisible: boolean
    x: number
    y: number
    isOpenCenter?: boolean
  }>()

  const closeModal = () => setModalState(undefined)
  const portal = createPortal(
    <>
      <Modal noStyle visible={!!modalState?.createDoc} onClose={closeModal}>
        {modalState?.createDoc && (
          <CreateDocumentForm
            onBack={closeModal}
            onSubmit={meta => {
              closeModal()
              Actions.navigateToTargetObject(meta.id)
            }}
          />
        )}
      </Modal>
      {popoverState?.popoverVisible && (
        <AnimatePopover
          containerStyle={{
            zIndex: String(Zindexes.PopupMenu)
          }}
          boundaryInset={20}
          positions={options?.positions}
          visible={!!popoverState?.visible}
          padding={options?.padding || 10}
          content={
            <WithBorder padding={6} onClick={() => setPopoverState(undefined)} style={{ width: popoverState.isOpenCenter ? 300 : 140 }}>
              {popoverState.isOpenCenter && (
                <Content flex justifyContent="space-between" alignItems="center" style={{ padding: '4px 8px', marginBottom: 16 }}>
                  <div className={ClassName.title('1rem')}>Create One Object</div>
                  <Icon
                    name="park-close"
                    onClick={() => {
                      setPopoverState({ ...popoverState, visible: false })
                      setTimeout(() => {
                        setPopoverState(undefined)
                      }, 300)
                    }}
                  />
                </Content>
              )}
              {options?.visiblities?.pdf !== false && (
                <Button.IconButton
                  icon="park-file-pdf"
                  text={t('general.pdf')}
                  onClick={() => {
                    setModalState({ createDoc: true })
                  }}
                />
              )}
              {options?.visiblities?.webpage !== false && (
                <Button.IconButton
                  icon="park-web-page"
                  text={t('general.webpage')}
                  onClick={() => {
                    ObjectStore('webpage')
                      .addOneWithMeta(
                        {
                          title: 'Unknown webpage'
                        },
                        { showMetaModal: true }
                      )
                      .then(({ one }) => {
                        Actions.openWebpage(one.id)
                      })
                  }}
                />
              )}
              {options?.visiblities?.whiteboard !== false && (
                <Button.IconButton
                  icon="park-new-computer"
                  text={t('general.whiteboard')}
                  onClick={() => {
                    ObjectStore('whiteboard')
                      .addOneWithMeta(
                        {
                          name: 'Unknown whiteboard'
                        },
                        { showMetaModal: true }
                      )
                      .then(({ one }) => {
                        Actions.openWhiteboard(one.id)
                      })
                  }}
                />
              )}
              {options?.visiblities?.note !== false && (
                <Button.IconButton
                  icon="park-notes"
                  text={t('general.note')}
                  onClick={() => {
                    ObjectStore('note')
                      .addOneWithMeta({ title: 'Untitled' }, { showMetaModal: true })
                      .then(({ one }) => {
                        Actions.openEditor(one.id)
                      })
                  }}
                />
              )}
              {options?.visiblities?.localFile !== false && (
                <Button.IconButton
                  icon="park-log"
                  text={t('general.local file')}
                  onClick={() => {
                    ObjectStore('localFile').addOneWithMeta({}, { showMetaModal: true })
                  }}
                />
              )}
            </WithBorder>
          }
          onClickOutside={() => {
            setPopoverState({ ...popoverState, visible: false })
            setTimeout(() => {
              setPopoverState(undefined)
            }, 300)
          }}
        >
          <div style={{ position: 'fixed', top: popoverState.y, left: popoverState.x }}></div>
        </AnimatePopover>
      )}
    </>,
    document.body
  )
  return {
    portal,
    openAtCenter: () => {
      if (popoverState?.visible || popoverState?.popoverVisible) {
        return
      }
      setPopoverState({
        visible: true,
        popoverVisible: true,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        isOpenCenter: true
      })
    },
    open: (e: PointerEvent | MouseEvent) => {
      if (popoverState?.visible || popoverState?.popoverVisible) {
        return
      }
      const target = e.currentTarget
      if (target instanceof HTMLElement) {
        const bounding = target.getBoundingClientRect()
        setPopoverState({
          x: bounding.x + bounding.width / 2,
          y: bounding.y + bounding.height / 2,
          visible: true,
          popoverVisible: true
        })
      }
    }
  }
}
