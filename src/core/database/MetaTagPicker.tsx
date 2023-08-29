import { globalStore, MetaStore, ObjectStore } from '@/stores'
import { Content, Icon, IconWithPopover, VirtualList, WithBorder } from '@/components'
import Tag from '@/core/database/ObjectTag'
import { ClassName } from 'rendevoz'
import { CSSProperties, forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import isHotkey from 'is-hotkey'
import { Colors, KEY } from '@/consts'
import { useGlobalAtomValue } from '@/hooks'
import fuzzysort from 'fuzzysort'
import BlockColorPicker from '@/core/editor/components/BlockColorPicker'
import FontSize from '@/consts/font'
import { Virtualizer } from '@tanstack/react-virtual'

const MetaTagPicker = forwardRef(
  (
    {
      metaId,
      style,
      selectMode,
      alreadyTags,
      onChange
    }: { metaId?: number; style?: CSSProperties; selectMode?: boolean; alreadyTags?: number[]; onChange?: (tags: number[]) => void },
    ref
  ) => {
    const metaObject = MetaStore.useValue(metaId)
    const index = MetaStore.useIndexedMetaObjects()?.tagToMetaObjectIdsMap
    const allTags = useGlobalAtomValue(ObjectStore('tag').objectMapAtom)
    const [search, setSearch] = useState('')
    const result = useMemo(() => {
      if (metaId) {
        if (!metaObject) return
      }
      const metaTags = selectMode ? alreadyTags || [] : metaObject?.tags || []
      const tagsIds = new Set([...metaTags])
      const leftTags = Array.from(allTags.values())
        .filter(i => !tagsIds.has(i.id))
        .map(i => i.id)
      return {
        metaTags,
        leftTags
      }
    }, [metaObject?.tags, allTags, alreadyTags])

    const sortedTags = useMemo(() => {
      if (!result?.leftTags) return
      const { leftTags } = result
      const map = globalStore.get(ObjectStore('tag').objectMapAtom)
      const copyed = leftTags.map(i => map.get(i)!)
      if (selectMode) {
        copyed.sort((b, a) => {
          const bnum = index?.get(b.id)?.size || 0
          const anum = index?.get(a.id)?.size || 0
          return anum - bnum
        })
      } else {
        copyed.sort((b, a) => a.createdAt - b.createdAt)
      }

      return copyed.map(i => i.id)
    }, [allTags, result?.leftTags])
    const [displayTags, setDisplayTags] = useState<number[]>()
    useEffect(() => {
      if (!search || !sortedTags) {
        setDisplayTags(undefined)
      } else {
        const map = globalStore.get(ObjectStore('tag').objectMapAtom)
        const tags = sortedTags.map(i => map.get(i))
        const result = fuzzysort.go(search, Array.from(tags.values()), { key: 'name' })
        const trimed = search.trim()
        const alreadyHasName = Array.from(allTags.values()).some(i => i.name === trimed) || selectMode
        const arr = [...Array.from(result.values()).map(i => i.obj.id)]
        if (!alreadyHasName) {
          arr.push(search)
        }
        setDisplayTags(arr)
        setTimeout(() => {
          virtualizer.current?.setFocus(0)
        })
      }
    }, [search, sortedTags])

    const handleSelected = useCallback(
      (tag: number | string) => {
        if (typeof tag === 'number') {
          if (selectMode && alreadyTags) {
            onChange?.([...alreadyTags, tag])
          }
          MetaStore.updateMetaObject({ id: metaId, tags: [...(metaTags || []), tag] }, true)
        } else {
          setSearch('')
          ObjectStore('tag')
            .addOne({ name: tag })
            .then(one => {
              if (selectMode && alreadyTags) {
                onChange?.([...alreadyTags, one.id])
              }
              MetaStore.updateMetaObject({ id: metaId, tags: [...(metaTags || []), one.id] }, true)
            })
        }
      },
      [metaId, result?.metaTags, alreadyTags]
    )
    const virtualizer = useRef<Virtualizer<any, any>>()
    if (!result) return null
    const { metaTags } = result
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
          {metaTags.map(i => (
            <Tag
              onDelete={() => {
                if (selectMode) {
                  onChange?.(alreadyTags?.filter(o => o !== i) || [])
                } else {
                  MetaStore.updateMetaObject({ id: metaId, tags: [...metaTags.filter(o => o !== i)] }, true)
                }
              }}
              square
              hideSize
              tag={i}
              key={i}
            />
          ))}
          <input
            placeholder={!metaTags.length ? 'Search for one tag' : undefined}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={ClassName.noStyleInput}
            autoFocus
            style={{ flex: '1 1 100px', overflow: 'hidden', fontSize: '0.95rem', lineHeight: '20px' }}
          />
        </Content>
        <div style={{ padding: '4px 12px 2px', color: Colors.Font.Secondary, fontSize: 12, fontWeight: 600 }}>
          {selectMode ? 'Select tags' : 'Select tags or create one'}
        </div>
        <VirtualList
          estimateSize={26}
          withKeyboardNavigation={true}
          items={displayTags || sortedTags}
          ref={virtualizer}
          onEnter={handleSelected}
          style={{ width: '100%', minHeight: 100, padding: '0px 6px 8px 6px', maxHeight: 260 }}
          renderItem={(item, idx, selected) => (
            <TagRenderer showSize={selectMode} tag={item} selected={selected} onChoose={handleSelected} />
          )}
        ></VirtualList>
      </Content>
    )
  }
)

const TagRenderer = memo(
  ({
    tag,
    selected,
    onChoose,
    showSize = false
  }: {
    tag: number | string
    selected: boolean
    onChoose: (tag: number) => void
    showSize?: boolean
  }) => {
    const defaultName = ObjectStore('tag').useValue(tag)?.name
    const [newName, setNewName] = useState(defaultName)
    const inputRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
      setNewName(defaultName)
    }, [defaultName])
    if (typeof tag === 'string') {
      return (
        <Content
          flex
          gap={9}
          alignItems={'center'}
          justifyContent={'flex-start'}
          onClick={() => onChoose(tag)}
          className={ClassName.flatButton(4, '3px 6px')}
          style={{
            lineHeight: '20px',
            fontSize: FontSize['12px'],
            transition: 'none',
            background: selected ? Colors.Background.ButtonActive : 'transparent'
          }}
        >
          Create{' '}
          <span
            style={{
              borderRadius: 4,
              padding: '0px 6px',
              background: Colors.Background.Border
            }}
          >
            {tag}
          </span>
        </Content>
      )
    }
    return (
      <Content
        flex
        alignItems={'center'}
        justifyContent={'space-between'}
        onClick={() => onChoose(tag)}
        className={ClassName.flatButton(4, '3px 6px')}
        style={{
          background: selected ? Colors.Background.ButtonActive : 'transparent'
        }}
      >
        <Tag hideAdd={true} hideSize={!showSize} square hideDelete tag={tag} />
        {selected && !showSize && (
          <IconWithPopover
            name="park-more"
            placement={['bottom', 'right', 'left']}
            onClick={e => {
              e.stopPropagation()
              setTimeout(() => inputRef.current?.focus(), 100)
            }}
            onClickOutside={() => {
              ObjectStore('tag').updateOne({ id: tag, name: newName })
            }}
            className={ClassName.circleButton(0, 4)}
            renderOnParent={false}
            withClickCover={true}
            content={
              <WithBorder
                style={{ background: Colors.Background.Secondary }}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
                padding={10}
              >
                <Content flex gap={10} style={{ marginBottom: 10 }}>
                  <input
                    placeholder={'New name for this tag'}
                    autoFocus
                    value={newName}
                    onKeyDown={e => {
                      if (isHotkey(KEY.Enter, e)) {
                        document.body.firstElementChild?.click?.()
                      }
                    }}
                    onChange={v => setNewName(v.target.value)}
                    className={ClassName.noStyleInput}
                    ref={inputRef}
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
                      ObjectStore('tag').deleteOneById(tag, { force: true })
                      document.body.firstElementChild?.click?.()
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
                    ObjectStore('tag').updateOne({ id: tag, color: c })
                  }}
                />
              </WithBorder>
            }
          ></IconWithPopover>
        )}
      </Content>
    )
  }
)

export default MetaTagPicker
