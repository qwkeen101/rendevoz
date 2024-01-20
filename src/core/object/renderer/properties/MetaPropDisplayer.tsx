import { MetaStore, ObjectStore } from '@/api/stores'
import { IMetaProperty } from '~/typings'
import { AnimatePopover, Button, Content } from '@/components'
import CheckboxProp from '@/core/object/renderer/properties/CheckboxProp'
import TextProp from '@/core/object/renderer/properties/TextProp'
import URLProp from '@/core/object/renderer/properties/URLProp'
import DateProp from '@/core/object/renderer/properties/DateProp'
import MultiSelectProp from '@/core/object/renderer/properties/MultiSelectProp'
import FileProp from '@/core/object/renderer/properties/FileProp'
import SelectProp from '@/core/object/renderer/properties/SelectProp'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import ColumnMenu from '@/core/object/renderer/properties/PropertyMenu'
import NewPropertyMenu from '@/core/object/renderer/properties/NewPropertyMenu'
import { useTranslation } from 'react-i18next'
import AIQuestionsProp from '@/core/object/renderer/properties/AIQuestionsProp'
import { CSSProperties } from 'react'

export default ({
  metaId,
  style,
  showAddPropPlaceholder = false
}: {
  metaId: number
  style?: CSSProperties
  showAddPropPlaceholder?: boolean
}) => {
  const meta = MetaStore.useValue(metaId)
  const properties = meta?.properties
  const { t } = useTranslation()
  if (!Object.keys(properties || {}).length && showAddPropPlaceholder === false) return null
  return (
    <Content flex column gap={4} style={{ fontSize: 14, ...style }}>
      {properties && Object.entries(properties).map(i => <PropPairDisplayer key={i[0]} k={Number(i[0])} v={i[1]} metaId={metaId} />)}
      {Object.keys(properties || {}).length > 0 || showAddPropPlaceholder ? (
        <AnimatePopover
          reposition
          positions={['bottom', 'top']}
          align={'start'}
          content={setV => (
            <NewPropertyMenu
              onClose={() => {
                setV(false)
              }}
              onAddProp={async p => {
                const prop = await MetaStore.addNewProp(p)
                if (prop) {
                  MetaStore.updateProperty(metaId, prop.id, { value: undefined })
                }
              }}
            />
          )}
        >
          <Button.IconButton
            text={t('general.Add a property')}
            icon={'park-plus'}
            style={{
              color: Colors.Font.Transparent,
              padding: '5px 6px',
              width: 160
            }}
          ></Button.IconButton>
        </AnimatePopover>
      ) : null}
    </Content>
  )
}

const PropPairDisplayer = ({ k, v, metaId }: { k: number; v: IMetaProperty; metaId: number }) => {
  const prop = ObjectStore('metaProp').useValue(k)

  if (!prop) return null
  const handleChange = newV => {
    MetaStore.updateProperty(metaId, k, {
      value: newV
    })
  }
  const { value } = v
  const { propType, icon, name } = prop
  const valueProp = () => {
    switch (propType) {
      case 'string':
      case 'AI summary':
      case 'number':
        return (
          <TextProp
            mode={propType === 'string' || propType === 'AI summary' ? 'text' : 'number'}
            value={value}
            style={{
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap'
            }}
            onChange={handleChange}
          />
        )
      case 'AI questions':
        return <AIQuestionsProp metaId={metaId} />
      case 'URL':
        return <URLProp value={value} onChange={handleChange} />
      case 'checkbox':
        return (
          <CheckboxProp
            style={{
              padding: '3px 0px'
            }}
            onChange={handleChange}
            value={value}
          ></CheckboxProp>
        )
      case 'date':
        return <DateProp onChange={handleChange} value={value}></DateProp>
      case 'multiSelect': {
        return (
          <MultiSelectProp
            style={{
              padding: '1px 0px'
            }}
            onChange={handleChange}
            fieldName={k}
            metaId={metaId}
            value={value}
          ></MultiSelectProp>
        )
      }
      case 'file': {
        return <FileProp value={value} onChange={handleChange} />
      }
      case 'singleSelect': {
        return (
          <SelectProp
            style={{
              padding: '1px 0px'
            }}
            onChange={handleChange}
            metaId={metaId}
            fieldName={k}
            value={value}
          />
        )
      }
    }
  }
  return (
    <Content flex gap={8} alignItems={'start'}>
      <AnimatePopover
        reposition
        positions={['bottom', 'top']}
        content={
          <ColumnMenu
            property={prop}
            editable={true}
            show={{
              hide: false,
              delete: true
            }}
          />
        }
      >
        <Button.IconButton
          size={14}
          text={name}
          icon={icon}
          style={{ width: 160, padding: '5px 6px', color: Colors.Font.Transparent, flexShrink: 0 }}
        />
      </AnimatePopover>
      <div
        className={ClassName.flatButton()}
        style={{
          flex: 1,
          padding: '5px 8px',
          minHeight: 32,
          overflow: 'hidden'
        }}
        onClick={e => {
          if (e.currentTarget.contains(e.target)) {
            e.currentTarget.querySelector('[role="prop-container"]')?.click()
          }
        }}
      >
        {valueProp()}
      </div>
    </Content>
  )
}
