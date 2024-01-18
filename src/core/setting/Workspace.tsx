import { useTranslation } from 'react-i18next'
import { Button, Content, Icon, IconWithPopover, WithBorder } from '@/components'
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

const WorkspaceSetting = () => {
  const currentWorkspace = KeyvalueStore.useValue('currentWorkspace')
  const allWorkspaces = KeyvalueStore.useValue('allWorkspaces')
  const [edit, setEdit] = useState<{
    idx: number
    currentValue: string
    valid: boolean
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
  const handleCreateWorkspace = (name: string) => {
    KeyvalueStore.updateOne('allWorkspaces', [
      ...(allWorkspaces || []),
      {
        createdAt: Date.now(),
        name,
        id: Id.getId()
      }
    ])
  }

  const handleSwitchWorkspace = async (id: number) => {
    Workspace.switchWorkspace(id)
  }

  const handleRenameWorkspace = () => {
    if (!edit || !allWorkspaces) return
    if (edit.valid) {
      const currName = allWorkspaces[edit.idx].name
      if (edit.currentValue === currName) {
        setEdit(undefined)
        return
      }
      if (currName === currentWorkspace?.name) {
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
            s[edit.idx].name = edit.currentValue
          })
        )
      }
      setEdit(undefined)
    } else {
      toast.error(t('settings.Workspace name must be unique') + '!', { duration: 2000 })
    }
  }

  return (
    <Content flex column gap={9}>
      <div className={ClassName.title(FontSize['16px'])}>{t('settings.Current workspace')}</div>
      <div>{currentWorkspace?.name}</div>
      <div style={{ marginTop: 10 }} className={ClassName.title(FontSize['16px'])}>
        {t('settings.All workspaces')}
      </div>
      <Content flex column style={{ lineHeight: 1.4 }}>
        {allWorkspaces?.map((i, idx) => (
          <Content
            flex
            gap={10}
            justifyContent={'space-between'}
            alignItems={'center'}
            style={{ borderBottom: `1px solid ${Colors.Background.Border}`, padding: '6px 0px' }}
          >
            {idx === edit?.idx ? (
              <Content fullWidth flex gap={10}>
                <input
                  style={{ width: '100%' }}
                  className={ClassName.noStyleInput}
                  value={edit.currentValue}
                  autoFocus={true}
                  onKeyDown={e => {
                    if (isHotkey(KEY.Escape, e)) {
                      setEdit(undefined)
                      e.stopPropagation()
                    }
                    if (isHotkey(KEY.Enter, e)) {
                      handleRenameWorkspace()
                    }
                  }}
                  onChange={e => {
                    const v = e.currentTarget.value
                    setEdit(s => ({
                      ...s,
                      currentValue: v,
                      valid: !allWorkspaces?.some(o => o.id !== i.id && o.name === v)
                    }))
                  }}
                />
                <Icon
                  name={'park-check'}
                  className={ClassName.circleButton()}
                  onClick={() => {
                    handleRenameWorkspace()
                  }}
                />
              </Content>
            ) : (
              <div>{i.name}</div>
            )}
            <IconWithPopover
              closeOnContentClick={true}
              placement={['bottom', 'top']}
              name={'park-more'}
              size={20}
              className={ClassName.circleButton(2, 4)}
              onClickOutside={(e, setv) => {
                setv(false)
              }}
              content={
                <WithBorder padding={6}>
                  <Button.IconButton
                    icon={'park-switch'}
                    text={t('general.Switch workspace')}
                    onClick={() => {
                      handleSwitchWorkspace(i.id)
                    }}
                  />
                  <Button.IconButton
                    icon={'park-edit'}
                    text={t('general.edit name')}
                    onClick={() => {
                      setEdit({ idx, valid: true, currentValue: i.name })
                    }}
                  />
                  <Button.IconButton
                    dangerous
                    disabled={!canDelete}
                    icon={'park-delete'}
                    text={t('general.delete')}
                    onClick={() => {
                      if (canDelete) {
                        handleDeleteWorkspace(i.id)
                      }
                    }}
                  />
                </WithBorder>
              }
            ></IconWithPopover>
          </Content>
        ))}
        <Button.IconButton
          style={{ width: 'fit-content', marginTop: 6 }}
          onClick={() => handleCreateWorkspace('Workspace_' + Id.getStrId())}
          icon={'park-plus'}
          text={t('settings.Create new workspace')}
        />
      </Content>
    </Content>
  )
}

export default WorkspaceSetting
