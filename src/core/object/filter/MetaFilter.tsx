import { Content, VirtualList, Button, Virtualizer } from '@/components'
import { CSSProperties, useEffect, useMemo, useRef, useState, memo } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import { MetaObject } from '~/typings'
import fuzzysort from 'fuzzysort'
import { useTranslation } from 'react-i18next'

interface MetaFilterProps {
  withInput?: boolean
  autoFocus?: boolean
  onChange?: (metaId?: number) => void
  currentInput?: string
  style?: CSSProperties
  mode?: 'recentlyCreate' | 'recentlyView' | 'type'
  onInputLink?: (l: string) => void
  enablePreview?: boolean
  showCreate?: {
    note?: boolean
    whiteboard?: boolean
    linkToWeb?: boolean
    linkToWebMeta?: boolean
  }
}

export const isValidUrl = urlString => {
  let urlPattern = new RegExp('^(?:https?://|s?ftps?://)?(?!www | www\\.)[A-Za-z0-9_-]+\\.+[A-Za-z0-9.\\/%&=\\?_:;-]+$') // validate fragment locator
  return !!urlPattern.test(urlString)
}
const MetaFilter = ({
  withInput = true,
  style,
  autoFocus,
  onChange,
  currentInput,
  showCreate,
  mode = 'type',
  onInputLink
}: MetaFilterProps) => {
  const [filterState, setFilterState] = useState<{
    currentSelectType?: string
    currentTypeItems?: any[]
    currentVisibleItems?: any[]
    currentInput?: string
  }>({})
  const { t } = useTranslation()
  const virtualizerRef = useRef<Virtualizer<any, any>>()
  const visibleTypes = useMemo(() => {
    const index = MetaStore.getIndexedMetaObjects()
    document.activeElement?.blur?.()
    if (!index) return
    const types = MetaStore.getVisibleMetaTypes({
      showLabel: true,
      showHidden: true
    })
    const arr = types.map(i => ({
      type: i,
      count: Array.from(index.typeToMetaObjectIdsMap.get(i)?.values() || []).filter(i =>
        MetaStore.isVisibleMetaObject(i, {
          showLabel: true,
          showHidden: true
        })
      ).length
    }))
    arr.sort((b, a) => a.count - b.count)
    return arr
  }, [])
  useEffect(() => {
    setFilterState(s => ({ ...s, currentInput }))
  }, [currentInput])
  useEffect(() => {
    if (filterState.currentSelectType) {
      const allObjects = Array.from(MetaStore.getMetaObjectsMap().values()).filter(
        i => MetaStore.isVisibleMetaObject(i, { showHidden: true, showLabel: true }) && i.type === filterState.currentSelectType
      )
      allObjects.sort((b, a) => a.createdAt - b.createdAt)
      setFilterState(s => ({ ...s, currentTypeItems: allObjects }))
    }
  }, [filterState.currentSelectType])
  useEffect(() => {
    if (filterState.currentInput?.length) {
      const map = MetaStore.getMetaObjectsMap()
      const searched = fuzzysort.go(filterState.currentInput, filterState.currentTypeItems || Array.from(map.values()), {
        keys: ['name', 'placeholderName']
      })
      const addedCreate = []
      if (showCreate?.note && (filterState.currentSelectType === undefined || filterState.currentSelectType === 'note')) {
        addedCreate.push({
          type: 'createNote',
          name: filterState.currentInput
        })
      }
      if (showCreate?.whiteboard && (filterState.currentSelectType === undefined || filterState.currentSelectType === 'whiteboard')) {
        addedCreate.push({
          type: 'createWhiteboard',
          name: filterState.currentInput
        })
      }
      const visible = [...Array.from(searched.values()).map(i => i.obj), ...addedCreate]
      if (showCreate?.linkToWeb) {
        // add to first
        visible.unshift({
          type: 'createLinkWeb',
          name: filterState.currentInput
        })
      }
      setFilterState(s => ({ ...s, currentVisibleItems: visible }))
    } else {
      if (mode === 'recentlyCreate') {
        setFilterState(s => ({ ...s, currentVisibleItems: MetaStore.getAll({ sort: 'createdAtDsc' }) }))
        return
      }
      if (mode === 'recentlyView') {
        setFilterState(s => ({ ...s, currentVisibleItems: MetaStore.getAll({ sort: 'viewAtDsc' }) }))
        return
      }
      setFilterState(s => ({ ...s, currentVisibleItems: s.currentTypeItems }))
    }
  }, [filterState.currentInput, filterState.currentTypeItems, mode])
  useEffect(() => {
    if (filterState.currentVisibleItems) {
      virtualizerRef.current?.setFocus?.(0)
    }
  }, [filterState.currentVisibleItems])
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
    if (item.type === 'createLinkWeb') {
      onInputLink?.(item.name)
      return
    }
    if (item.id) {
      onChange?.(item.id)
      return
    }
  }

  return (
    <Content flex>
      <div className={'w-[26rem] h-64 flex flex-col'} style={style}>
        {withInput && mode === 'type' && filterState.currentTypeItems && (
          <div className={'border-bottom w-full p-2'}>
            <input
              placeholder={t('general.Type to search')}
              defaultValue={filterState.currentInput}
              onCompositionEnd={e => {
                iscompo.current = false
                setFilterState(s => ({
                  ...s,
                  currentInput: e.target.value
                }))
              }}
              onCompositionStart={() => (iscompo.current = true)}
              onChange={v => {
                if (!iscompo.current) {
                  setFilterState(s => ({
                    ...s,
                    currentInput: v.target.value
                  }))
                }
              }}
              autoFocus={true}
              className={'border-box-shadow px-2 w-full py-1 rounded font-size-13 focus-input'}
            />
          </div>
        )}
        {filterState.currentVisibleItems || filterState.currentTypeItems ? (
          <VirtualList
            ref={virtualizerRef}
            estimateSize={30}
            withKeyboardNavigation={true}
            onSelect={item => {
              handleSelectItem(item)
            }}
            items={filterState.currentVisibleItems || filterState.currentTypeItems || []}
            renderItem={(item, idx, selected) => <ButtonItem item={item} selected={!!selected} />}
            className={'w-full h-full py-1'}
          />
        ) : visibleTypes?.length ? (
          <VirtualList
            withKeyboardNavigation={true}
            estimateSize={30}
            items={visibleTypes}
            onSelect={item => {
              setFilterState({ currentSelectType: item.type })
            }}
            renderItem={(item, idx, selected) => (
              <Button.IconButton
                className={'mx-1'}
                onClick={() => setFilterState({ currentSelectType: item.type })}
                icon={Global.utils.getIcon(item.type)}
                text={Global.utils.getTypeName(item.type)}
                selected={selected || undefined}
                suffixStr={item.count}
              />
            )}
            className={'w-full h-full py-1'}
          />
        ) : null}
      </div>
    </Content>
  )
}

const ButtonItem = ({
  onClick,
  item,
  selected,
  onPointerEnter
}: {
  item: MetaObject
  selected: boolean
  onClick: VoidFunction
  onPointerEnter?: VoidFunction
}) => {
  let text = item.name || item.placeholderName
  let icon = Global.utils.getIcon(item.type)
  if (item.type === 'createNote') {
    text = `Create note "${text}"`
    icon = Global.utils.getIcon('note')
  }
  if (item.type === 'createWhiteboard') {
    text = `Create whiteboard "${text}"`
    icon = Global.utils.getIcon('whiteboard')
  }
  if (item.type === 'createLinkWeb') {
    icon = 'park-earth'
    text = `Link to: ${text}`
  }
  return (
    <Button.IconButton
      onPointerEnter={onPointerEnter}
      className={'mx-1'}
      textClassName={'break-all'}
      onClick={onClick}
      icon={icon}
      text={text}
      selected={selected || undefined}
    />
  )
}
export default memo(MetaFilter)
