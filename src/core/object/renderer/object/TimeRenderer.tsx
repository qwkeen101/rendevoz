import { ILabel, MetaObject } from '~/typings'
import { useMemo } from 'react'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { Content, Icon } from '@/components'
import { Colors } from '@/consts'

export type TimeRendererProps = {
  showFrom?: boolean
}
export default ({
  label,
  meta
}: TimeRendererProps & {
  meta: MetaObject
  label: ILabel & { time: number }
}) => {

  return (
    <Content
      flex
      style={{
        color: Colors.Font.Transparent,
        marginBottom: 8
      }}
      gap={8}
    >
      {normalizedTime}
    </Content>
  )
}
