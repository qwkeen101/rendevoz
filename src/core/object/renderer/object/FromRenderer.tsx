import { IconNameItem } from '@/components/layout/sidebar/SidebarCollection'
import Colors from '@/consts/colors'
import { globalStore, MetaStore } from '@/api/stores'
import { CSSProperties, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MetaObject } from '~/typings'
import { delay } from '@/utils/functions'
import FontSize from '@/consts/font'
import { css } from '@emotion/css'
import { Content, Tooltip } from '@/components'
import ClassName from '@/styles/classNames'
import { PAGE_SPACING } from '../../../pdf/core/layouts/Layout'
import { Rendevoz } from '../../../rendevoz'
import { normalizeSecondsToTime } from '../../../media/utils'
import { metaObjectsAtom } from '@/api/stores/meta.store'

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
