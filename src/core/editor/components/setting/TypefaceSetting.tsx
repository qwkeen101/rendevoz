import { Content, Icon } from '@/components'
import useEditorInstance from '@/core/editor/hooks/useEditorInstance'
import { ClassName } from 'rendevoz'
import { useSelectAtomValue } from '@/hooks'
import { EditorStateAtom } from '@/core/editor/hooks/useEditorState'
import { useTranslation } from 'react-i18next'
import { Colors } from '@/consts'
import { CustomEditor } from '~/typings'

export const allBuiltInTypefaces = ['Merriweather', 'Inter', 'Roboto', 'Source Serif', 'Open Sans', 'Muli', 'Lato']

const TypefaceSetting = ({ editor }: { editor: CustomEditor }) => {
  const currentFont = useSelectAtomValue(EditorStateAtom, s => s.state?.typeface) || 'Inter'
  const { t } = useTranslation()
  return (
    <Content flex column style={{ minWidth: 200 }}>
      <div style={{ fontSize: 12, color: Colors.Font.Transparent, marginLeft: 8 }}>{t('general.Typeface')}</div>
      <Content flex column>
        {allBuiltInTypefaces.map((i, idx) => (
          <Content
            onClick={() => {
              editor?.on({
                type: 'stateChange',
                event: {
                  type: 'typeface',
                  typeface: i
                }
              })
            }}
            className={ClassName.flatButton()}
            key={i}
            flex
            alignItems={'center'}
            style={{
              fontFamily: i
            }}
          >
            {i}
            {i === currentFont && <Icon name={'park-check'} containerStyle={{ marginLeft: 'auto' }} />}
          </Content>
        ))}
      </Content>
    </Content>
  )
}

export default TypefaceSetting
