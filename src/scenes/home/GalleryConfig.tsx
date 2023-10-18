import KeyvalueStore from '@/stores/keyvalue.store'
import { ButtonChooser, CheckBox, Content, Icon } from '@/components'
import { Reorder } from 'framer-motion'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'
import _ from 'lodash'
import { Colors } from '@/consts'
const GalleryConfig = () => {
  const allPanels = KeyvalueStore.useValue('homeGallery')
  const { t } = useTranslation()
  const rows = KeyvalueStore.useValue('homeGalleryRows') || 1
  return (
    <>
      <Reorder.Group
        as={'div'}
        onReorder={v => KeyvalueStore.updateOne('homeGallery', { ...allPanels, visibleLists: v })}
        values={allPanels?.visibleLists}
        style={{
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {allPanels?.visibleLists.map((l, index) => (
          <Reorder.Item as={'div'} value={l} key={l.name}>
            <Content flex gap={10} alignItems={'center'}>
              <CheckBox
                checked={l.visible}
                onChange={v => {
                  allPanels.visibleLists[index].visible = v
                  KeyvalueStore.updateOne('homeGallery', {
                    ...allPanels,
                    visibleLists: [...allPanels.visibleLists]
                  })
                }}
              ></CheckBox>
              <div>{t(`general.${l.name}`)}</div>
              <Icon name={'park-drag'} className={ClassName.flatButton(4, 2)} containerStyle={{ marginLeft: 'auto', cursor: 'grab' }} />
            </Content>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <ButtonChooser
        style={{ borderTop: `1px solid ${Colors.Background.Border}` }}
        value={`${rows}`}
        name={'Display rows'}
        options={_.range(1, 5).map(i => i.toString())}
        onChange={v => {
          const n = parseInt(v)
          if (n >= 1 && n <= 5) {
            KeyvalueStore.updateOne('homeGalleryRows', n)
          }
        }}
      />
    </>
  )
}

export default GalleryConfig
