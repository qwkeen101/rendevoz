import { Noop } from '@/common/types'
import useCollectionStore from '@/stores/collection.store'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ICollection } from '~/typings/data'
import { Content, Form, Icon } from '../base'
import { Flipper, Flipped, spring } from 'react-flip-toolkit'
import { css } from '@emotion/css'
import ColorPicker from '../picker/colorPicker'
import ClassName from '@/styles/classNames'
import EmojiPicker from '../picker/emojiPicker'
import getEmoji from '@/utils/emoji'
import FormIconPicker from './FormIconPicker'
import FormColorPicker from './FormColorPicker'
import { FlipCardEnter, FlipCardExit } from '@/common/animation/flip'
interface NewCollectionFormProps {
  parentCollection?: ICollection | null
  currentCollection?: ICollection
  onAddCollection?: (collection?: ICollection) => void
  isEditing?: boolean
  onBack?: Noop
}
const NewCollectionForm: FC<NewCollectionFormProps> = ({ parentCollection, onAddCollection, onBack, currentCollection, isEditing }) => {
  const [collection, setCollection] = useState<Partial<ICollection>>({
    parentId: parentCollection?.id || 0,
    items: [],
    ...currentCollection
  })
  const [formState, setFormState] = useState<
    Partial<{
      mainVisible: boolean
      colorPickerVisible: boolean
      iconPickerVisible: boolean
    }>
  >({
    mainVisible: true
  })
  const [emoji, setEmoji] = useState<any>()
  const { addCollection, addItemToCollection, updateCollection } = useCollectionStore()
  const { t } = useTranslation()
  useEffect(() => {
    collection.icon &&
      getEmoji(collection.icon).then(data => {
        setEmoji(data)
      })
  }, [collection.icon])
  const renderForm = () => {
    return (
      <Form
        submitText={isEditing ? 'submit' : 'create'}
        backText="cancel"
        style={{ height: '100%' }}
        title={isEditing ? 'Edit Collection' : 'Create New Collection'}
        onSubmit={() => {
          if (isEditing) {
            collection.id && updateCollection(collection)
            onAddCollection?.()
            return
          }
          const c = addCollection(collection)
          if (parentCollection) {
            setTimeout(async () => {
              addItemToCollection(
                {
                  type: 'collection',
                  id: (await c).id
                },
                parentCollection.id
              )
            }, 200)
          }
          onAddCollection?.(c)
        }}
        onBack={onBack}
      >
        <Form.Item
          value={collection.name}
          type="input"
          text={t('form.name')}
          onChange={value => setCollection({ ...collection, name: value })}
        ></Form.Item>
        <Form.Item type="component">
          <div
            style={{
              boxShadow: 'rgb(31 34 37 / 6%) 0px 0px 0px 1px inset',
              borderRadius: 8,
              padding: 8,
              fontSize: 13,
              background: 'rgba(31,34,37,0.03)',
              fontWeight: 500,
              fontFamily: 'Muli'
            }}
          >
            <div
              className={ClassName.flatButton()}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => setFormState({ colorPickerVisible: true })}
            >
              Color
              {collection.color ? (
                <div style={{ width: 20, height: 20, borderRadius: 4, background: collection.color }}></div>
              ) : (
                <Icon name="park-right" />
              )}
            </div>
            <div style={{ margin: '4px', height: '1px', background: 'rgba(0,0,0,0.07)' }}></div>
            <div
              className={ClassName.flatButton()}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => setFormState({ iconPickerVisible: true })}
            >
              Icon
              {collection.icon ? (
                <Content flex centered style={{ width: 20, height: 20 }}>
                  <img
                    src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
                    style={{
                      width: '1.2em',
                      height: '1.2em',
                      backgroundImage: `url(${emoji?.imageSrc})`,
                      backgroundPositionX: `${(emoji?.x * 100) / 60}%`,
                      backgroundPositionY: `${(emoji?.y * 100) / 60}%`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '6100% 6100%',
                      verticalAlign: '-0.1em',
                      marginRight: 2
                    }}
                  />
                </Content>
              ) : (
                <Icon name="park-right" onClick={() => setFormState({ iconPickerVisible: true })} />
              )}
            </div>
          </div>
        </Form.Item>
      </Form>
    )
  }

  return (
    <Flipper
      spring={{ stiffness: 1600, damping: 100 }}
      handleEnterUpdateDelete={({ animateExitingElements, animateEnteringElements, hideEnteringElements, animateFlippedElements }) => {
        hideEnteringElements()
        animateExitingElements()
        animateFlippedElements()
        animateEnteringElements()
      }}
      flipKey={`${formState.mainVisible}_${formState.colorPickerVisible}_${formState.iconPickerVisible}`}
    >
      <Flipped flipId="smallxx">
        <div
          className={css([ClassName.Background.blurBackground])}
          style={{
            padding: '16px 24px',
            borderRadius: 8,
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)',
            overflow: 'hidden'
          }}
        >
          {formState.mainVisible && (
            <Flipped key="form" flipId="form" onAppear={FlipCardEnter} onExit={FlipCardExit}>
              <div style={{ width: 400 }}>{renderForm()}</div>
            </Flipped>
          )}

          {formState.colorPickerVisible && (
            <Flipped key="ss" flipId="ss" onAppear={FlipCardEnter} onExit={FlipCardExit}>
              <FormColorPicker
                onClose={() => setFormState({ mainVisible: true })}
                onPick={e => {
                  setCollection({ ...collection, color: e })
                  setFormState({ mainVisible: true, colorPickerVisible: false })
                }}
              />
            </Flipped>
          )}

          {formState.iconPickerVisible && (
            <Flipped key="hgfh" flipId="gffg" onAppear={FlipCardEnter} onExit={FlipCardExit}>
              <FormIconPicker
                onPick={e => {
                  setCollection({ ...collection, icon: e })
                  setFormState({ mainVisible: true, iconPickerVisible: false })
                }}
                onClose={() => setFormState({ mainVisible: true })}
              />
            </Flipped>
          )}
        </div>
      </Flipped>
    </Flipper>
  )
}

export default NewCollectionForm
