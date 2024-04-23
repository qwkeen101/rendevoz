import { Content } from '@/components/base'
import { IWhiteboardNode } from '~/typings/data'
import Webpage from '@/core/components/webpage/Webpage'
import { css } from '@emotion/css'
import { memo, useMemo } from 'react'

const WebpageNode = memo(({ node, webpageId }: { node: IWhiteboardNode; webpageId: number }) => {
  return (
    <Webpage
      disableTabTitle={true}
      initialHeight={useMemo(() => node.height, [])}
      initialWebpageId={webpageId}
      editorOptions={{
        layout: {
          virtualizer: true,
          showHeader: false,
          disableOverscanInReadOnly: false,
          overscan: 3,
          showBottomPadding: true,
          showBlockHandleAdd: false,
          showProps: false
        },
        title: {
          titleStyle: {
            fontSize: '2rem'
          },
          titleContainerStyle: {
            padding: '30px 0px 5px',
            maxWidth: '100%',
            width: '100%'
          }
        },

        styles: {
          bottomPadding: 100,
          pageMinPadding: '0px 30px 0px',
          containerHeight: 'auto',
          containerMaxHeight: 'inherit',
          containerStyle: {
            width: '520px',
            minHeight: 'max(100%, 50px)',
            maxWidth: '100%',
            minWidth: '100%'
          }
        },
        state: {
          fontSize: 17,
          pageWidth: 'Max'
        },
        classNames: {
          editorContainerClassName: css({
            fontSize: '1em',
            width: '100% !important'
          })
        }
      }}
    />
  )
})

export default WebpageNode
