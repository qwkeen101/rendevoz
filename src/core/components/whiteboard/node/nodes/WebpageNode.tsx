import { Content } from '@/components/base'
import { IWhiteboardNode } from '~/typings/data'
import Webpage from '@/core/components/webpage/Webpage'
import { css } from '@emotion/css'

const WebpageNode = ({ node }: { node: IWhiteboardNode & { type: 'webpage' } }) => {
  return (
    <Content
      style={{
        minWidth: '100%',
        width: '700px',
        height: '100%',
        minHeight: 'max(100%, 50px)',
        maxWidth: '100%',
        overflow: 'hidden',
        maxHeight: '100%'
      }}
    >
      <Webpage
        disableTabTitle={true}
        initialWebpageId={node.webpageId}
        editorOptions={{
          layout: {
            showHeader: false,
            showBottomPadding: true,
            showBlockHandleAdd: false
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
            pageMinPadding: '0px 48px 0px',
            containerHeight: 'auto',
            containerMaxHeight: '100%'
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
    </Content>
  )
}

export default WebpageNode
