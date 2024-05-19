import { Content, VirtualList, Button } from '@/components'
import { CSSProperties, useEffect, useMemo, useRef, useState, memo } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Rendevoz } from '@/core/rendevoz'
import { ClassName } from 'rendevoz'
import { MetaObject } from '~/typings'
import fuzzysort from 'fuzzysort'
import { Virtualizer } from '@tanstack/react-virtual'
import { Colors, KEY } from '@/consts'
import isHotkey from 'is-hotkey'
import ContentDisplayer from '@/core/components/group/components/gallery/items/FixedHeightContentDisplayer'
import { useTranslation } from 'react-i18next'

interface MetaFiltererProps {
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
const MetaFilterer = ({
  withInput = true,
  style,
  autoFocus,
  onChange,
  currentInput,
  showCreate,
  mode = 'type',
  onInputLink
}: MetaFiltererProps) => {
  const [filtererState, setFiltererState] = useState<{
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
    const arr = Array.from(index.typeToMetaObjectIdsMap.entries()).map(i => ({
      type: i[0],
      count: i[1].size
    }))
    arr.sort((b, a) => a.count - b.count)
    return arr
  }, [])
  const [previewMetaId, setPreviewMetaId] = useState<number>()
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
    if (filtererState.currentInput?.length) {
      const map = MetaStore.getMetaObjectsMap()
      const searched = fuzzysort.go(filtererState.currentInput, filtererState.currentTypeItems || Array.from(map.values()), {
        keys: ['name', 'placeholderName']
      })
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
      if (showCreate?.linkToWeb) {
        // add to first
        visible.unshift({
          type: 'createLinkWeb',
          name: filtererState.currentInput
        })
      }
      if (showCreate?.linkToWebMeta && isValidUrl(filtererState.currentInput)) {
        // add to first
        visible.unshift({
          type: 'createLinkWebMeta',
          name: filtererState.currentInput
        })
      }
      setFiltererState(s => ({ ...s, currentVisibleItems: visible }))
    } else {
      if (mode === 'recentlyCreate') {
        setFiltererState(s => ({ ...s, currentVisibleItems: MetaStore.getMetaObjects('create') }))
        return
      }
      if (mode === 'recentlyView') {
        setFiltererState(s => ({ ...s, currentVisibleItems: MetaStore.getMetaObjects('view') }))
        return
      }
      setFiltererState(s => ({ ...s, currentVisibleItems: s.currentTypeItems }))
    }
  }, [filtererState.currentInput, filtererState.currentTypeItems, mode])
  useEffect(() => {
    if (filtererState.currentVisibleItems) {
      virtualizerRef.current?.setFocus?.(0)
    }
  }, [filtererState.currentVisibleItems])
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
    if (item.type === 'createLinkWebMeta') {
      let url = item.name as string
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url
      }
      const webpageMeta = await ObjectStore('webpage').addOneWithMeta({ url })
      onChange?.(webpageMeta.meta.id)
      return
    }
    if (item.id) {
      onChange?.(item.id)
      return
    }
  }

  return (
    <Content flex>
      <Content
        style={{
          width: 440,
          height: 260,
          display: 'flex',
          flexDirection: 'column',
          ...style
        }}
      >
        {withInput && mode === 'type' && filtererState.currentTypeItems && (
          <div className={'border-bottom'} style={{ width: '100%', padding: 8 }}>
            <input
              style={{
                width: '100%',
                fontSize: 13,
                borderRadius: 4,
                padding: '3px 8px'
              }}
              placeholder={t('general.Type to search')}
              defaultValue={filtererState.currentInput}
              onCompositionEnd={e => {
                iscompo.current = false
                setFiltererState(s => ({
                  ...s,
                  currentInput: e.target.value
                }))
              }}
              onCompositionStart={() => (iscompo.current = true)}
              onChange={v => {
                if (!iscompo.current) {
                  setFiltererState(s => ({
                    ...s,
                    currentInput: v.target.value
                  }))
                }
              }}
              autoFocus={true}
              className={'border-box-shadow focus-input'}
            />
          </div>
        )}
        {filtererState.currentVisibleItems || filtererState.currentTypeItems ? (
          <VirtualList
            ref={virtualizerRef}
            estimateSize={30}
            withKeyboardNavigation={true}
            onSelect={item => {
              handleSelectItem(item)
            }}
            items={filtererState.currentVisibleItems || filtererState.currentTypeItems || []}
            renderItem={(item, idx, selected) => (
              <ButtonItem
                onPointerEnter={() => {
                  if ('createdAt' in item) {
                    setPreviewMetaId(item.id)
                  }
                }}
                item={item}
                selected={!!selected}
              />
            )}
            style={{ width: '100%', height: '100%', padding: '6px 0px' }}
          />
        ) : visibleTypes?.length ? (
          <VirtualList
            withKeyboardNavigation={true}
            estimateSize={30}
            items={visibleTypes}
            onSelect={item => {
              setFiltererState({ currentSelectType: item.type })
            }}
            renderItem={(item, idx, selected) => (
              <Button.IconButton
                style={{
                  fontSize: '14px',
                  margin: '0px 4px'
                }}
                onClick={() => setFiltererState({ currentSelectType: item.type })}
                icon={Rendevoz.Utils.Object.getMetaObjectIcon(item.type)}
                text={Rendevoz.Utils.Meta.getTypeName(item.type)}
                selected={selected || undefined}
                suffixStr={item.count}
              />
            )}
            style={{ width: '100%', height: '100%', padding: '6px 0px' }}
          />
        ) : null}
      </Content>
      {/*{previewMetaId && <ContentDisplayer metaId={previewMetaId} />}*/}
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
  let icon = Rendevoz.Utils.Object.getMetaObjectIcon(item.type)
  if (item.type === 'createNote') {
    text = `Create note "${text}"`
    icon = Rendevoz.Utils.Object.getMetaObjectIcon('note')
  }
  if (item.type === 'createWhiteboard') {
    text = `Create whiteboard "${text}"`
    icon = Rendevoz.Utils.Object.getMetaObjectIcon('whiteboard')
  }
  if (item.type === 'createLinkWeb') {
    icon = 'park-earth'
    if (!isValidUrl(item.name)) {
      text = `Type a complete link: ${text}`
      selected = false
    } else {
      text = `Link to: ${text}`
    }
  }
  if (item.type === 'createLinkWebMeta') {
    icon = 'park-link'
    text = `Create web page: ${text}`
  }
  return (
    <Button.IconButton
      onPointerEnter={onPointerEnter}
      style={{
        fontSize: '14px',
        padding: '3px 6px',
        margin: '0px 4px'
      }}
      onClick={onClick}
      icon={icon}
      text={text}
      selected={selected || undefined}
    />
  )
}
export default memo(MetaFilterer)
