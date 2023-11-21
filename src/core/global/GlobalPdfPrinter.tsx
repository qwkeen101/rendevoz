import { useToggle } from '@/hooks'
import { assignProperties } from '@/utils'
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react'

import { CacheProvider } from '@emotion/react'
import { css, cache } from '@emotion/css'
import { createPortal } from 'react-dom'
import { ipcInstance } from '@/plugins'
import { GlobalInstances } from '~/typings'
import Id from '@/utils/id'
import { Editor } from '@/core'
import { ClassName, Components, Consts } from 'rendevoz'
import { Content, Switch } from '@/components'
import { useTranslation } from 'react-i18next'
import Select from '@/components/base/select'
import { Colors } from '@/consts'

export const GlobalPdfPrinterInstance: GlobalInstances.PdfPrinterInstance = {}

const GlobalPdfPrinter = () => {
  const [modalVisible, toggleModalVisible] = useToggle(false)
  const [children, setChildren] = useState<ReactElement>()
  const [saveButtonVisible, toggleSaveButtonVisible] = useState(false)
  const currentTitleRef = useRef('')
  assignProperties(GlobalPdfPrinterInstance, {
    print: printable => {
      switch (printable.type) {
        case 'note': {
          setChildren(
            <Editor
              state={{
                fontSize: 15,
                lineSpacing: 1.4
              }}
              styles={{
                containerHeight: 'initial',
                outestContainerStyle: {
                  height: 'unset'
                }
              }}
              readOnly={true}
              defaultValue={printable.value}
              layout={{
                showBlockHandle: false,
                showToolbar: false,
                showHeader: false
              }}
              stringTitle={printable.title}
              id={Id.getStrId()}
            />
          )
          currentTitleRef.current = printable.title
          break
        }
      }
      toggleModalVisible(true)
    }
  })

  const containerEle = useMemo(() => document.createElement('div'), [modalVisible])

  const externalWindowRef = useRef<Window>()

  useEffect(() => {
    if (modalVisible) {
      const center = {
        x: window.screen.width / 2 - 550,
        y: window.screen.height / 2 - 400
      }
      const externalWindow = window.open('printer.html', '', `width=1100,height=800,left=${center.x},top=${center.y}`)
      setTimeout(() => {
        if (externalWindow) {
          Array.from(document.head.children)
            .filter(i => i.nodeName === 'LINK')
            .forEach(i => externalWindow.document.head.appendChild(i.cloneNode(true)))
          externalWindow.document.documentElement.setAttribute('theme', 'light')
          externalWindow.document.documentElement.style.width = '100vw'
          externalWindow.document.documentElement.style.height = 'initial'
          externalWindow.document.body.style.background = 'white'
          externalWindow.document.body.style.width = '100%'
          externalWindow.document.title = 'Export as PDF'
          externalWindowRef.current = externalWindow
          document.head.querySelectorAll('[data-emotion]').forEach(style => {
            console.log(style)
            const s = document.createElement('style')
            s.appendChild(document.createTextNode(''))
            externalWindow.document.head.appendChild(s)
            const newSheet = s.sheet
            Array.from(style.sheet.cssRules || []).forEach(rule => {
              newSheet.insertRule(rule.cssText)
            })
          })

          // s.sheet.insertRule()
          window.document.body.classList.forEach(i => {
            externalWindow.document.body.classList.add(i)
          })

          // Object.entries(sheet.tags).forEach(i => {
          //   externalWindow.document.head.appendChild(i[1].cloneNode(true))
          // })
          externalWindow.document.documentElement.style.overflowY = 'auto'
          externalWindow.document.body.appendChild(containerEle)
          containerEle.style.width = '100%'
          externalWindow.onunload = () => {
            toggleModalVisible(false)
          }
        }
      }, 100)

      toggleSaveButtonVisible(true)
      return () => {
        externalWindow?.close()
        toggleSaveButtonVisible(false)
        setChildren(undefined)
      }
    }
  }, [modalVisible])
  const containerRef = useRef(null)
  if (modalVisible && children) {
    return createPortal(
      <CacheProvider value={cache}>
        <Content fullWidth flex>
          <div
            style={{
              width: saveButtonVisible ? 'calc(100% - 260px)' : '100%'
            }}
            ref={containerRef}
            className={css({
              math: {
                display: 'none'
              },
              '*': {
                pointerEvents: 'none'
              },
              width: '100%'
            })}
          >
            {children}
          </div>
          {saveButtonVisible && (
            <PDFExportSettings
              onExport={s => {
                toggleSaveButtonVisible(false)
                setTimeout(() => {
                  console.log('printing to pdf')
                  ipcInstance
                    .send('printPDF', {
                      name: currentTitleRef.current,
                      size: s.pageSize,
                      horizontal: s.horizontal,
                      margin: s.margin
                    })
                    .then(res => {
                      if (res) {
                        if (res.data === 'OK') {
                          toggleModalVisible(false)
                        } else {
                          toggleSaveButtonVisible(true)
                        }
                      }
                    })
                }, 500)
              }}
            />
          )}
        </Content>
      </CacheProvider>,
      containerEle
    )
  }
  return null
}

const PDFExportSettings = ({ onExport }: { onExport: (setting: { pageSize: string; horizontal: boolean; margin: string }) => void }) => {
  const [exportState, setExportState] = useState<{
    pageSize: 'A3' | 'A4' | 'A5' | 'Letter' | 'Legal'
    horizontal: boolean
    margin: 'default' | 'none'
  }>({
    pageSize: 'A4',
    horizontal: false,
    margin: 'default'
  })
  const { t } = useTranslation()
  return (
    <Components.Content
      flex
      column
      style={{
        width: '260px',
        right: 0,
        position: 'fixed',
        top: 0,
        height: '100%',
        borderLeft: `1px solid ${Colors.Background.Border}`,
        padding: 24
      }}
    >
      <div className={ClassName.title()} style={{ marginBottom: 30 }}>
        {t('general.pdf export settings')}
      </div>
      <Components.Content
        flex
        column
        gap={10}
        className={css({
          '> div': {
            ':not(:last-child)': {
              paddingBottom: 10,
              borderBottom: `1px solid ${Consts.Colors.Background.Border}`
            }
          }
        })}
      >
        <Components.Content flex alignItems="center" justifyContent="space-between">
          <div>{t('general.horizontal')}</div>
          <Switch value={exportState.horizontal} onChange={v => setExportState(s => ({ ...s, horizontal: v }))} />
        </Components.Content>
        <Components.Content flex alignItems="center" justifyContent="space-between">
          <div>{t('general.page size')}</div>
          <Select
            closeOnSelect
            value={exportState.pageSize}
            onSelect={v => setExportState(s => ({ ...s, pageSize: v[0] }))}
            options={[
              {
                value: 'A3',
                children: 'A3'
              },
              {
                value: 'A4',
                children: 'A4'
              },
              {
                value: 'A5',
                children: 'A5'
              },
              {
                value: 'Letter',
                children: 'Letter'
              },
              {
                value: 'Legal',
                children: 'Legal'
              }
            ]}
          ></Select>
        </Components.Content>
        <Components.Content flex alignItems="center" justifyContent="space-between">
          <div>{t('general.margin')}</div>
          <Select
            closeOnSelect
            value={exportState.margin}
            onSelect={v => setExportState(s => ({ ...s, margin: v[0] }))}
            options={[
              {
                value: 'none',
                children: 'None'
              },
              {
                value: 'default',
                children: 'Default'
              }
            ]}
          ></Select>
        </Components.Content>
      </Components.Content>
      <div
        className={ClassName.flatButton()}
        style={{ marginTop: 30, border: `1px solid ${Colors.Background.Border}`, textAlign: 'center', fontWeight: 600 }}
        onClick={() => {
          onExport?.({
            pageSize: exportState.pageSize,
            margin: exportState.margin,
            horizontal: exportState.horizontal
          })
        }}
      >
        {t('general.export')}
      </div>
    </Components.Content>
  )
}

export default GlobalPdfPrinter
