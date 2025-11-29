import { useEffect } from 'react'
import { Icon, Select } from '@/components'
import ChooseGroupForm from './ChooseGroupForm'
import ChooseTagForm from '@/components/form/quickAdd/ChooseTagForm'
import ChooseCollectionForm from '@/components/form/quickAdd/ChooseCollectionForm'
import ChooseNoteForm from '@/components/form/quickAdd/ChooseNoteForm'
import { useTranslation } from 'react-i18next'
import { Icons } from '@/consts'
import ChooseWhiteboardForm from '@/components/form/quickAdd/ChooseWhiteboardForm'
import quickAdd from '@/components/form/quickAdd/quickAdd'
import ButtonSwitch from '@/components/base/ButtonSwitch'
import { DraggableElement } from '@/core'
import { atom } from 'jotai/index'
import { useAtom } from 'jotai'
import trans from '@/consts/trans'

const QuickaddCacheAtom = atom<{
  showHidden: boolean
  visible: AvailableQuickAdd
}>({
  showHidden: false,
  visible: 'folder'
})
export type AvailableQuickAdd = 'recently viewed' | 'tags' | 'folder' | 'group' | 'main' | 'note' | 'whiteboard'
export default ({
  currentMetaId,
  onClose,
  defaultVisible
}: {
  currentMetaId: number[]
  onClose: VoidFunction
  defaultVisible?: AvailableQuickAdd
}) => {
  const [{ showHidden, visible }, setCache] = useAtom(QuickaddCacheAtom)
  useEffect(() => {
    if (defaultVisible) {
      setCache(s => ({ ...s, visible: defaultVisible }))
    }
  }, [defaultVisible])
  const { t } = useTranslation()
  const hiddenSwitchVisible = ['group', 'whiteboard', 'note'].includes(visible)
  const renderer = () => {
    switch (visible) {
      case 'group':
        return (
          <ChooseGroupForm
            onClose={onClose}
            onChange={ids => {
              onClose()
              quickAdd(currentMetaId, 'group', ids)
            }}
            showHidden={showHidden}
          />
        )
      case 'whiteboard':
        return <ChooseWhiteboardForm showHidden={showHidden} />
      case 'note':
        return <ChooseNoteForm showHidden={showHidden} />
      case 'tags':
        return (
          <ChooseTagForm
            onChange={ids => {
              onClose()
              quickAdd(currentMetaId, 'tag', ids)
            }}
            metaId={currentMetaId.length === 1 ? currentMetaId[0] : undefined}
            onClose={onClose}
          />
        )
      case 'folder':
        return (
          <ChooseCollectionForm
            onClose={onClose}
            onChange={id => {
              onClose()
              quickAdd(currentMetaId, 'collection', id)
            }}
          />
        )
    }
  }
  return (
    <div
      style={{
        minWidth: 'min(90vw, 460px)'
      }}
    >
      <div className={'flex justify-between relative items-center px-4 py-2'}>
        <div className={'flex items-center gap-2 font-bold'}>
          <div className={'text-lg leading-none'}>{t('general.Move to')}</div>
          <Select
            onSelect={k => {
              setCache(s => ({ ...s, visible: k[0] }))
            }}
            value={visible}
            align={'start'}
            options={[
              {
                children: t('general.Folder'),
                value: 'folder'
              },
              {
                children: Global.utils.getTypeName('group'),
                value: 'group'
              },
              {
                children: Global.utils.getTypeName('whiteboard'),
                value: 'whiteboard'
              },
              {
                children: Global.utils.getTypeName('note'),
                value: 'note'
              },
              {
                children: t(trans.Tags),
                value: 'tags'
              }
            ]}
          />
          {hiddenSwitchVisible && (
            <ButtonSwitch
              name={t('general.Show hidden objects')}
              value={showHidden}
              className={'font-size-12 gap-2 transparent-font ml-2'}
              disableButtonStyle
              onChange={() => setCache(s => ({ ...s, showHidden: !s.showHidden }))}
            />
          )}
        </div>
        {(visible === 'note' || visible === 'whiteboard') && (
          <div className={'absolute left-1/2 -translate-x-1/2 '}>
            <DraggableElement
              draggingDetails={{
                type: 'metaObjects',
                ids: currentMetaId
              }}
            >
              <div className={'border items-center gap-2 font-size-13 flex transition-all px-3 py-1.5 rounded-lg cursor-grab'}>
                <Icon name={'park-drag'} />
                <div>{t('general.Drag to move')}</div>
              </div>
            </DraggableElement>
          </div>
        )}
        <Icon onClick={onClose} name={Icons.Close} className={'hover-active-button'} strokeWidth={6} size={16} />
      </div>
      {renderer()}
    </div>
  )
}
