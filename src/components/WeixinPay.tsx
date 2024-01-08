import { Content, Modal } from '@/components/base'
import { ClassName } from 'rendevoz'
import { memo } from 'react'
import { Colors } from '@/consts'
export default memo(
  ({ visible, code, onClose, onSubmit }: { visible: boolean; code?: string; onClose: VoidFunction; onSubmit: VoidFunction }) => {
    return (
      <Modal visible={!!(visible && code)} onClose={onClose}>
        <Content
          flex
          column
          gap={20}
          alignItems={'center'}
          style={{
            padding: 24,
            width: 300
          }}
        >
          <img
            src={code}
            style={{
              borderRadius: 12,
              boxShadow: Colors.Background.BoxShadow,
              width: '100%'
            }}
          />
          <div style={{ fontSize: 20, fontWeight: 600 }}>请使用微信扫码支付</div>
          <Content flex gap={6} fullWidth>
            <div
              onClick={() => {
                onSubmit()
              }}
              className={ClassName.selectButton()}
              style={{
                flex: 1,
                justifyContent: 'center',
                display: 'flex',
                padding: '6px 12px'
              }}
            >
              我已完成支付
            </div>
            <div
              className={ClassName.flatButton()}
              style={{
                border: Colors.Consts.Border,
                flex: 1,
                justifyContent: 'center',
                display: 'flex',
                padding: '6px 12px'
              }}
              onClick={onClose}
            >
              取消
            </div>
          </Content>
        </Content>
      </Modal>
    )
  }
)
