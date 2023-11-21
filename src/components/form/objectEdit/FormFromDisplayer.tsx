import { useEffect, useState } from 'react'
import { MetaObject } from '~/typings'
import { groupClassName, hoverLabelClassName } from '../useFlipForm'
import { useTranslation } from 'react-i18next'
import { IconNameItem } from '../../layout/sidebar/SidebarCollection'
import { MetaStore } from '@/api/stores'
import { Icon } from '../../base'
import ClassName from '@/styles/classNames'
import { Rendevoz } from '@/core/rendevoz'

const FormFromDisplayer = ({ initialObject, onRemove }: { initialObject: Partial<MetaObject>; onRemove: VoidFunction }) => {
  const [fromState, setFromState] = useState<{
    name?: string
    icon?: string
  }>()
  const { t } = useTranslation()
  const getIcon = Rendevoz.Utils.Object.getMetaObjectIcon
  useEffect(() => {
    const setAction = async () => {
      if (!initialObject.fromObject) {
        setFromState(undefined)
      }
      if (initialObject.fromObject) {
        const { fromObject: from } = initialObject
        const fromMeta = await MetaStore.getMetaObjectById(from.metaId)
        console.log(from.metaId, fromMeta)
        if (!fromMeta) return
        setFromState({ name: fromMeta.name, icon: Rendevoz.Utils.Object.getMetaObjectIcon(fromMeta.type) })
      }
    }
    setAction()
  }, [initialObject])
  if (!fromState?.name) return null
  return (
    <div className={groupClassName}>
      <div className={hoverLabelClassName}>{t('general.from')}</div>
      {/*<Icon*/}
      {/*  name="park-delete"*/}
      {/*  className={ClassName.circleButton()}*/}
      {/*  onClick={onRemove}*/}
      {/*  containerStyle={{*/}
      {/*    position: 'absolute',*/}
      {/*    top: -10,*/}
      {/*    right: 10,*/}
      {/*    fontSize: 10*/}
      {/*  }}*/}
      {/*/>*/}
      <div style={{ fontSize: 13 }}>
        <IconNameItem icon={fromState?.icon} name={fromState?.name} />
      </div>
    </div>
  )
}

export default FormFromDisplayer
