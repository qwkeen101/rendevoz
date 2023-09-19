import { IGroupRow } from '@/core/group/components/table/rows/types'
import { MetaGroupChild } from '~/typings'
import { Content } from '@/components'
import { Colors, KEY } from '@/consts'
import { ClassName } from 'rendevoz'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import { RowWrapper } from '@/core/group/components/table/RowWrapper'
import isHotkey from 'is-hotkey'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { useState } from 'react'

const TextRow = ({ rowDetails, path, rowRef, renderIndicator, isSelected }: IGroupRow) => {
  const textRowDetails = rowDetails as MetaGroupChild & { type: 'text' }
  const hasChildren = textRowDetails.children?.length
  const instance = useGroupInstance()
  const indent = path.length - 1
  const [height, setHeight] = useState(0)
  // const handleInsertNewRow = () => {
  //   instance.valueOps?.insertValueByPath(
  //     {
  //       type: 'text',
  //       textContent: 'new add'
  //     },
  //     path
  //   )
  // }
  if (hasChildren) {
    return (
      <Content flex column>
        {renderIndicator()}
        <div
          ref={rowRef}
          style={{
            position: 'relative',
            borderBottom: `1px solid ${Colors.Background.Border}`,
            paddingLeft: indent * 20,
            height,
            background: isSelected ? Colors.Common.SelectColorTransparent : undefined
          }}
        >
          <AutosizeTextarea
            onHeightChange={height => setHeight(height)}
            style={{ width: '100%' }}
            className={ClassName.noStyleInput}
            defaultValue={textRowDetails.textContent}
            // onKeyDown={e => {
            //   if (isHotkey(KEY.Enter, e)) {
            //     handleInsertNewRow()
            //     e.preventDefault()
            //   }
            // }}
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
        </div>
        {!rowDetails.toggled && rowDetails.children?.map((i, idx) => <RowWrapper rowDetails={i} path={[...path, idx]} />)}
      </Content>
    )
  } else {
    return (
      <div
        ref={rowRef}
        style={{
          position: 'relative',
          borderBottom: `1px solid ${Colors.Background.Border}`,
          paddingLeft: indent * 20,
          height,
          background: isSelected ? Colors.Common.SelectColorTransparent : undefined
        }}
      >
        {renderIndicator()}
        <AutosizeTextarea
          onHeightChange={height => setHeight(height)}
          // onKeyDown={e => {
          //   if (isHotkey(KEY.Enter, e)) {
          //     handleInsertNewRow()
          //     e.preventDefault()
          //   }
          // }}
          className={ClassName.noStyleInput}
          style={{ width: '100%', padding: '5px 8px' }}
          defaultValue={textRowDetails.textContent}
          onBlur={e => {
            if (e.currentTarget.value !== textRowDetails.textContent) {
              console.log('update')
              instance.valueOps?.updateValueByPath(
                {
                  textContent: e.currentTarget.value
                },
                path
              )
            }
          }}
        />
      </div>
    )
  }
}

export default TextRow
