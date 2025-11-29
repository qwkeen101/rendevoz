import { AnimatePopover, AutosizeTextarea, Icon, WithBorder } from '@/components'
import { MetaStore } from '@/api/stores'
import { Icons, KEY } from '@/consts'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import { memo, useEffect, useState } from 'react'
import classnames from 'classnames'
import isHotkey from 'is-hotkey'
import MetaTagPicker from '@/core/object/MetaTagPicker'
import Tag from '@/core/object/ObjectTag'

const width = 280
export default memo(({ metaId, onAdd }: { metaId?: number; onAdd: VoidFunction }) => {
  const m = MetaStore.useValue(metaId)
  const metaVisible = m && !m.deleted && !m.temp
  const { t } = useTranslation()
  const [state, setState] = useState<{
    name: string
    tags: number[]
  }>({
    name: m?.name ?? '',
    tags: m?.tags || []
  })
  const [tagVisible, setTagVisible] = useState(false)
  const [toolbarVisible, setVisible] = useState(false)
  useEffect(() => {
    if (toolbarVisible) {
      setState({
        name: m?.name ?? '',
        tags: m?.tags ?? []
      })
    }
  }, [m, toolbarVisible])
  return (
    <AnimatePopover
      withClickCover
      positions={['bottom']}
      onClickOutside={() => setVisible(false)}
      visible={metaVisible && toolbarVisible}
      padding={6}
      content={() => (
        <WithBorder
          onClick={() => {
            if (tagVisible) {
              setTagVisible(false)
            }
          }}
          className={'p-3'}
        >
          <div className={'font-medium mb-3'}>{t(trans.Meta.AddAsObject)}</div>
          <div className={'menu-sub-title mb-2'}>{t(trans.Name)}</div>
          <AutosizeTextarea
            style={{
              width
            }}
            onChange={v => setState(s => ({ ...s, name: v }))}
            value={state.name || ''}
            autoFocus
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                e.preventDefault()
              }
            }}
            autoFocusDelay={100}
            className={'focus-input w-full font-size-13 bg-input px-2 py-1.5 border-box-shadow rounded-md'}
          />
          <div className={'menu-sub-title mt-3 mb-2'}>{t(trans.Tags)}</div>
          <AnimatePopover
            withClickCover
            padding={6}
            visible={tagVisible}
            onClickOutside={() => setTagVisible(false)}
            content={setV => (
              <WithBorder onClick={e => e.stopPropagation()}>
                <MetaTagPicker
                  alreadyTags={state.tags}
                  onChange={v => {
                    setState(s => ({ ...s, tags: v }))
                  }}
                />
              </WithBorder>
            )}
            positions={['bottom']}
          >
            <div
              onClick={() => setTagVisible(true)}
              style={{
                width,
                '--placeholder': `"${t('general.Select tags')}"`
              }}
              className={
                'w-full hover-after-bg-hover flex gap-2 flex-wrap cursor-pointer empty-placeholder font-size-13 bg-input px-2 py-1.5 border-box-shadow rounded-md'
              }
            >
              {state.tags.map(i => (
                <Tag square small tag={i} key={i} />
              ))}
            </div>
          </AnimatePopover>
          <div className={'flex items-center justify-end font-size-13 gap-2 mt-6 font-medium'}>
            <Icon
              name={Icons.Info}
              size={18}
              onClick={() => {
                setVisible(false)
                Global.metaOps.openDetails?.(metaId)
              }}
              className={'has-bg-button cursor-pointer p-2 rounded-full'}
            ></Icon>
            <Icon
              name={Icons.MoveTo}
              size={18}
              onClick={() => {
                setVisible(false)
                if (metaId) {
                  Global.metaOps.quickAdd?.(metaId)
                }
              }}
              className={'has-bg-button cursor-pointer p-2 rounded-full'}
            ></Icon>
            <Icon
              name={Icons.Delete}
              size={18}
              onClick={() => {
                setVisible(false)
                if (metaId) {
                  MetaStore.deleteMetaObject(metaId)
                }
              }}
              className={'has-bg-button mr-auto cursor-pointer p-2 rounded-full'}
            ></Icon>
            <div
              onClick={() => {
                if (metaId) {
                  MetaStore.updateMetaObject({ id: metaId, name: state.name, tags: state.tags })
                }
                setVisible(false)
              }}
              className={'reverse-theme-button px-5 py-2 !rounded-3xl'}
            >
              {t('feed.Confirm')}
            </div>
          </div>
        </WithBorder>
      )}
    >
      <Icon
        onClick={() => {
          if (!metaVisible) {
            onAdd()
          }
          setVisible(true)
        }}
        size={20}
        theme={metaVisible ? 'filled' : undefined}
        className={classnames('hover-active-button', metaVisible && 'select-color-font')}
        name={metaVisible ? Icons.Info : Icons.AddAsObject}
      />
    </AnimatePopover>
  )
})
