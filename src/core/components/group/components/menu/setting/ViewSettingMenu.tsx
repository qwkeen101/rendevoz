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
  return (
    <>
      <Content
        flex
        gap={12}
        style={{
          padding: 8,
          marginBottom: 8
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
          }
        ].map(i => (
          <Content
            onClick={() => {
              instance.updateCurrentView?.(w => ({ ...w, type: i.type }))
            }}
            flex
            column
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
      {currentGroupView?.type === 'gallery' && (
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
      )}
      {currentGroupView?.type === 'gallery' && (
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
      )}
      {currentGroupView?.type === 'gallery' && (
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
              value: 'none',
              children: t('general.None')
            }
          ]}
        />
      )}
      {currentGroupView?.type === 'gallery' && (
        <ButtonSwitch
          onChange={v => {
            instance.updateCurrentView?.(s => ({
              ...s,
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
      {currentGroupView?.type !== 'list' && (
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
    </>
  )
}
