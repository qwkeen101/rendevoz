import { useEffect, useRef, useState } from 'react'
import { AnimatePopover, Button, Content, Icon, WithBorder } from '@/components'
import ButtonSelect from '@/components/base/ButtonSelect'
import useGroupState from '@/core/components/group/hooks/useGroupState'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import PropertiesMenu from '@/core/components/group/components/menu/setting/PropertiesMenu'
import { ClassName } from 'rendevoz'
import ButtonSwitch from '@/components/base/ButtonSwitch'
import EmojiWithPicker from '@/components/EmojiWithPicker'
import EmojiPicker from '@/components/picker/emojiPicker'
import { css } from '@emotion/css'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'
import ViewSettingMenu from '@/core/components/group/components/menu/setting/ViewSettingMenu'

export default ({ onClose }: { onClose: VoidFunction }) => {
  const [currentView, setCurrentView] = useState<'main' | 'properties' | 'view'>('main')
  const [groupState, setGroupState] = useGroupState()
  const { t } = useTranslation()
  const currentGroupView = groupState.currentView
  const instance = useGroupInstance()
  const inputRef = useRef<HTMLInputElement>()
  const groupStateState = groupState.state
  const groupLayout = groupState.layout
  const openInOptions = [
    {
      value: 'newTab',
      children: t('general.New tab')
    },
    {
      value: 'sidePeek',
      children: t('general.Side peek')
    },
    {
      value: 'center',
      children: t('general.Center')
    }
  ]
  useEffect(() => {
    const i = inputRef.current
    if (i && currentGroupView?.name) {
      i.value = currentGroupView.name
    }
  }, [currentGroupView?.name])
  const renderMain = () => {
    switch (currentView) {
      case 'main': {
        return (
          <>
            <Content
              flex
              gap={6}
              alignItems={'center'}
              className={css({
                margin: '0px 8px 6px',
                borderRadius: 4,
                padding: '4px',
                ':focus-within': {
                  boxShadow: '0 0 0 2px var(--select-color)'
                },
                boxShadow: '0 0 0 1px var(--border-background)'
              })}
            >
              {currentGroupView?.icon && !(currentGroupView.icon.startsWith('park') || currentGroupView.icon.startsWith('custom')) ? (
                <EmojiWithPicker
                  showPicker={true}
                  size={{
                    width: 16,
                    height: 16
                  }}
                  style={{
                    padding: '3px'
                  }}
                  emoji={currentGroupView.icon}
                  onChange={v => instance.updateCurrentView?.(s => ({ ...s, icon: v }))}
                />
              ) : (
                <AnimatePopover
                  withClickCover={true}
                  positions={['bottom']}
                  content={
                    <WithBorder
                      style={{
                        width: 400,
                        height: 400
                      }}
                    >
                      <EmojiPicker
                        onPick={v => {
                          instance.updateCurrentView?.(s => ({ ...s, icon: v }))
                        }}
                      />
                    </WithBorder>
                  }
                >
                  <Icon className={ClassName.flatButton(4, '3px')} name={currentGroupView?.icon || 'park-table-file'} />
                </AnimatePopover>
              )}
              <input
                defaultValue={currentGroupView?.name}
                placeholder={'View name'}
                className={ClassName.noStyleInput}
                onBlur={e => {
                  instance.updateCurrentView?.(s => ({ ...s, name: e.target.value }))
                }}
              />
            </Content>
            <Button.IconButton
              icon={'park-mindmap-list'}
              text={t('general.Properties')}
              suffixIcon={'park-right'}
              onClick={() => {
                setCurrentView('properties')
              }}
            />
            <Button.IconButton
              icon={'park-list-view'}
              text={t('general.View')}
              suffixIcon={'park-right'}
              onClick={() => {
                setCurrentView('view')
              }}
            />
            <ButtonSelect
              name={t('general.Open object in')}
              closeOnSelect={true}
              value={groupState.data?.openIn || 'newTab'}
              options={openInOptions}
              onSelect={v => {
                instance.updateGroupData?.(s => ({ ...s, openIn: v[0] }))
              }}
            />
            {groupLayout?.showAddObjectIntoSetting !== false && (
              <ButtonSelect
                closeOnSelect={true}
                name={t('general.Add from outside to')}
                onSelect={v => {
                  instance.updateGroupData?.(s => ({ ...s, autoAddto: v[0] }))
                }}
                value={groupState.data?.autoAddto || 'first'}
                options={[
                  {
                    value: 'first',
                    children: t('general.First')
                  },
                  {
                    value: 'last',
                    children: t('general.Last')
                  }
                ]}
              />
            )}

            {groupStateState?.canHideObjectsInside !== false && (
              <ButtonSwitch
                onChange={v => {
                  instance.updateGroupData?.(s => ({
                    ...s,
                    hideObjectsInside: v
                  }))
                }}
                name={t('general.Hide objects')}
                value={!!groupState.data?.hideObjectsInside}
              ></ButtonSwitch>
            )}
            {groupState.data?.hideObjectsInside &&
              groupStateState?.canHideObjectsInside !== false &&
              groupStateState?.canHideGroupsInside !== false && (
                <ButtonSwitch
                  onChange={v => {
                    instance.updateGroupData?.(s => ({
                      ...s,
                      hideGroupsInside: v
                    }))
                  }}
                  name={t('general.Hide groups')}
                  value={!!groupState.data?.hideGroupsInside}
                ></ButtonSwitch>
              )}
            <div
              style={{
                width: '100%',
                height: 1,
                background: Colors.Background.Border,
                margin: '6px 0px'
              }}
            ></div>
            <Button.IconButton
              icon={'park-delete'}
              dangerous
              onClick={() => {
                if (groupState.currentView?.id) {
                  onClose()
                  instance.deleteView?.(groupState.currentView?.id)
                }
              }}
              text={t('general.Delete view')}
            />
          </>
        )
      }
      case 'properties':
        return <PropertiesMenu />
      case 'view':
        return <ViewSettingMenu />
    }
  }
  return (
    <Content flex column style={{ fontSize: 14, padding: '6px 0px 0px' }}>
      {currentView !== 'main' && (
        <Content flex gap={10} style={{ marginBottom: 10 }}>
          <Icon
            className={ClassName.circleButton()}
            name={'park-left'}
            onClick={() => {
              setCurrentView('main')
            }}
          ></Icon>
          <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
            {currentView === 'properties' ? t('general.Properties') : undefined}
            {currentView === 'view' ? t('general.View') : undefined}
          </div>
        </Content>
      )}
      {renderMain()}
    </Content>
  )
}
