import useFeedState from '@/core/components/feed/hooks/useFeedState'
import { Content, Icon, Modal } from '@/components'
import FeedList from '@/core/components/feed/components/FeedList'
import FeedContentRenderer from '@/core/components/feed/components/FeedContentRenderer'
import { Resizable } from 're-resizable'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'

const FeedContainer = () => {
  const [feedState, setFeedState] = useFeedState()
  const feedModalWidth = KeyvalueStore.useValue('feedModalWidth') || 900
  const openMode = KeyvalueStore.useValue('feedOpenMode') || 'rightBar'
  const modalOpen = feedState.modalOpen
  const instance = useFeedInstance()
  return (
    <Content
      flex
      justifyContent={openMode === 'sidePeek' && feedState.modalOpen ? 'flex-start' : 'center'}
      style={{
        height: '100%',
        width: '100%'
      }}
    >
      <FeedList />
      {openMode === 'center' && (
        <Modal
          zIndex={8000}
          enableClickEvent={true}
          visible={feedState.modalOpen}
          style={{
            background: Colors.Background.Global
          }}
          onClose={() => setFeedState(s => ({ ...s, modalOpen: false }))}
        >
          <Resizable
            defaultSize={{
              width: feedModalWidth,
              height: '90vh'
            }}
            onResizeStop={(event, direction, elementRef) => {
              KeyvalueStore.updateOne('feedModalWidth', elementRef.clientWidth)
            }}
            size={{
              width: feedModalWidth,
              height: '90vh'
            }}
            enable={{
              left: true,
              right: true
            }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              position: 'relative',
              background: Colors.Background.Global,
              borderRadius: 12
            }}
            maxWidth={'90vw'}
            minWidth={500}
            minHeight={600}
          >
            <div
              style={{
                position: 'absolute',
                left: -50,
                top: '50%',
                transform: 'translateY(-50%)',
                color: Colors.Font.White
              }}
            >
              <Icon
                onClick={() => {
                  instance.navigateOps?.back()
                }}
                className={ClassName.circleButton()}
                size={30}
                name={'park-left'}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                right: -50,
                top: '50%',
                transform: 'translateY(-50%)',
                color: Colors.Font.White
              }}
            >
              <Icon
                onClick={() => {
                  instance.navigateOps?.forward()
                }}
                className={ClassName.circleButton()}
                size={30}
                name={'park-right'}
              />
            </div>
            <FeedContentRenderer />
          </Resizable>
        </Modal>
      )}
      {openMode === 'rightBar' && (
        <Resizable
          enable={{
            left: true
          }}
          defaultSize={{
            height: '100%',
            width: '50%'
          }}
          minWidth={'30%'}
        >
          <FeedContentRenderer />
        </Resizable>
      )}
      {openMode === 'sidePeek' && (
        <Resizable
          enable={{
            left: true
          }}
          defaultSize={{
            height: '100%',
            width: '45vw'
          }}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            transform: !feedState.modalOpen ? 'translateX(100%)' : undefined,
            zIndex: 100,
            background: Colors.Background.Popover
          }}
        >
          <div
            className={'border-box-shadow'}
            style={{
              position: 'absolute',
              background: Colors.Background.Popover,
              left: -38,
              top: '22px',
              transform: 'translateY(-50%)',
              zIndex: 15,
              borderRadius: 4
            }}
          >
            <Icon
              name={modalOpen ? 'park-double-right' : 'park-double-left'}
              className={ClassName.flatButton(4, '5px')}
              size={20}
              onClick={() => {
                setFeedState(s => ({ ...s, modalOpen: !s.modalOpen }))
              }}
            />
          </div>
          <FeedContentRenderer />
        </Resizable>
      )}
    </Content>
  )
}

export default FeedContainer
