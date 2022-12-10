import { Noop } from '@/common/types'
import useCollectionStore from '@/stores/collection.store'
import useMetaStore from '@/stores/meta.store'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { ICollection } from '~/typings/data'
import SwitchAnimation from '../base/animation/SwitchAnimation'
import NewDocumentForm from '../form/newDocumentForm'
import ChooseCollectionDialog from './ChooseCollectionDialog'

const NewDocumentDialog = ({ onSubmit, onBack }: { onSubmit?: Noop; onBack?: Noop }) => {
  const [chosenCollection, setChosenCollection] = useState<ICollection>()
  const { addItemToCollection } = useCollectionStore()
  const { addMetaObject } = useMetaStore()
  return (
    <SwitchAnimation direction={!!chosenCollection}>
      {switchWrapper =>
        chosenCollection
          ? switchWrapper(
              <NewDocumentForm
                onBack={() => setChosenCollection(undefined)}
                onSubmit={doc => {
                  addItemToCollection(
                    {
                      type: 'document',
                      id: doc.id
                    },
                    chosenCollection.id
                  ).then(
                    () => {
                      onSubmit?.()
                      addMetaObject({
                        type: 'document',
                        documentId: doc.id,
                        title: doc.metadata?.title || doc.name
                      })
                      toast.success('Successfully add document !')
                    },
                    reject => {
                      toast.error(reject)
                    }
                  )
                }}
                collection={chosenCollection}
              />,
              'form'
            )
          : switchWrapper(<ChooseCollectionDialog onBack={onBack} onChoose={collection => setChosenCollection(collection)} />, 'choose')
      }
    </SwitchAnimation>
  )
}

export default NewDocumentDialog
