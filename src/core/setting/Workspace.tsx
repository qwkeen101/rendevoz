import { useTranslation } from 'react-i18next'
import { Button, Content, Icon, IconWithPopover, Menu, WithBorder } from '@/components'
import { CollectionStore, MetaStore } from '@/api/stores'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { useSetting } from '@/core'
import { useEffect, useState } from 'react'
import produce from 'immer'
import { ClassName } from 'rendevoz'
import FontSize from '@/consts/font'
import { Colors, KEY } from '@/consts'
import { useDb } from '@/hooks'
import isHotkey from 'is-hotkey'
import Id from '@/utils/id'
import { toast } from 'react-hot-toast'
import Workspace from '@/api/common/workspace'
import classnames from 'classnames'

const WorkspaceSetting = () => {
  const currentWorkspace = KeyvalueStore.useValue('currentWorkspace')
  const allWorkspaces = KeyvalueStore.useValue('allWorkspaces')
  const [edit, setEdit] = useState<{
    id: number
    currentValue: string
  }>()

  const { t } = useTranslation()
  const canDelete = (allWorkspaces?.length || 0) > 1
  const handleDeleteCurrentWorkspace = () => {
    Workspace.deleteCurrentWorkspace()
  }
  const handleDeleteWorkspace = async (id: number) => {
    if (id === currentWorkspace?.id) {
      handleDeleteCurrentWorkspace()
    } else {
      const metaDb = useDb('metaObjects')
      const ids = await metaDb.filter(i => i.workspace === id).keys()
      metaDb.bulkDelete(ids)
      if (allWorkspaces) {
        KeyvalueStore.updateOne(
          'allWorkspaces',
          produce(allWorkspaces, s => {
            s.splice(
              s.findIndex(o => o.id === id),
              1
            )
          })
        )
      }
    }
  }
  const handleCreateWorkspace = () => {
    const id = Id.getId()
    KeyvalueStore.updateOne('allWorkspaces', [
      ...(allWorkspaces || []),
      {
        createdAt: Date.now(),
        name: '',
        id
      }
    ])
    setEdit({
      id,
      currentValue: ''
    })
  }

  const handleSwitchWorkspace = async (id: number) => {
    Workspace.switchWorkspace(id)
  }

  const handleRenameWorkspace = () => {
    if (!edit || !allWorkspaces) return
    const curr = allWorkspaces.find(i => i.id === edit.id)
    if (curr) {
      const currName = curr.name
      if (edit.currentValue === currName) {
        setEdit(undefined)
        return
      }
      if (edit.id === currentWorkspace?.id) {
        const newWorkspace = {
          ...currentWorkspace,
          name: edit.currentValue
        }
        KeyvalueStore.updateOne('currentWorkspace', newWorkspace)
        KeyvalueStore.updateOne(
          'allWorkspaces',
          produce(allWorkspaces, draft => {
            const t = draft.find(i => i.id === currentWorkspace.id)
            if (t) {
              t.name = edit.currentValue
            }
          })
        )
      } else {
        KeyvalueStore.updateOne(
          'allWorkspaces',
          produce(allWorkspaces, s => {
            const w = s.find(i => i.id === edit.id)
            if (w) {
              w.name = edit.currentValue
            }
          })
        )
      }
    }
  }

  return (
    <Content flex column gap={9}>
      <div
        style={{
          paddingBottom: 8
        }}
        className={classnames(ClassName.title(FontSize['16px']), 'border-bottom')}
      >
        {t('settings.Current workspace')}
      </div>
      <div>{currentWorkspace?.name}</div>
      <Content
        flex
        alignItems={'center'}
        justifyContent={'space-between'}
        className={'border-bottom'}
        style={{ marginTop: 10, paddingBottom: 8 }}
      >
        <div className={ClassName.title(FontSize['16px'])}>{t('settings.All workspaces')}</div>
        <div style={{ width: 'fit-content' }} onClick={() => handleCreateWorkspace()} className={ClassName.selectButton()}>
          {t('settings.Create new workspace')}
        </div>
      </Content>
      <Content flex column style={{ margin: '0px -8px' }}>
        {allWorkspaces?.map(i => (
          <Content
            flex
            gap={10}
            onClick={() => {
              if (edit?.id !== i.id) {
                handleSwitchWorkspace(i.id)
              }
            }}
            justifyContent={'space-between'}
            alignItems={'center'}
            className={i.id === edit?.id ? undefined : ClassName.flatButton()}
            style={{ padding: '6px 8px' }}
          >
            {i.id === edit?.id ? (
              <Content fullWidth flex gap={10}>
                <input
                  spellCheck={'false'}
                  style={{ width: '100%', borderRadius: 4, padding: '4px 8px' }}
                  className={'focus-input'}
                  value={edit.currentValue}
                  autoFocus={true}
                  onBlur={() => {
                    setEdit(undefined)
                  }}
                  placeholder={'Type workspace name...'}
                  onKeyDown={e => {
                    if (isHotkey(KEY.Escape, e)) {
                      setEdit(undefined)
                      e.stopPropagation()
                    }
                    if (isHotkey(KEY.Enter, e)) {
                      handleRenameWorkspace()
                      setEdit(undefined)
                    }
                  }}
                  onChange={e => {
                    const v = e.currentTarget.value
                    setEdit(s => ({
                      ...s,
                      currentValue: v
                    }))
                  }}
                />
              </Content>
            ) : (
              <div>{i.name}</div>
            )}
            <IconWithPopover
              placement={['bottom', 'top']}
              name={'park-more'}
              size={20}
              onClick={e => e.stopPropagation()}
              className={classnames(ClassName.circleButton(2, 4), 'transparent-font')}
              content={setV => (
                <WithBorder onClick={e => e.stopPropagation()} padding={'0.4rem 0'} width={160}>
                  <Menu.NavigationMenu
                    layout={[
                      {
                        type: 'item',
                        key: 'edit',
                        icon: 'park-edit',
                        text: t('general.edit'),
                        onSelect: () => {
                          setV(false)
                          setEdit({ id: i.id, currentValue: i.name })
                        }
                      },
                      {
                        type: 'item',
                        key: 'delete',
                        disabled: !canDelete,
                        icon: 'park-delete',
                        text: t('general.delete'),
                        onSelect: () => {
                          setV(false)
                          if (canDelete) {
                            handleDeleteWorkspace(i.id)
                          }
                        }
                      }
                    ]}
                  />
                </WithBorder>
              )}
            ></IconWithPopover>
          </Content>
        ))}
      </Content>
    </Content>
  )
}

export default WorkspaceSetting
