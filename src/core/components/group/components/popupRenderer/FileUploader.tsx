import { Button, Content, TabPane, Tabs } from '@/components'
import { Colors } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import { ClassName } from 'rendevoz'
import { useState } from 'react'
import FileSystem from '@/api/fileSystem'

export default ({ onUpload, accept }: { onUpload: (filePath: string, fileType: string, fileName: string) => void; accept?: string }) => {
  const [input, setInput] = useState('')
  return (
    <Content style={{ width: '100%' }}>
      <Tabs
        defaultActiveKey={'upload'}
        tabNavContainerStyle={{
          padding: '8px',
          borderBottom: '1px solid var(--border-background)'
        }}
      >
        <TabPane tab={'Upload'} key="upload" style={{ padding: '12px 9px' }}>
          <Button.IconButton
            style={{
              justifyContent: 'center'
            }}
            className={ClassName.selectButton()}
            onClick={() => {
              Rendevoz.Actions.Utils.uploadFile({ accept }).then(res => {
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
            text={'Choose a file'}
          />
        </TabPane>
        <TabPane tab={'Embed link'} key={'link'} style={{ padding: '16px 8px' }}>
          <input
            className={ClassName.noStyleInput}
            value={input}
            placeholder={'Embed a link like https://....'}
            style={{
              fontSize: 14,
              marginBottom: 12,
              borderBottom: `1px solid ${Colors.Background.Border}`,
              width: '100%'
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
            text={'Embed a link'}
          />
        </TabPane>
      </Tabs>
    </Content>
  )
}
