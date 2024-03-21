import { Content, Footer, Icon, Modal } from '@/components'
import { useEffect, useState } from 'react'
import { MetaFilterGroup } from '~/typings'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import Id from '@/utils/id'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'

export default ({
  search,
  filter,
  onUse
}: {
  search?: string
  filter?: MetaFilterGroup
  onUse: (search: string | undefined, filter: MetaFilterGroup | undefined) => void
}) => {
  const [visible, setVisible] = useState(false)
  const [v, setV] = useState('')
  const currentWorkspace = KeyvalueStore.useValue('currentWorkspace')
  const currentSaved = KeyvalueStore.useValue('savedGlobalSearch')?.filter(i => i.workspace === currentWorkspace?.id)
  const { t } = useTranslation()
  useEffect(() => {
    setV(search || '')
  }, [search])
  const renderSaved = () => {
    if (!currentSaved || !currentSaved.length) {
      return null
    }
    return (
      <Content flex column style={{ padding: 6 }}>
        <div className={'font-size-12 transparent-font'} style={{ paddingLeft: '0.5em', marginBottom: '0.3em' }}>
          {t('general.Saved filters')}
        </div>
        {currentSaved.map(i => (
          <Content
            flex
            justifyContent={'space-between'}
            alignItems={'center'}
            key={i.id}
            onClick={() => {
              onUse?.(i.search, i.filter)
            }}
            className={classnames(ClassName.flatButton(), 'font-size-13')}
          >
            {i.name || 'Unnamed filters'}
            <Icon
              name={'park-close'}
              size={13}
              className={classnames(ClassName.flatButton(4, '4px'), 'super-transparent-font')}
              onClick={e => {
                e.stopPropagation()
                KeyvalueStore.updateOne(
                  'savedGlobalSearch',
                  currentSaved.filter(o => o.id !== i.id)
                )
              }}
            />
          </Content>
        ))}
      </Content>
    )
  }
  const renderSave = () => {
    return (
      <Modal visible={visible} onClose={() => setVisible(false)}>
        <Content flex column gap={12} style={{ width: 320, padding: '12px 16px' }}>
          <div className={'bold-font'}>Name your filters</div>
          <input
            spellCheck={'false'}
            onKeyDown={async e => {
              if (isHotkey(KEY.Enter, e)) {
                setVisible(false)
                if (!currentWorkspace) return
                const currSaved = (await KeyvalueStore.fetchOne('savedGlobalSearch')) || []
                KeyvalueStore.updateOne('savedGlobalSearch', [
                  {
                    id: Id.getId(),
                    name: v,
                    search,
                    filter,
                    workspace: currentWorkspace.id
                  },
                  ...currSaved
                ])
              }
              if (isHotkey(KEY.Escape, e)) {
                setVisible(false)
              }
            }}
            autoFocus
            defaultValue={search}
            onChange={e => setV(e.target.value)}
            placeholder={'Type name for filter...'}
            className={'focus-input border-box-shadow'}
            style={{
              borderRadius: 4,
              padding: '4px 8px',
              marginBottom: 8
            }}
          />
          <Footer
            onBack={() => setVisible(false)}
            onSubmit={async () => {
              setVisible(false)
              if (!currentWorkspace) return
              const currSaved = (await KeyvalueStore.fetchOne('savedGlobalSearch')) || []
              KeyvalueStore.updateOne('savedGlobalSearch', [
                {
                  id: Id.getId(),
                  name: v,
                  search,
                  filter,
                  workspace: currentWorkspace.id
                },
                ...currSaved
              ])
            }}
          ></Footer>
        </Content>
      </Modal>
    )
  }
  return {
    renderSave,
    renderSaved,
    openSave: () => setVisible(true)
  }
}
