import { Button, Content, TabPane, Tabs } from '@/components'
import { Colors, KEY } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import { ClassName } from 'rendevoz'
import { memo, useEffect, useRef, useState } from 'react'
import FileSystem from '@/api/fileSystem'
import { useTranslation } from 'react-i18next'
import isHotkey from 'is-hotkey'

export default memo(
  ({
    onUpload,
    accept,
    onlyLink = false
  }: {
    onUpload: (filePath: string, fileType: string, fileName: string) => void
    accept?: string
    onlyLink?: boolean
  }) => {
    const [input, setInput] = useState('')
    const { t } = useTranslation()
    const inputRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }, [])
    return (
      <Content style={{ width: '100%' }}>
        <Tabs
          onTabClick={v => {
            inputRef.current?.focus()
          }}
          defaultActiveKey={onlyLink ? 'link' : 'upload'}
          tabNavContainerStyle={{
            padding: '8px',
            borderBottom: '1px solid var(--border-background)'
          }}
        >
          {!onlyLink ? (
            <TabPane tab={t('general.Upload')} key="upload" style={{ padding: '12px 9px' }}>
              <Button.IconButton
                style={{
                  justifyContent: 'center'
                }}
                className={ClassName.selectButton()}
                onClick={() => {
                  Rendevoz.Actions.Utils.uploadFile({ accept }).then(res => {
                    console.log(res)
                    if (res instanceof File) {
                      if (res.type.startsWith('image')) {
                        FileSystem.saveImage(res).then(p => {
                          onUpload(p, res.type, res.name)
                        })
                        return
                      }
                      FileSystem.fs.writeFile(res, `/files/${res.name}`).then(p => {
                        if (p) {
                          onUpload(p, res.type, res.name)
                        }
                      })
                    }
                  })
                }}
                text={t('general.Choose a file')}
              />
            </TabPane>
          ) : null}
          <TabPane tab={t('general.Embed link')} key={'link'} style={{ padding: '12px' }}>
            <input
              ref={inputRef}
              className={'focus-input border-box-shadow'}
              value={input}
              placeholder={t('general.Embed a link like') + ' https://....'}
              style={{
                fontSize: 14,
                marginBottom: 12,
                transition: 'all 0.16s ease',
                borderRadius: 3,
                background: Colors.Background.Secondary,
                padding: '3px 6px',
                width: '100%'
              }}
              onKeyDown={e => {
                if (isHotkey(KEY.Enter, e)) {
                  e.preventDefault()
                  onUpload(input, '', input)
                }
              }}
              onChange={e => setInput(e.target.value)}
            />
            <Button.IconButton
              style={{
                justifyContent: 'center'
              }}
              className={ClassName.selectButton()}
              onClick={() => {
                if (input) {
                  onUpload(input, '', input)
                }
              }}
              text={t('general.Embed a link')}
            />
          </TabPane>
        </Tabs>
      </Content>
    )
  }
)
