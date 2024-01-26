import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Content, Icon } from '@/components'
import { Reorder } from 'framer-motion'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useSetAtom } from 'jotai'
import GrouperHeader from '@/core/components/group/components/grouper/headers'
import { css } from '@emotion/css'
import { useTranslation } from 'react-i18next'
export default () => {
  const instance = useGroupInstance()
  const setGroupState = useSetAtom(GroupStateAtom)
  const currentGroups = useSelectAtomValue(GroupStateAtom, s => s.groups)
  const currentGroupRule = useSelectAtomValue(GroupStateAtom, s => s.currentView?.group)
  const { visible, hidden } = useMemo(() => {
    return {
      visible: currentGroups?.filter(i => !i.hidden) ?? [],
      hidden: currentGroups?.filter(i => i.hidden) ?? []
    }
  }, [currentGroups])
  const [innerValues, setInnerValues] = useState(visible)
  const [isDragging, setIsDragging] = useState<number>()
  let reorderable = false
  const { t } = useTranslation()
  if (currentGroupRule && 'sort' in currentGroupRule && currentGroupRule.sort === 'manual') {
    reorderable = true
  }
  if (currentGroupRule?.fieldType && ['checkbox', 'metaType', 'singleSelect', 'multiSelect'].includes(currentGroupRule?.fieldType)) {
    reorderable = true
  }
  useLayoutEffect(() => {
    setInnerValues(visible)
  }, [visible])
  const reorderRef = useRef()
  return (
    <Content style={{ maxWidth: 360 }}>
      {visible.length ? (
        <>
          <div
            className={'transparent-font font-size-12 normal-font border-top'}
            style={{
              padding: '6px 8px 4px',
              marginTop: 4
            }}
          >
            {t('general.Visible groups')}
          </div>
          <Reorder.Group
            as={'div'}
            axis={'y'}
            style={{ marginBottom: 6 }}
            onReorder={r => {
              setInnerValues(r)
            }}
            ref={reorderRef}
            values={innerValues}
          >
            {innerValues.map(i => (
              <Reorder.Item
                onDragStart={() => setIsDragging(i.id)}
                onDragEnd={() => {
                  setIsDragging(undefined)
                  setGroupState(s => ({ ...s, groups: [...innerValues, ...hidden] }))
                }}
                dragConstraints={reorderRef}
                dragElastic={0}
                drag={reorderable ? 'y' : false}
                as={'div'}
                transition={{
                  duration: isDragging ? 0.15 : 0
                }}
                value={i}
                key={i.id}
              >
                <GrouperHeader
                  prevNode={reorderable ? <Icon className={'super-transparent-font'} size={16} name={'park-drag'} /> : undefined}
                  showToggle={false}
                  group={i}
                  showHide={true}
                  className={css({
                    '*': {
                      fontSize: '13px !important'
                    }
                  })}
                  style={{
                    padding: '2px 8px',
                    fontSize: 13,
                    gap: 6,
                    cursor: reorderable ? 'grab' : 'auto'
                  }}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </>
      ) : null}
      {hidden.length ? (
        <>
          <div
            className={'transparent-font font-size-12 normal-font border-top'}
            style={{
              padding: '6px 8px 4px',
              marginTop: 4
            }}
          >
            {t('general.Hidden groups')}
          </div>
          <div style={{ marginBottom: 6 }}>
            {hidden.map(i => (
              <GrouperHeader
                showToggle={false}
                group={i}
                showHide={true}
                className={css({
                  '*': {
                    fontSize: '13px !important'
                  }
                })}
                key={i.id}
                style={{
                  padding: '2px 8px',
                  fontSize: 14,
                  gap: 6
                }}
              />
            ))}
          </div>
        </>
      ) : null}
    </Content>
  )
}
