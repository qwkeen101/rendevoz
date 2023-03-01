import { globalStore } from '@/stores'
import { TagToTagAtom } from '@/stores/tag.store'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { useAtomValue } from 'jotai/react'
import { useMemo, useState } from 'react'
import { Flipped, Flipper } from 'react-flip-toolkit'
import toast from 'react-hot-toast'
import { ITag } from '~/typings/data'
import { Form, Icon } from '..'
import FormColorPicker from './FormColorPicker'
import { FormState, IForm } from './types'

const TagForm = ({ initialObject, onBack, onSubmit }: IForm<ITag>) => {
  const [tag, setTag] = useState({ ...initialObject })
  const [formState, setFormState] = useState<FormState>({
    mainVisible: true
  })
  const tagToTag = useAtomValue(TagToTagAtom, { store: globalStore })
  const colorId = useMemo(() => Id.getStrId(), [])
  const mainId = useMemo(() => Id.getStrId(), [])
  const formId = useMemo(() => Id.getStrId(), [])
  const renderForm = () => (
    <Form
      title="Create Tag"
      submitText="create"
      onBack={onBack}
      onSubmit={() => {
        const { name } = tag
        if (!name) {
          toast.error("Tag name can't be empty!")
          return
        }
        if (tagToTag.has(name)) {
          toast.error('Tag already exists.')
          return
        }
        onSubmit?.(tag)
      }}
    >
      <Form.Item text="Name" value={tag.name} onChange={e => setTag({ ...tag, name: e })} type="input"></Form.Item>
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
            {tag.color ? <div style={{ width: 20, height: 20, borderRadius: 4, background: tag.color }}></div> : <Icon name="park-right" />}
          </div>
        </div>
      </Form.Item>
    </Form>
  )

  return (
    <Flipper spring={{ stiffness: 1600, damping: 100 }} flipKey={JSON.stringify(formState)}>
      <Flipped flipId={mainId}>
        <div
          className={ClassName.Background.blurBackground}
          style={{
            padding: '16px 24px',
            borderRadius: 8,
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)',
            overflow: 'hidden',
            minWidth: 400
          }}
        >
          {formState.mainVisible && <Flipped flipId={formId}>{renderForm()}</Flipped>}
          {formState.colorPickerVisible && (
            <Flipped flipId={colorId}>
              <FormColorPicker
                disableLinear
                onClose={() => setFormState({ mainVisible: true })}
                onPick={e => {
                  setFormState({ mainVisible: true })
                  setTag({ ...tag, color: e })
                }}
              />
            </Flipped>
          )}
        </div>
      </Flipped>
    </Flipper>
  )
}

export default TagForm
