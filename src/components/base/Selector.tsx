import { Content, Icon, IconWithPopover, VirtualList, WithBorder, Virtualizer } from '@/components'
import { ClassName } from 'rendevoz'
import { CSSProperties, ForwardedRef, forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import isHotkey from 'is-hotkey'
import { Colors, Icons, KEY } from '@/consts'
import fuzzysort from 'fuzzysort'
import BlockColorPicker from '@/core/components/editor/components/BlockColorPicker'
import { useTranslation } from 'react-i18next'
import _ from 'lodash'
import { DEFAULT_BACKGROUND_COLORS } from '@/components/picker/colorPicker'
import classnames from 'classnames'

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
    onItemUpdate,
    inputClassName = 'border-bottom'
  }: {
    style?: CSSProperties
    selectMode?: boolean
    items: T[]
    inputClassName?: string
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
  const inputRef = useRef<HTMLInputElement>(null)
  const [displayItems, setDisplayItems] = useState<T[]>([])
  const searchBgRef = useRef<string>()
  useLayoutEffect(() => {
    if (search) {
      const results = fuzzysort.go(search, items, { key: 'name' })
      const searchBg = searchBgRef.current || _.sample(DEFAULT_BACKGROUND_COLORS)
      const res = Array.from(results.values()).map(i => i.obj)
      if (!selectMode) {
        res.push({
          name: search,
          color: searchBg,
          id: 0
        } as T)
      }
      setDisplayItems(res)
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
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [])
  const virtualizer = useRef<Virtualizer<any, any>>()
  const { t } = useTranslation()
  const handleSelect = (item: T, idx: number) => {
    if (item.id === 0 && !selectMode) {
      onCreateItem?.(item.name, item.color)
      setSearch('')
      return
    }
    if (selectedItems?.some(i => i.id === item.id)) {
      onSelect?.(selectedItems)
      setSearch('')
      return
    }
    if (mode === 'single') {
      onSelect?.([item])
      setSearch('')
    } else {
      onSelect?.([...(selectedItems || []), item])
      setSearch('')
    }
  }

  return (
    <Content flex column style={style} ref={ref}>
      <div
        className={classnames('flex gap-2 flex-wrap', inputClassName)}
        style={{
          padding: '8px 9px 4px'
        }}
      >
        {selectedItems?.map(i => (
          <Content
            style={{
              padding: '0px 0px 0px 6px',
              lineHeight: '20px',
              color: Colors.getAdaptFontColor(i.color),
              background: Colors.getAdaptColor(i.color) || Colors.Background.ButtonHover
            }}
            flex
            className={'rounded'}
            key={i.id}
          >
            <div className={'line-clamp-1 font-size-13'}>{i.name}</div>
            <Icon
              className={'opacity-50 w-6 flex justify-center hover:opacity-30 transition-opacity'}
              cursor={'pointer'}
              strokeWidth={6}
              size={9}
              name={'park-close'}
              onClick={() => onSelect?.(selectedItems.filter(o => o.id !== i.id))}
            />
          </Content>
        ))}
        <input
          ref={inputRef}
          placeholder={!selectedItems?.length ? t('general.Type to search') + '...' : undefined}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={'font-size-13'}
          onKeyDown={e => {
            if (isHotkey(KEY.Backspace, e)) {
              if (!search) {
                if (selectedItems?.length) {
                  const s = selectedItems?.slice() || []
                  s.pop()
                  onSelect?.(s)
                }
              }
            }
          }}
          style={{ flex: '1 1 60px', overflow: 'hidden', lineHeight: '20px' }}
        />
      </div>
      <div style={{ padding: '4px 8px 2px' }} className={'font-size-12 transparent-font normal-font'}>
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
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <Content
      flex
      alignItems={'center'}
      className={ClassName.flatButton(4, '2px 4px')}
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
          width: 'fit-content'
        }}
        className={'ellipsis-font-1 rounded font-size-13'}
      >
        {item.name}
      </div>
      {item.id !== 0 && !selectMode && (
        <IconWithPopover
          withClickCover
          onVisiblityChange={v => {
            if (v) {
              setTimeout(() => inputRef.current?.focus(), 100)
            }
          }}
          zIndex={99999}
          content={setV => (
            <WithBorder onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} padding={10}>
              <Content className={'items-center gap-2 flex'} style={{ marginBottom: 10 }}>
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
                  className={'font-size-13 border-box-shadow focus-input bg-input'}
                  style={{
                    flex: 1,
                    borderRadius: 4,
                    padding: '2px 6px'
                  }}
                />

                <Icon
                  name={'park-delete-one'}
                  onClick={() => {
                    setV(false)
                    onDelete?.()
                  }}
                  className={'square-button-small'}
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
          size={18}
          onClick={e => e.stopPropagation()}
          name={Icons.More}
          containerStyle={{
            marginLeft: 'auto'
          }}
          className={'hover-active-button'}
        ></IconWithPopover>
      )}
    </Content>
  )
}
export default forwardRef(Selector)
