import { ObjectStore } from '@/api/stores'
import { Content, Icon, IconWithPopover, VirtualList, WithBorder } from '@/components'
import { ClassName } from 'rendevoz'
import { CSSProperties, ForwardedRef, forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import isHotkey from 'is-hotkey'
import { Colors, KEY } from '@/consts'
import fuzzysort from 'fuzzysort'
import BlockColorPicker from '@/core/components/editor/components/BlockColorPicker'
import FontSize from '@/consts/font'
import { Virtualizer } from '@tanstack/react-virtual'
import { useTranslation } from 'react-i18next'
import _ from 'lodash'
import { DEFAULT_BACKGROUND_COLORS } from '@/components/picker/colorPicker'

function Selector<T extends { name?: string; color?: string; id: number }>(
  {
    style,
    selectMode,
    items,
    onSelect,
    mode = 'single',
    onCreateItem,
    selectedItems,
    onItemDelete,
    onItemUpdate
  }: {
    style?: CSSProperties
    selectMode?: boolean
    items: T[]
    selectedItems?: T[]
    onCreateItem?: (name: string, color: string) => void
    onSelect?: (items: T[]) => void
    mode: 'single' | 'multi'
    onItemDelete?: (id: number) => void
    onItemUpdate?: (newItem: T) => void
  },
  ref: ForwardedRef<HTMLElement>
) {
  const [search, setSearch] = useState('')

  const [displayItems, setDisplayItems] = useState<T[]>([])
  const searchBgRef = useRef<string>()
  useLayoutEffect(() => {
    if (search) {
      const results = fuzzysort.go(search, items, { key: 'name' })
      const searchBg = searchBgRef.current || _.sample(DEFAULT_BACKGROUND_COLORS)
      setDisplayItems([
        ...Array.from(results.values()).map(i => i.obj),
        {
          name: search,
          color: searchBg,
          id: 0
        } as T
      ])
      searchBgRef.current = searchBg
    } else {
      searchBgRef.current = undefined
      setDisplayItems(items)
    }
  }, [search, items])

  useEffect(() => {
    setTimeout(() => {
      virtualizer.current?.setFocus(0)
    })
  }, [displayItems.length])

  const virtualizer = useRef<Virtualizer<any, any>>()
  const { t } = useTranslation()
  const handleSelect = (item: T, idx: number) => {
    if (item.id === 0) {
      onCreateItem?.(item.name, item.color)
      setSearch('')
      return
    }
    if (selectedItems?.some(i => i.id === item.id)) {
      onSelect?.(selectedItems)
      return
    }
    if (mode === 'single') {
      onSelect?.([item])
    } else {
      onSelect?.([...(selectedItems || []), item])
    }
  }

  return (
    <Content flex column style={style} ref={ref}>
      <Content
        flex
        gap={6}
        style={{
          flexWrap: 'wrap',
          padding: '8px 9px 4px',
          borderBottom: `1px solid ${Colors.Background.Border}`,
          maxHeight: 200,
          overflowY: 'auto'
        }}
      >
        {selectedItems?.map(i => (
          <Content
            style={{
              padding: '0px 6px',
              fontSize: 14,
              borderRadius: 3,
              lineHeight: '20px',
              color: Colors.getAdaptFontColor(i.color),
              background: Colors.getAdaptColor(i.color) || Colors.Background.ButtonHover
            }}
            flex
            gap={4}
            key={i.id}
          >
            <div className={ClassName.ellipsisFont(1)}>{i.name}</div>
            <Icon cursor={'pointer'} size={12} name={'park-close'} onClick={() => onSelect?.(selectedItems.filter(o => o.id !== i.id))} />
          </Content>
        ))}
        <input
          placeholder={!selectedItems?.length ? t('general.Type to search') + '...' : undefined}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={ClassName.noStyleInput}
          autoFocus
          onKeyDown={e => {
            if (isHotkey(KEY.Backspace, e)) {
              if (!search) {
                const s = selectedItems?.slice() || []
                s.pop()
                onSelect?.(s)
              }
            }
          }}
          style={{ flex: '1 1 60px', overflow: 'hidden', fontSize: '13px', lineHeight: '20px' }}
        />
      </Content>
      <div style={{ padding: '4px 8px 2px', color: Colors.Font.Secondary, fontSize: 12, fontWeight: 600 }}>
        {selectMode
          ? mode === 'single'
            ? t('general.Select an option')
            : t('general.Select options')
          : mode === 'single'
          ? t('general.Select an option or create one')
          : t('general.Select options or create one')}
      </div>
      <VirtualList
        estimateSize={26}
        withKeyboardNavigation={true}
        items={displayItems}
        ref={virtualizer}
        onSelect={handleSelect}
        canReorder={!search}
        reorder={true}
        onReorder={items => {
          items.forEach((i, idx) => {
            onItemUpdate?.({ ...i, order: idx })
          })
        }}
        style={{ width: '100%', minHeight: 100, padding: '0px 6px 6px 6px', maxHeight: 260 }}
        renderItem={(item: T, idx, selected) => (
          <Item
            item={item}
            selected={selected}
            canReorder={!search}
            selectMode={selectMode}
            onDelete={() => onItemDelete?.(item.id)}
            onItemUpdate={onItemUpdate}
          />
        )}
      ></VirtualList>
    </Content>
  )
}

function Item<T extends { name?: string; color?: string; id: number }>({
  item,
  selected,
  onItemUpdate,
  onDelete,
  selectMode,
  canReorder
}: {
  item: T
  canReorder: boolean
  selected: boolean
  onItemUpdate?: (i: T) => void
  onDelete?: VoidFunction
  selectMode?: boolean
}) {
  const [newName, setNewName] = useState(item.name)
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <Content
      flex
      alignItems={'center'}
      className={ClassName.flatButton(3, '2px 4px')}
      style={{
        height: 28,
        background: selected ? Colors.Background.ButtonHover : 'transparent'
      }}
      gap={10}
    >
      {item.id !== 0 && !selectMode && canReorder && (
        <Icon
          size={16}
          name={'park-drag'}
          cursor={'grab'}
          style={{
            color: Colors.Font.SuperTransparent
          }}
        />
      )}
      <div
        style={{
          lineHeight: '20px',
          color: Colors.getAdaptFontColor(item.color),
          background: Colors.getAdaptColor(item.color),
          padding: '0px 6px',
          fontSize: 14,
          borderRadius: 3,
          width: 'fit-content'
        }}
        className={ClassName.ellipsisFont(1)}
      >
        {item.name}
      </div>
      {item.id !== 0 && !selectMode && (
        <IconWithPopover
          content={setV => (
            <WithBorder onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} padding={10}>
              <Content flex gap={10} style={{ marginBottom: 10 }}>
                <input
                  ref={inputRef}
                  autoFocus
                  defaultValue={item.name}
                  onKeyDown={e => {
                    if (isHotkey(KEY.Enter, e)) {
                      e.currentTarget.blur()
                      e.preventDefault()
                    }
                  }}
                  onBlur={e => {
                    onItemUpdate?.({ ...item, name: e.target.value })
                  }}
                  className={ClassName.noStyleInput}
                  style={{
                    border: `1px solid ${Colors.Background.Border}`,
                    flex: 1,
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: FontSize['13px']
                  }}
                />

                <Icon
                  name={'park-delete'}
                  onClick={() => {
                    setV(false)
                    onDelete?.()
                  }}
                  className={ClassName.circleButton()}
                />
              </Content>
              <BlockColorPicker
                style={{
                  padding: 0,
                  boxShadow: 'none',
                  border: 'none'
                }}
                bgBackDefault={false}
                showFont={false}
                onPickBackgroundColor={c => {
                  onItemUpdate?.({ ...item, color: c })
                }}
              />
            </WithBorder>
          )}
          renderOnParent={false}
          size={22}
          onClick={e => e.stopPropagation()}
          name={'park-more'}
          style={{
            color: Colors.Font.SuperTransparent
          }}
          containerStyle={{
            marginLeft: 'auto'
          }}
          className={ClassName.flatButton(4, '1px')}
        ></IconWithPopover>
      )}
    </Content>
  )
}
export default forwardRef(Selector)
