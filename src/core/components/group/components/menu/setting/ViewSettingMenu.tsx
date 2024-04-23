import useGroupState from '@/core/components/group/hooks/useGroupState'
import ButtonSwitch from '@/components/base/ButtonSwitch'
import ButtonSelect from '@/components/base/ButtonSelect'
import { useTranslation } from 'react-i18next'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { Content, Icon } from '@/components'
import { Colors } from '@/consts'

export default () => {
  const [groupState, setGroupState] = useGroupState()
  const { t } = useTranslation()
  const instance = useGroupInstance()
  const currentGroupView = groupState.currentView
  const thumbnailMode = currentGroupView?.options.thumbnailMode === true
  const showCardSetting = currentGroupView?.type === 'gallery' || currentGroupView?.type === 'kanban'
  return (
    <>
      <Content
        gap={12}
        style={{
          display: 'grid',
          gridTemplateColumns: '75px 75px 75px',
          padding: '8px 10px'
        }}
      >
        {[
          {
            type: 'gallery',
            name: t('general.Gallery'),
            icon: 'park-all-application',
            selected: currentGroupView?.type === 'gallery'
          },
          {
            name: t('general.Table'),
            icon: 'park-table-file',
            type: 'table',
            selected: currentGroupView?.type === 'table'
          },
          {
            name: t('general.List'),
            icon: 'custom-list',
            type: 'list',
            selected: currentGroupView?.type === 'list'
          },
          {
            name: t('general.Kanban'),
            icon: 'custom-kanban',
            type: 'kanban',
            selected: currentGroupView?.type === 'kanban'
          },
          {
            name: t('general.Calendar'),
            icon: 'park-calendar-three',
            type: 'calendar',
            selected: currentGroupView?.type === 'calendar'
          }
        ].map(i => (
          <Content
            onClick={() => {
              instance.updateCurrentView?.(w => ({ ...w, type: i.type }))
            }}
            column
            flex
            className={'transparent-font'}
            key={i.icon}
            style={{
              width: 75,
              borderRadius: 6,
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 6,
              fontSize: 14,
              textAlign: 'center',
              gap: 3,
              color: i.selected ? Colors.Common.SelectColor : undefined,
              boxShadow: i.selected ? '0 0 0 2px var(--select-color)' : '0 0 0 1px var(--border-background)'
            }}
          >
            <Icon size={20} name={i.icon} />
            <div>{i.name}</div>
          </Content>
        ))}
      </Content>
      <div style={{ padding: 4 }}>
        {showCardSetting && (
          <>
            <ButtonSwitch
              value={!!currentGroupView?.options.thumbnailMode}
              name={t('general.Thumbnail mode')}
              onChange={v => {
                instance.updateCurrentView?.(s => ({
                  ...s,
                  options: {
                    ...s.options,
                    thumbnailMode: v
                  }
                }))
              }}
            />
            <ButtonSwitch
              onChange={v => {
                instance.updateCurrentView?.(s => ({
                  ...s,
                  options: {
                    ...s.options,
                    fitImage: v
                  }
                }))
              }}
              name={t('general.Fit image')}
              value={!!currentGroupView?.options.fitImage}
            ></ButtonSwitch>
            <ButtonSelect
              closeOnSelect={true}
              name={t('general.Card size')}
              onSelect={v => {
                instance.updateCurrentView?.(s => ({ ...s, options: { ...s.options, cardSize: v[0] } }))
              }}
              value={currentGroupView.options.cardSize || 'medium'}
              options={[
                {
                  value: 'small',
                  children: t('general.Small')
                },
                {
                  value: 'medium',
                  children: t('general.Medium')
                },
                {
                  value: 'large',
                  children: t('general.Large')
                }
              ]}
            />
            {!thumbnailMode && (
              <ButtonSelect
                closeOnSelect={true}
                name={t('general.Card cover')}
                onSelect={v => {
                  instance.updateCurrentView?.(s => ({ ...s, options: { ...s.options, cardCover: v[0] } }))
                }}
                value={currentGroupView.options.cardCover || 'cover'}
                options={[
                  {
                    value: 'cover',
                    children: t('general.Cover image')
                  },
                  {
                    value: 'content',
                    children: t('general.Card content')
                  },
                  {
                    value: 'cover or content',
                    children: t('group.Cover image or card content')
                  },
                  {
                    value: 'none',
                    children: t('general.None')
                  }
                ]}
              />
            )}
          </>
        )}
        {currentGroupView?.type === 'gallery' && !thumbnailMode && (
          <ButtonSwitch
            onChange={v => {
              instance.updateCurrentView?.(s => ({
                ...s,
                type: 'gallery',
                options: {
                  ...s.options,
                  hideCoverIfEmpty: v
                }
              }))
            }}
            name={t('general.Hide cover if empty')}
            value={!!currentGroupView?.options.hideCoverIfEmpty}
          ></ButtonSwitch>
        )}
        {currentGroupView?.type !== 'list' && currentGroupView?.type !== 'calendar' && !thumbnailMode && (
          <ButtonSwitch
            onChange={v => {
              instance.updateCurrentView?.(s => ({
                ...s,
                options: {
                  ...s.options,
                  wrapColumns: v
                }
              }))
            }}
            name={t('general.Wrap columns')}
            value={!!currentGroupView?.options.wrapColumns}
          ></ButtonSwitch>
        )}
        {currentGroupView?.type === 'calendar' && (
          <ButtonSelect
            onSelect={v => {
              instance.updateCurrentView?.(s => ({
                ...s,
                options: {
                  ...s.options,
                  calendarSize: v[0]
                }
              }))
            }}
            name={t('general.Calendar size')}
            options={[
              {
                value: 'standard',
                children: t('general.Standard')
              },
              {
                value: 'large',
                children: t('general.Large')
              },
              {
                value: 'max',
                children: t('general.Max size')
              }
            ]}
            value={currentGroupView?.options.calendarSize || 'standard'}
          ></ButtonSelect>
        )}
      </div>
    </>
  )
}
