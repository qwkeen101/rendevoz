import { Content, VirtualList, Button } from '@/components'
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Rendevoz } from '@/core/rendevoz'
import { ClassName } from 'rendevoz'
import { MetaObject } from '~/typings'
import fuzzysort from 'fuzzysort'
import { Virtualizer } from '@tanstack/react-virtual'
import { Colors, KEY } from '@/consts'
import isHotkey from 'is-hotkey'

interface MetaFiltererProps {
  withInput?: boolean
  autoFocus?: boolean
  onChange?: (metaId?: number) => void
  currentInput?: string
  style?: CSSProperties
  showCreate?: {
    note?: boolean
    whiteboard?: boolean
  }
}

const MetaFilterer = ({ withInput = true, style, autoFocus, onChange, currentInput, showCreate }: MetaFiltererProps) => {
  const [filtererState, setFiltererState] = useState<{
    currentSelectType?: string
    currentTypeItems?: any[]
    currentVisibleItems?: any[]
    currentInput?: string
  }>({})
  const virtualizerRef = useRef<Virtualizer<any, any>>()
  const visibleTypes = useMemo(() => {
    const index = MetaStore.getIndexedMetaObjects()
    document.activeElement?.blur?.()
    if (!index) return
    const arr = Array.from(index.typeToMetaObjectIdsMap.entries()).map(i => ({
      type: i[0],
      count: i[1].size
    }))
    arr.sort((b, a) => a.count - b.count)
    return arr
  }, [])
  useEffect(() => {
    setFiltererState(s => ({ ...s, currentInput }))
  }, [currentInput])
  useEffect(() => {
    if (filtererState.currentSelectType) {
      const allObjects = Array.from(MetaStore.getMetaObjectsMap().values()).filter(i => i.type === filtererState.currentSelectType)
      console.log(allObjects, filtererState.currentSelectType)
      allObjects.sort((b, a) => a.createdAt - b.createdAt)
      setFiltererState(s => ({ ...s, currentTypeItems: allObjects }))
    }
  }, [filtererState.currentSelectType])

  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (!currentInput) {
        if (isHotkey(KEY.Backspace, e)) {
          setFiltererState(s => ({ ...s, currentSelectType: undefined, currentVisibleItems: undefined, currentTypeItems: undefined }))
        }
      }
    }
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  })
  useEffect(() => {
    if (filtererState.currentInput?.length) {
      const map = MetaStore.getMetaObjectsMap()
      const searched = fuzzysort.go(filtererState.currentInput, filtererState.currentTypeItems || Array.from(map.values()), { key: 'name' })
      const addedCreate = []
      if (showCreate?.note && (filtererState.currentSelectType === undefined || filtererState.currentSelectType === 'note')) {
        addedCreate.push({
          type: 'createNote',
          name: filtererState.currentInput
        })
      }
      if (showCreate?.whiteboard && (filtererState.currentSelectType === undefined || filtererState.currentSelectType === 'whiteboard')) {
        addedCreate.push({
          type: 'createWhiteboard',
          name: filtererState.currentInput
        })
      }
      const visible = [...Array.from(searched.values()).map(i => i.obj), ...addedCreate]
      setFiltererState(s => ({ ...s, currentVisibleItems: visible }))
      if (visible.length) {
        virtualizerRef.current?.setFocus?.(0)
      }
    } else {
      setFiltererState(s => ({ ...s, currentVisibleItems: s.currentTypeItems }))
    }
  }, [filtererState.currentInput, filtererState.currentTypeItems])
  const iscompo = useRef(false)

  const handleSelectItem = async item => {
    if (item === undefined) {
      onChange?.(undefined)
      return
    }
    if (item.type === 'createNote') {
      const noteMeta = await ObjectStore('note').addOneWithMeta({ title: item.name }, { currentMeta: { name: item.name } })
      onChange?.(noteMeta.meta.id)
      return
    }
    if (item.type === 'createWhiteboard') {
      const whiteboardMeta = await ObjectStore('whiteboard').addOneWithMeta({}, { currentMeta: { name: item.name } })
      onChange?.(whiteboardMeta.meta.id)
      return
    }
    if (item.id) {
      onChange?.(item.id)
      return
    }
  }

  return (
    <Content style={{ width: 300, height: 200, display: 'flex', flexDirection: 'column', ...style }}>
      {withInput && filtererState.currentTypeItems && (
        <input
          style={{
            width: '100%',
            fontSize: 12,
            padding: '2px 6px',
            borderBottom: `1px solid ${Colors.Background.Border}`,
            marginBottom: 3
          }}
          placeholder="Search one object"
          defaultValue={filtererState.currentInput}
          onCompositionEnd={e => {
            iscompo.current = false
            setFiltererState(s => ({ ...s, currentInput: e.target.value }))
          }}
          onCompositionStart={() => (iscompo.current = true)}
          onChange={v => {
            if (!iscompo.current) {
              setFiltererState(s => ({ ...s, currentInput: v.target.value }))
            }
          }}
          autoFocus={true}
          className={ClassName.noStyleInput}
        />
      )}
      {filtererState.currentVisibleItems || filtererState.currentTypeItems ? (
        <VirtualList
          ref={virtualizerRef}
          estimateSize={30}
          withKeyboardNavigation={true}
          onEnter={item => {
            handleSelectItem(item)
          }}
          items={filtererState.currentVisibleItems || filtererState.currentTypeItems || []}
          renderItem={(item, idx, selected) => <ButtonItem onClick={() => handleSelectItem(item)} item={item} selected={!!selected} />}
          style={{ width: '100%', height: '100%' }}
        />
      ) : visibleTypes?.length ? (
        <VirtualList
          withKeyboardNavigation={true}
          estimateSize={30}
          items={visibleTypes}
          onEnter={item => {
            setFiltererState({ currentSelectType: item.type })
          }}
          renderItem={(item, idx, selected) => (
            <Button.IconButton
              style={{
                lineHeight: 1.3,
                fontSize: '13px'
              }}
              onClick={() => setFiltererState({ currentSelectType: item.type })}
              icon={Rendevoz.Utils.Object.getMetaObjectIcon(item.type)}
              text={Rendevoz.Utils.Meta.getTypeName(item.type)}
              selected={selected || undefined}
              suffixStr={item.count}
            />
          )}
          style={{ width: '100%', height: '100%' }}
        />
      ) : null}
    </Content>
  )
}

const ButtonItem = ({ onClick, item, selected }: { item: MetaObject; selected: boolean; onClick: VoidFunction }) => {
  let text = item.name || item.placeholderName
  let icon = Rendevoz.Utils.Object.getMetaObjectIcon(item.type)
  if (item.type === 'createNote') {
    text = `Create note "${text}"`
    icon = Rendevoz.Utils.Object.getMetaObjectIcon('note')
  }
  if (item.type === 'createWhiteboard') {
    text = `Create whiteboard "${text}"`
    icon = Rendevoz.Utils.Object.getMetaObjectIcon('whiteboard')
  }
  return (
    <Button.IconButton
      style={{
        lineHeight: 1.3,
        fontSize: '13px'
      }}
      onClick={onClick}
      icon={icon}
      text={text}
      selected={selected || undefined}
    />
  )
}
export default MetaFilterer
