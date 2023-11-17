import { CustomEditor } from '~/typings'
import { ButtonChooser, Content } from '@/components'
import _ from 'lodash'
import { useTranslation } from 'react-i18next'
import useEditorState from '@/core/components/editor/hooks/useEditorState'

export const fontSizes = _.range(12, 31, 1).map(i => `${i.toString()}px`)
export const lineSpacings = _.range(1.2, 2.5, 0.1).map(i => i.toFixed(1))
export const editorPageWidth = ['X-Small', 'Small', 'Medium', 'Large', 'X-Large']
const PageSetting = ({ editor }: { editor: CustomEditor }) => {
  const { t } = useTranslation()
  const [editorState] = useEditorState()
  return (
    <Content flex column style={{ fontSize: '1rem', minWidth: 240 }} gap={6}>
      <ButtonChooser
        icon={'park-font-size'}
        value={`${editorState.state?.fontSize || 15}px`}
        onChange={v => {
          editor.on({
            type: 'stateChange',
            event: {
              type: 'fontSize',
              fontSize: parseInt(v)
            }
          })
        }}
        options={fontSizes}
        name={t('general.Font size')}
      />
      <ButtonChooser
        icon={'park-auto-line-height'}
        value={`${(editorState.state?.lineSpacing || 1.3).toFixed(1)}`}
        onChange={v => {
          editor.on({
            type: 'stateChange',
            event: {
              type: 'lineSpacing',
              lineSpacing: Number(parseFloat(v).toFixed(1))
            }
          })
        }}
        options={lineSpacings}
        name={t('general.Line spacing')}
      />
      <ButtonChooser
        value={editorState.state?.pageWidth || 'Medium'}
        onChange={v => {
          editor.on({
            type: 'stateChange',
            event: {
              type: 'pageWidth',
              width: v
            }
          })
        }}
        options={editorPageWidth}
        name={t('general.Page width')}
      />
    </Content>
  )
}

export default PageSetting
