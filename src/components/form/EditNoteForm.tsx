import { FlipCardEnter, FlipCardExit } from '@/common/animation/flip'
import ClassName from '@/styles/classNames'
import getEmoji from '@/utils/emoji'
import { css } from '@emotion/css'
import { useEffect, useState } from 'react'
import { Flipped, Flipper } from 'react-flip-toolkit'
import { INote } from '~/typings/data'
import { Form, Icon } from '..'
import { Content } from '../base'
import FormColorPicker from './FormColorPicker'
import FormIconPicker from './FormIconPicker'
import { IForm } from './types'

const EditNoteForm = ({ onBack, onSubmit, initialObject }: IForm<INote>) => {
  const [note, setNote] = useState({ ...initialObject })
  const [formState, setFormState] = useState<
    Partial<{
      mainVisible: boolean
      iconPickerVisible: boolean
      colorPickerVisible: boolean
    }>
  >({
    mainVisible: true
  })
  const [emoji, setEmoji] = useState<any>()
  useEffect(() => {
    note.icon &&
      getEmoji(note.icon).then(data => {
        setEmoji(data)
      })
  }, [note.icon])
  const renderForm = () => {
    return (
      <Form
        submitText="submit"
        backText="cancel"
        style={{ height: '100%' }}
        title={'Edit Note'}
        onSubmit={() => {
          note && onSubmit?.(note)
        }}
        onBack={onBack}
      >
        <Form.Item value={note.title} type="input" text="Title" onChange={value => setNote({ ...note, title: value })}></Form.Item>
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
              {note?.color ? (
                <div style={{ width: 20, height: 20, borderRadius: 4, background: note.color }}></div>
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
              {note?.icon ? (
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
                  setNote({ ...note, color: e })
                  setFormState({ mainVisible: true, colorPickerVisible: false })
                }}
              />
            </Flipped>
          )}

          {formState.iconPickerVisible && (
            <Flipped key="hgfh" flipId="gffg" onAppear={FlipCardEnter} onExit={FlipCardExit}>
              <FormIconPicker
                onPick={e => {
                  setNote({ ...note, icon: e })
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

export default EditNoteForm
