import { FC, useState } from 'react'
import { ICollection } from '~/typings/data'
import Menu from '../base/menu'
import NewCollectionForm from '../form/NewCollectionForm'
import { Content, Footer } from '../base'
import Icon from '../base/Icon'
import Collection from '../collection'
import toast from 'react-hot-toast'
import { Noop } from '@/common/types'
import { useTranslation } from 'react-i18next'
import SwitchAnimation from '../base/animation/SwitchAnimation'

interface ChooseCollectionDialogProps {
  onBack?: Noop
  onChoose?: (collection: ICollection) => void
}

const ChooseCollectionDialog: FC<ChooseCollectionDialogProps> = ({ onChoose, onBack }) => {
  const { t } = useTranslation()
  const [isAddCollection, setIsAddCollection] = useState(false)
  const [chosenCollection, setChosenCollection] = useState<ICollection>()
  const [selectedCollection, setSelectedCollection] = useState<ICollection>()
  return (
    <Menu
      style={{ height: '100%', minHeight: 'inherit' }}
      title={t('dialog.collections')}
      extra={
        <Content
          onClick={() => setIsAddCollection(!isAddCollection)}
          flex
          centered
          style={{ color: '#8590ae', cursor: 'pointer', fontWeight: 600 }}
        >
          {!isAddCollection && (
            <>
              <Icon size={16} style={{ marginRight: 6 }} name="park-folder-plus" />
              <span>{t('dialog.new collection')}</span>
            </>
          )}
        </Content>
      }
    >
      <SwitchAnimation direction={!!isAddCollection}>
        {switchWrapper =>
          isAddCollection
            ? switchWrapper(
                <NewCollectionForm
                  onBack={() => {
                    setIsAddCollection(false)
                  }}
                  onAddCollection={() => setIsAddCollection(false)}
                  parentCollection={chosenCollection}
                />,
                'form'
              )
            : switchWrapper(
                <Content position="absolute" style={{ inset: 0 }}>
                  <Collection
                    style={{ height: 'calc( 100% - 34px )' }}
                    defaultId={chosenCollection?.id}
                    useRoute={false}
                    onCollectionChange={collection => setChosenCollection(collection)}
                    onCollectionSelect={collection => setSelectedCollection(collection)}
                    hideDetails
                    hideDocuments
                    hideContextMenu
                  />
                  <Footer
                    submitText="choose"
                    onBack={onBack}
                    onSubmit={() => {
                      if (chosenCollection || selectedCollection) {
                        onChoose?.(chosenCollection || selectedCollection)
                      } else {
                        toast.error('Choose one collection first!', { duration: 2000 })
                      }
                    }}
                  />
                </Content>,
                'collection'
              )
        }
      </SwitchAnimation>
    </Menu>
  )
}
export default ChooseCollectionDialog
