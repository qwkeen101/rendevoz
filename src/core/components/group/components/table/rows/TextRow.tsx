import { IGroupRow } from '@/core/components/group/components/table/rows/types'
import { MetaGroupChild } from '~/typings'
import { Content } from '@/components'
import { Colors, KEY } from '@/consts'
import { ClassName } from 'rendevoz'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { RowWrapper } from '@/core/components/group/components/table/RowWrapper'
import isHotkey from 'is-hotkey'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { useState } from 'react'
import { Container } from '@/core/components/group/components/table/rows/MetaRow'
import ToggleArrow from '@/core/components/group/components/basic/ToggleArrow'

const TextRow = ({ rowDetails, path, rowRef, renderIndicator, isSelected, renderCheckbox }: IGroupRow) => {
  const textRowDetails = rowDetails as MetaGroupChild & { type: 'text' }
  const hasChildren = !!textRowDetails.children?.length
  const instance = useGroupInstance()
  const indent = path.length - 1
  const [height, setHeight] = useState(0)

  return (
    <Container hasChildren={hasChildren}>
      <Content
        flex
        alignItems={'center'}
        ref={rowRef}
        style={{
          position: 'relative',
          borderBottom: `1px solid ${Colors.Background.Border}`,
          background: isSelected ? Colors.Common.SelectColorTransparent : undefined,
          transition: 'background 0.2s ease'
        }}
      >
        {renderCheckbox()}
        {renderIndicator()}
        <Content
          style={{
            height: height + 10,
            padding: `5px 8px 5px 8px`,
            paddingLeft: `${indent * 30 + (hasChildren ? 2 : 8) - (hasChildren && indent ? 26 : 0)}px`
          }}
          fullWidth
          flex
          alignItems={'flex-start'}
          gap={4}
        >
          {hasChildren && (
            <div style={{ marginTop: 1 }}>
              <ToggleArrow path={path} toggled={!!rowDetails.toggled} />
            </div>
          )}
          <AutosizeTextarea
            onHeightChange={height => setHeight(height)}
            style={{ width: '100%', padding: 0, resize: 'none' }}
            className={ClassName.noStyleInput}
            defaultValue={textRowDetails.textContent}
            onBlur={e => {
              if (e.currentTarget.value !== textRowDetails.textContent) {
                instance.valueOps?.updateValueByPath(
                  {
                    textContent: e.currentTarget.value
                  },
                  path
                )
              }
            }}
          />
        </Content>
      </Content>
      {!rowDetails.toggled && rowDetails.children?.map((i, idx) => <RowWrapper rowDetails={i} path={[...path, idx]} />)}
    </Container>
  )
}

export default TextRow
