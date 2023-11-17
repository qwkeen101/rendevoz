import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { Content, Icon } from '@/components'
import { Reorder, useDragControls } from 'framer-motion'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useEffect, useState } from 'react'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'
import produce from 'immer'
export default () => {
  const allProperties = useSelectAtomValue(GroupStateAtom, s => s.currentView?.options?.properties) || []
  const visibleProperties = useSelectAtomValue(GroupStateAtom, s => s.visibleHeaders)
  const hidden = allProperties.filter(i => !i.visible)

  const [innerAll, setInnerAll] = useState([...visibleProperties, 'hidden', ...hidden])
  const instance = useGroupInstance()
  const values = innerAll
  useEffect(() => {
    setInnerAll([...allProperties.filter(i => i.visible), 'hidden', ...allProperties.filter(i => !i.visible)])
  }, [allProperties])
  return (
    <Content flex column fullWidth>
      <Reorder.Group
        as={'div'}
        onReorder={v => {
          setInnerAll(v)
        }}
        values={values}
      >
        {values.map(i => (
          <Item
            onStop={() => {
              const index = values.findIndex(i => i === 'hidden')
              const visible = values.slice(0, index)
              const hidden = values.slice(index + 1, values.length)
              instance.updateCurrentView?.(s => ({
                ...s,
                options: {
                  ...s.options,
                  properties: [...visible.map(i => ({ ...i, visible: true })), ...hidden.map(i => ({ ...i, visible: false }))]
                }
              }))
            }}
            onVisibleChange={() => {
              const index = allProperties.findIndex(o => o.name === i.name)
              instance.updateCurrentView?.(s => ({
                ...s,
                options: {
                  ...s.options,
                  properties: produce(allProperties, s => {
                    if (index >= 0) {
                      s[index].visible = !s[index].visible
                    }
                  })
                }
              }))
            }}
            value={i}
            key={typeof i === 'string' ? i : i.name}
          ></Item>
        ))}
      </Reorder.Group>
    </Content>
  )
}

function Item({ value, onStop, onVisibleChange }) {
  const controls = useDragControls()
  const { t } = useTranslation()
  return (
    <Reorder.Item
      style={{
        display: 'flex',
        width: '100%',
        gap: 10
      }}
      as={'div'}
      onDragEnd={onStop}
      value={value}
      dragListener={false}
      dragControls={controls}
    >
      <Content
        onPointerDown={e => controls.start(e)}
        flex
        gap={10}
        fullWidth
        className={typeof value === 'object' ? ClassName.flatButton(4, '2px 6px') : undefined}
      >
        {typeof value === 'object' && <Icon name={'park-drag'} />}
        {typeof value === 'string' ? (
          <div
            style={{
              fontSize: 13,
              margin: '6px 0px',
              textTransform: 'capitalize',
              color: Colors.Font.Transparent,
              paddingLeft: 6
            }}
          >
            {value}
          </div>
        ) : (
          t(value.display)
        )}
        {typeof value === 'object' && (
          <Icon
            className={ClassName.flatButton(4, '4px')}
            name={!value.visible ? 'park-preview-close' : 'park-preview-open'}
            containerStyle={{ marginLeft: 'auto' }}
            onClick={e => {
              e.stopPropagation()
              onVisibleChange()
            }}
          />
        )}
      </Content>
    </Reorder.Item>
  )
}
