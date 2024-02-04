import { useState } from 'react'
import { Content } from '@/components'
import ChooseGroupForm from './ChooseGroupForm'
import ChooseTagForm from '@/components/form/quickAdd/ChooseTagForm'
import ChooseCollectionForm from '@/components/form/quickAdd/ChooseCollectionForm'
import { CollectionStore } from '@/api/stores'
import { ClassName } from 'rendevoz'
import ChooseNoteForm from '@/components/form/quickAdd/ChooseNoteForm'
import ChooseAttachmentForm from '@/components/form/quickAdd/ChooseAttachmentForm'
import { useTranslation } from 'react-i18next'
import note from '@/assets/images/note.png?url'
import group from '@/assets/images/group.png?url'
import tag from '@/assets/images/tag.png?url'
import folder from '@/assets/images/folder.png?url'
import link from '@/assets/images/link.png?url'
import whiteboard from '@/assets/images/whiteboard.png?url'
import { Colors } from '@/consts'
import ChooseWhiteboardForm from '@/components/form/quickAdd/ChooseWhiteboardForm'

export default ({ currentMetaId, onClose }: { currentMetaId: number[]; onClose: VoidFunction }) => {
  const [visible, setVisible] = useState<'tags' | 'collections' | 'groups' | 'attachments' | 'main' | 'note' | 'whiteboard'>('main')
  const { t } = useTranslation()
  const options = [
    {
      key: 'groups',
      name: t('general.group'),
      image: group
    },
    {
      key: 'whiteboard',
      name: t('general.whiteboard'),
      image: whiteboard
    },
    {
      key: 'note',
      name: t('general.note'),
      image: note
    },
    {
      key: 'collections',
      name: t('general.collection'),
      image: folder
    },
    {
      key: 'tags',
      name: t('general.tags'),
      image: tag
    },
    {
      key: 'attachments',
      name: t('general.attachments'),
      image: link
    }
  ]
  const handleBack = () => setVisible('main')
  const renderer = () => {
    switch (visible) {
      case 'main':
        return (
          <Content flex column style={{ padding: 24, width: 'min(420px, 90vw)' }}>
            <div style={{ marginBottom: 16, marginLeft: 8 }}>
              <div className={ClassName.title()}>{t('general.Quick add')}</div>
              <div style={{ fontSize: 14, marginTop: 4, color: Colors.Font.Transparent }}>
                {t('general.Organize object with one click')}
              </div>
            </div>
            <Content flex column gap={3}>
              {options.map(i => (
                <Content
                  key={i.key}
                  onClick={() => setVisible(i.key)}
                  className={ClassName.flatButton()}
                  flex
                  alignItems={'center'}
                  gap={12}
                  style={{
                    fontWeight: 500,
                    fontSize: 15
                  }}
                >
                  <img src={i.image} width={24} height={24} />
                  {i.name}
                </Content>
              ))}
            </Content>
          </Content>
        )
      case 'groups':
        return <ChooseGroupForm onClose={onClose} onBack={handleBack} metaId={currentMetaId} />
      case 'whiteboard':
        return <ChooseWhiteboardForm onClose={onClose} onBack={handleBack} metaId={currentMetaId} />
      case 'note':
        return <ChooseNoteForm onClose={onClose} onBack={handleBack} metaId={currentMetaId} />
      case 'attachments':
        return <ChooseAttachmentForm onClose={onClose} onBack={handleBack} metaId={currentMetaId} />
      case 'tags':
        return <ChooseTagForm onBack={handleBack} metaId={currentMetaId} />
      case 'collections':
        return (
          <ChooseCollectionForm
            onBack={handleBack}
            onChoose={s => {
              onClose()
              CollectionStore.addItemToCollection(
                currentMetaId.map(id => ({
                  type: 'meta',
                  id: id
                })),
                s.id
              )
            }}
          />
        )
    }
  }
  return <Content>{renderer()}</Content>
}
