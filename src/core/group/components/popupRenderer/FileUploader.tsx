import { Button, Content, TabPane, Tabs } from '@/components'
import { Colors } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import { ClassName } from 'rendevoz'
import { useState } from 'react'

export default ({ onUpload, accept }: { onUpload: (filePath: string) => void; accept?: string }) => {
  const [input, setInput] = useState('')
  return (
    <Content style={{ padding: 6 }}>
      <Tabs defaultActiveKey={'upload'}>
        <TabPane tab={'Upload'} key="upload" style={{ padding: '16px 8px' }}>
          <Button.IconButton
            style={{
              background: Colors.Common.SelectColor,
              color: 'white',
              fontWeight: 600,
              justifyContent: 'center'
            }}
            onClick={() => {
              Rendevoz.Actions.Utils.uploadFile({ accept }).then(res => {
                if (res instanceof File) {
                  Rendevoz.Actions.Utils.saveFile(res).then(p => {
                    if (p) {
                      onUpload(p)
                    }
                  })
                }
              })
            }}
            text={'Upload a file'}
            icon={'park-upload'}
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
              background: Colors.Common.SelectColor,
              color: 'white',
              fontWeight: 600,
              justifyContent: 'center'
            }}
            onClick={() => {
              if (input) {
                onUpload(input)
              }
            }}
            text={'Embed a link'}
            icon={'park-link'}
          />
        </TabPane>
      </Tabs>
    </Content>
  )
}
