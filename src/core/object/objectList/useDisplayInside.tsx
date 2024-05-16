// display inside groups, whiteboards, tags, collections
import { CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ITag, MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import calculateContains, { ContainResults } from '@/core/object/objectList/calculateContains'
import { Content, Icon, IconWithPopover, Menu, WithBorder } from '@/components'
import { IMenuLayoutItem } from '@/components/base/menu'
import { useTranslation } from 'react-i18next'
import { ObjectActionMenu } from '@/core'
import { Rendevoz } from '@/core/rendevoz'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { GlobalInstance } from '@/hooks'
import fuzzysort from 'fuzzysort'

export default (opt: { defaultSelected?: number[]; onSelect: (selected: number[]) => void }) => {
  const [search, setSearch] = useState<string>()
  const [displays, setDisplays] = useState<ContainResults>({
    group: [],
    whiteboard: [],
    note: [],
    video: [],
    audio: [],
    pdf: [],
    webpage: []
  })
  const selectedMeta = opt.defaultSelected
  const [contains, setContains] = useState<MetaObject[]>()
  const [filteredDisplay, setFilteredDisplay] = useState<typeof displays>()
  const metas = MetaStore.useMetaObjectsMap()
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const displayable = {
      group: [],
      whiteboard: [],
      note: [],
      video: [],
      audio: [],
      pdf: [],
      webpage: []
    }
    const ms = Array.from(metas.values())
    Promise.all(
      ms.map(async i => {
        if (i.deleted) return
        if (displayable[i.type]) {
          const contains = await calculateContains(i, true)
          if (contains?.length) {
            displayable[i.type].push({ meta: i, contains: contains.length })
          }
        }
      })
    ).then(() => {
      setDisplays(displayable)
    })
  }, [metas])
  useLayoutEffect(() => {
    if (search) {
      const currDisplayMetaIds = new Set(Object.values(displays).flatMap(i => i.map(o => o.meta.id)))
      let ms = Array.from(currDisplayMetaIds.values())
        .map(i => MetaStore.getCachedMetaObject(i))
        .filter(o => o) as MetaObject[]
      ms = Array.from(
        fuzzysort
          .go(search, ms, {
            keys: ['name', 'placeholderName', 'description']
          })
          .values()
      ).map(i => i.obj)
      const leftIds = new Set(ms.map(i => i.id))
      setFilteredDisplay(Object.fromEntries(Object.entries(displays).map(i => [i[0], i[1].filter(o => leftIds.has(o.meta.id))])))
    } else {
      setFilteredDisplay(undefined)
    }
  }, [search])
  useLayoutEffect(() => {
    if (selectedMeta?.length) {
      const currWorkspaceMetas = selectedMeta.filter(i => MetaStore.getCachedMetaObject(i))
      if (!currWorkspaceMetas.length) {
        setContains(undefined)
        return
      }
      const containIds = new Set<number>()
      Promise.all(
        currWorkspaceMetas.map(async id => {
          const m = MetaStore.getCachedMetaObject(id)
          if (m && !m.deleted) {
            const res = await calculateContains(m, true)
            if (res?.length) {
              res.forEach(m => containIds.add(m.id))
            }
          }
        })
      ).then(() => {
        const res = Array.from(containIds.values())
          .map(i => MetaStore.getCachedMetaObject(i))
          .filter(i => i) as MetaObject[]
        if (res.length) {
          setContains(res)
        } else {
          setContains([])
        }
      })
    } else {
      setContains(undefined)
    }
  }, [selectedMeta, metas])
  const renderContainIndicator = (opts?: { style?: CSSProperties }) => {
    if (selectedMeta?.length) {
      const all = selectedMeta.filter(id => {
        const m = MetaStore.getCachedMetaObject(id)
        if (!m || m.deleted) return false
        return true
      })
      if (!all.length) return null
      return (
        <Content style={{ display: 'flex', gap: 4, fontSize: 12, marginTop: 2, ...opts?.style }}>
          {selectedMeta.map(id => {
            const m = MetaStore.getCachedMetaObject(id)
            if (!m || m.deleted) return null
            return (
              <Content
                key={m.id}
                alignItems={'center'}
                style={{
                  padding: '2px 8px',
                  border: '1px solid var(--select-color)',
                  background: Colors.Common.SelectColorTransparentLight,
                  borderRadius: 99,
                  width: 'fit-content',
                  color: Colors.Common.SelectColor,
                  cursor: 'pointer'
                }}
                flex
                onClick={() => {
                  GlobalInstance.layoutOps?.openObject(m.id)
                }}
                gap={6}
              >
                <Icon name={Rendevoz.Utils.Object.getMetaObjectIcon(m.type)} />
                <div className={'ellipsis-font-1'}>{m.name || m.placeholderName}</div>
                <Content style={{ marginLeft: 'auto' }}>
                  <Icon
                    onClick={e => {
                      e.stopPropagation()
                      opt.onSelect(opt.defaultSelected?.filter(i => i !== m.id) || [])
                    }}
                    name={'park-close'}
                    style={{
                      cursor: 'pointer'
                    }}
                  />
                </Content>
              </Content>
            )
          })}
        </Content>
      )
    }
  }
  const renderIcon = (opts?: { style?: CSSProperties; size?: number }) => (
    <IconWithPopover
      tooltip={t('general.View included objects')}
      name={'park-hamburger-button'}
      size={opts?.size || 14}
      style={opts?.style}
      onVisiblityChange={v => {
        if (v) {
          console.log(v)
          setTimeout(() => {
            console.log(inputRef.current)
            inputRef.current?.focus()
          }, 100)
        }
      }}
      className={ClassName.flatButton(4, '3px')}
      zIndex={999}
      content={setV => renderMenu(() => setV(false))}
      placement={['bottom']}
    />
  )
  const renderMenu = (onClose?: VoidFunction) => {
    const layout: IMenuLayoutItem[] = []
    const alreadyContains = new Set(contains?.map(i => i.id))
    Object.entries(filteredDisplay || displays).forEach(([k, v]) => {
      if (v.length) {
        layout.push({
          type: 'title',
          name: t(`general.${k}`),
          style: {
            margin: '0.6rem 0 0.3rem'
          }
        })
        v.sort((a, b) => b.contains - a.contains)
        v.forEach(m => {
          if ('meta' in m) {
            if (alreadyContains.has(m.meta.id)) return
            layout.push({
              type: 'item',
              contextMenu: setV => (
                <WithBorder>
                  <ObjectActionMenu onClose={() => setV(false)} metaObjectId={m.meta.id} />
                </WithBorder>
              ),
              key: String(m.meta.id),
              suffix: String(m.contains),
              onSelect: () => {
                if (!opt.defaultSelected?.includes(m.meta.id)) {
                  opt.onSelect([...(opt.defaultSelected || []), m.meta.id])
                }
                onClose?.()
              },
              text: m.meta.name || m.meta.placeholderName || 'Unnamed object'
            })
          }
        })
      }
    })
    return (
      <WithBorder
        padding={'0.4rem 0'}
        style={{
          width: layout.length || search ? 320 : 200,
          maxHeight: 360,
          overflowY: 'auto'
        }}
      >
        {layout.length || search ? (
          <>
            <input
              ref={inputRef}
              autoFocus
              defaultValue={search}
              onCompositionStart={e => {
                e.currentTarget.setAttribute('composing', 'true')
              }}
              onCompositionEnd={e => {
                e.currentTarget.removeAttribute('composing')
                setSearch(e.currentTarget.value)
              }}
              placeholder={t('general.Type to search')}
              onChange={e => {
                !e.target.hasAttribute('composing') && setSearch(e.target.value || '')
              }}
              className={'border-box-shadow focus-input'}
              style={{ borderRadius: 4, width: 'calc(100% - 16px)', padding: '4px 8px', margin: '0.4rem 8px' }}
            />
            {layout.length ? (
              <Menu.NavigationMenu layout={layout} />
            ) : (
              <div style={{ padding: '4px 10px' }} className={'normal-font transparent-font'}>
                No data
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '4px 16px' }} className={'normal-font transparent-font'}>
            No data
          </div>
        )}
      </WithBorder>
    )
  }
  return {
    renderContains: renderIcon,
    contains,
    renderMenu,
    renderContainIndicator
  }
}
