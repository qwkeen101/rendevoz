import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { Button, Content, Icon } from '@/components'
import { Reorder, useDragControls } from 'framer-motion'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useEffect, useLayoutEffect, useState } from 'react'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'
import produce from 'immer'
import ButtonSwitch from '@/components/base/ButtonSwitch'
import { useSetAtom } from 'jotai'
import { MetaStore } from '@/api/stores'
export default () => {
  const instance = useGroupInstance()
  const allProperties = instance.viewOps?.useViewProperties()
  const onlyShowCustom = useSelectAtomValue(GroupStateAtom, s => s.data?.onlyShowCustomProperties)
  const availableProps = useSelectAtomValue(GroupStateAtom, s => s.availableNewProps)
  const [innerAll, setInnerAll] = useState([])
  const setGroupState = useSetAtom(GroupStateAtom)
  const values = innerAll
  const { t } = useTranslation()
  useLayoutEffect(() => {
    if (allProperties) {
      const custom = onlyShowCustom
        ? allProperties.filter(i => i.type === 'custom' || i.name === 'name' || i.name === 'type')
        : allProperties
      setInnerAll([...custom.filter(i => i.visible), 'hidden', ...custom.filter(i => !i.visible)])
    }
  }, [allProperties, onlyShowCustom])
  return (
    <Content
      flex
      column
      fullWidth
      style={{
        minWidth: 280
      }}
    >
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
              const currProps = instance.getCurrentView?.()?.options.properties
              if (currProps) {
                const newProps = produce(currProps, draft => {
                  visible.forEach((i, idx) => {
                    draft[i.id].order = idx
                    draft[i.id].visible = true
                  })
                  hidden.forEach((i, idx) => {
                    draft[i.id].order = idx + visible.length
                    draft[i.id].visible = false
                  })
                })
                instance.updateCurrentView?.(s => ({
                  ...s,
                  options: {
                    ...s.options,
                    properties: newProps
                  }
                }))
              }
            }}
            onVisibleChange={() => {
              instance.viewOps?.updateProperty(i.id, { visible: !i.visible })
            }}
            value={i}
            key={typeof i === 'string' ? i : i.name}
          ></Item>
        ))}
      </Reorder.Group>
      {availableProps?.length ? (
        <>
          <div
            style={{
              fontSize: 13,
              margin: '6px 6px 6px 0px',
              color: Colors.Font.Transparent,
              paddingLeft: 6
            }}
          >
            {t('group.Available new properties')}
          </div>
          {availableProps.map(i => {
            const details = MetaStore.getPropDetails(i.id)
            if (details) {
              return (
                <Button.IconButton
                  icon={details.icon}
                  text={details.name}
                  key={i.id}
                  suffixIcon={'park-plus'}
                  onClick={() => {
                    setGroupState(s => ({ ...s, availableNewProps: s.availableNewProps?.filter(o => o.id !== i.id) }))
                    instance.viewOps?.addNewProperty(details)
                  }}
                ></Button.IconButton>
              )
            }
          })}
        </>
      ) : null}
      <div
        style={{
          width: '100%',
          margin: '4px 0px',
          borderTop: Colors.Consts.Border
        }}
      ></div>
      <ButtonSwitch
        name={t('group.Only show custom properties')}
        value={!!onlyShowCustom}
        onChange={() => instance.updateGroupData?.(w => ({ ...w, onlyShowCustomProperties: !w.onlyShowCustomProperties }))}
      />
    </Content>
  )
}

function Item({ value, onStop, onVisibleChange }) {
  const controls = useDragControls()
  const { t } = useTranslation()
  const instance = useGroupInstance()
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
        gap={4}
        fullWidth
        className={typeof value === 'object' ? ClassName.flatButton(4, '2px 6px') : undefined}
      >
        {typeof value === 'object' && <Icon name={'park-drag'} />}
        {typeof value === 'string' ? (
          <div
            style={{
              fontSize: 13,
              margin: '6px 6px 6px 0px',
              textTransform: 'capitalize',
              color: Colors.Font.Transparent,
              paddingLeft: 6
            }}
          >
            {value}
          </div>
        ) : value.type === 'custom' ? (
          MetaStore.getPropDetails(value.id)?.name
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
        {typeof value === 'object' && value.type === 'custom' && (
          <Icon
            className={ClassName.flatButton(4, '4px')}
            name={'park-delete'}
            onClick={e => {
              e.stopPropagation()
              instance.viewOps?.deleteCustomProperty(value.id)
            }}
          />
        )}
      </Content>
    </Reorder.Item>
  )
}
