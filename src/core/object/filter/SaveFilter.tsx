import KeyvalueStore, { CurrentKeyValues } from '@/api/stores/keyvalue.store'
import { useEffect, useMemo, useState } from 'react'
import { MetaFilterGroup, PartialWithId } from '~/typings'
import Id from '@/utils/id'
import { Button, Content, Icon, Menu, Modal } from '@/components'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import { ClassName } from 'rendevoz'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'

const useSavedFilter = () => {
  const currentWorkspace = KeyvalueStore.useValue('currentWorkspace')
  const savedFilters = KeyvalueStore.useValue('savedFilters')
  return useMemo(() => {
    return savedFilters?.filter(i => i.workspace === currentWorkspace?.id)
  }, [currentWorkspace, savedFilters])
}

const updateFilter = (filter: PartialWithId<Required<CurrentKeyValues>['savedFilters'][number]>) => {
  if (filter.id) {
    let allSavedFilters = [...(KeyvalueStore.getOne('savedFilters') || [])]
    const idx = allSavedFilters.findIndex(i => i.id === filter.id)
    if (idx >= 0) {
      allSavedFilters[idx] = {
        ...allSavedFilters[idx],
        ...filter
      }
      KeyvalueStore.updateOne('savedFilters', allSavedFilters)
    }
  }
}
const deleteSavedFilter = (id: number) => {
  let allSavedFilters = [...(KeyvalueStore.getOne('savedFilters') || [])]
  allSavedFilters = allSavedFilters.filter(i => i.id !== id)
  KeyvalueStore.updateOne('savedFilters', allSavedFilters)
}
const addSavedFilter = (filters: MetaFilterGroup, name?: string) => {
  const currentWorkspace = KeyvalueStore.getOne('currentWorkspace')
  if (currentWorkspace) {
    const allSavedFilters = [...(KeyvalueStore.getOne('savedFilters') || [])]
    const id = Id.getId()
    allSavedFilters.unshift({
      id,
      filter: filters,
      workspace: currentWorkspace.id,
      name
    })
    KeyvalueStore.updateOne('savedFilters', allSavedFilters)
    return id
  }
}

const useRenderSavedFilters = (onFilterSelect?: (filters: MetaFilterGroup) => void, onBack?: VoidFunction) => {
  const savedFilters = useSavedFilter()
  const { t } = useTranslation()
  const [lastSavedFilter, setLastSavedFilter] = useState<number>()
  const [saveNameState, setSaveNameState] = useState<{
    visible: boolean
    name?: string
    id?: number
    filter?: MetaFilterGroup
  }>({
    visible: false
  })
  const lastUsedFilter = useMemo(() => {
    if (lastSavedFilter && savedFilters) {
      return savedFilters.find(i => i.id === lastSavedFilter)
    }
  }, [lastSavedFilter, savedFilters])
  useEffect(() => {
    if (!savedFilters?.length) {
      onBack?.()
    }
  }, [savedFilters?.length])
  return {
    savedFilters,
    lastUsedFilter,
    save: (filter: MetaFilterGroup, id?: number) => {
      if (id) {
        updateFilter({ id, filter })
        return
      }
      setSaveNameState({
        filter,
        name: '',
        visible: true
      })
    },
    renderNameEditor: () => {
      const submit = () => {
        setSaveNameState({
          visible: false
        })
        if (saveNameState.id) {
          updateFilter({
            id: saveNameState.id,
            name: saveNameState.name
          })
        } else {
          if (saveNameState.filter) {
            const id = addSavedFilter(saveNameState.filter, saveNameState.name)
            if (id) {
              setLastSavedFilter(id)
            }
          }
        }
      }
      return (
        <Modal visible={saveNameState.visible} onClose={() => setSaveNameState(s => ({ ...s, visible: false }))}>
          <Content flex column>
            <Content
              column
              flex
              className={'border-bottom font-size-14'}
              style={{
                padding: '1.25rem',
                width: 480,
                maxWidth: '90vw'
              }}
            >
              <div
                className={'bold-font'}
                style={{
                  fontSize: 16,
                  marginBottom: '0.85rem'
                }}
              >
                {saveNameState.id ? t('filter.Rename filter') : t('filter.Save filter')}
              </div>
              <input
                onKeyDown={e => {
                  if (isHotkey(KEY.Enter, e)) {
                    e.preventDefault()
                    submit()
                  }
                  if (isHotkey(KEY.Escape, e)) {
                    e.preventDefault()
                    setSaveNameState({
                      visible: false
                    })
                  }
                }}
                autoFocus
                placeholder={t('filter.Enter name for filter')}
                className={'focus-input border-box-shadow'}
                value={saveNameState.name}
                onChange={e => setSaveNameState(s => ({ ...s, name: e.target.value }))}
                style={{
                  borderRadius: 4,
                  padding: '0.4rem 0.6rem'
                }}
              />
            </Content>
            <Content style={{ padding: '1rem' }} gap={16} alignItems={'center'} flex justifyContent={'flex-end'}>
              <div
                className={classnames(ClassName.flatButton(), 'transparent-font')}
                onClick={() => {
                  setSaveNameState({
                    visible: false
                  })
                }}
              >
                {t('general.Cancel')}
              </div>
              <div
                onClick={() => {
                  submit()
                }}
                className={ClassName.selectButton()}
              >
                {t('general.Save')}
              </div>
            </Content>
          </Content>
        </Modal>
      )
    },
    renderSavedFilters: () => {
      if (savedFilters?.length) {
        return (
          <Content
            column
            flex
            className={'font-size-14'}
            style={{
              padding: '0.2rem 0.25rem 0.4rem',
              maxHeight: 400,
              overflowY: 'auto'
            }}
          >
            <Content flex justifyContent={'space-between'} style={{ paddingRight: 6 }} alignItems={'center'} className={'transparent-font'}>
              <div style={{ padding: '4px 8px' }} className={'font-size-12  normal-font'}>
                {t('filter.Saved filters')}
              </div>
              <Icon onClick={onBack} size={13} className={ClassName.circleButton(3)} name={'park-close'}></Icon>
            </Content>
            {savedFilters.map(i => (
              <Content
                flex
                gap={10}
                onClick={() => {
                  onBack?.()
                  if (i.filter) {
                    setLastSavedFilter(i.id)
                    onFilterSelect?.(i.filter)
                  }
                }}
                key={i.id}
                className={ClassName.flatButton()}
              >
                <div style={{ flex: 1 }} className={'ellipsis-font-1'}>
                  {i.name || 'Unnamed filter'}
                </div>
                <Icon
                  size={16}
                  name={'park-edit'}
                  className={'hover-active-button'}
                  onClick={e => {
                    e.stopPropagation()
                    setSaveNameState({
                      name: i.name,
                      id: i.id,
                      visible: true
                    })
                  }}
                />
                <Icon
                  size={16}
                  name={'park-delete-one'}
                  className={'hover-active-button'}
                  onClick={e => {
                    e.stopPropagation()
                    deleteSavedFilter(i.id)
                  }}
                />
              </Content>
            ))}
          </Content>
        )
      }
    }
  }
}
export default {
  useSavedFilter,
  addSavedFilter,
  useRenderSavedFilters,
  deleteSavedFilter,
  updateFilter
}
