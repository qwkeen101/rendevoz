import { IconNameItem } from '@/components/layout/sidebar/SidebarCollection'
import Colors from '@/consts/colors'
import { MetaStore } from '@/api/stores'
import { CSSProperties } from 'react'
import { MetaObject } from '~/typings'
import { css } from '@emotion/css'
import { Rendevoz } from '../../../rendevoz'

export type FromRendererProps = {
  style?: CSSProperties
  onFromClick?: () => void
}
const FromRenderer = ({
  metaObject: initialObject,
  style,
  onFromClick
}: FromRendererProps & {
  metaObject: MetaObject
}) => {
  const getIcon = Rendevoz.Utils.Object.getMetaObjectIcon
  const fromMeta = MetaStore.useValue(initialObject?.fromObject?.metaId)
  const handleNavigateToFrom = async () => {
    if (initialObject?.fromObject) {
      await Rendevoz.Actions.Open.Meta.openMetaObject(initialObject.fromObject.metaId)
    }
  }
  if (!fromMeta) return null

  return (
    <IconNameItem
      className={css({
        ':hover': {
          textDecoration: 'underline'
        }
      })}
      style={{
        fontSize: 12,
        cursor: 'pointer',
        width: 'fit-content',
        color: Colors.Font.Transparent,
        ...style
      }}
      onClick={() => {
        handleNavigateToFrom()
        onFromClick?.()
      }}
      name={fromMeta.name}
      icon={getIcon(fromMeta.type)}
    />
  )
}

export default FromRenderer
