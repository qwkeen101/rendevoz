import { Button, Content, WithBorder } from '@/components'
import BorderInput from '@/components/base/BorderInput'
import { CustomTransforms } from '@/core/editor/utils/transform'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CustomEditor } from '~/typings'
import { EditorOverlayManager } from '../useEditorOverlay'

const EditorLinkForm = ({ editor, manager }: { editor: CustomEditor; manager: EditorOverlayManager }) => {
  const [link, setLink] = useState('')
  const { t } = useTranslation()
  const reg = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)$/
  const regx = new RegExp(reg)
  return (
    <WithBorder style={{ padding: 20 }}>
      <Content flex gap={30}>
        <BorderInput
          textarea={false}
          onChange={e => {
            setLink(e)
          }}
          value={link}
          placeholder="Input Link"
        ></BorderInput>
        <Button
          disabled={link.length === 0 || !regx.test(link)}
          onClick={() => {
            manager.close()
            const selected = CustomTransforms.getSelectedText(editor)
            if (selected?.length) {
              CustomTransforms.replaceSelectedNode(editor, {
                type: 'link',
                url: link.startsWith('http://') || link.startsWith('https://') ? link : 'http://' + link,
                children: [
                  {
                    text: selected
                  }
                ]
              })
            }
          }}
        >
          {t('general.confirm')}
        </Button>
      </Content>
    </WithBorder>
  )
}

export default EditorLinkForm
