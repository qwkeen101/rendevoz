import { Content, Modal } from '@/components/base'
import { ClassName } from 'rendevoz'
import { memo, useLayoutEffect, useState } from 'react'
import { Colors } from '@/consts'
import classnames from 'classnames'
import { css } from '@emotion/css'
import QRCode from 'qrcode'
import tinycolor from 'tinycolor2'
export default memo(
  ({ visible, code, onClose, onSubmit }: { visible: boolean; code?: string; onClose: VoidFunction; onSubmit: VoidFunction }) => {
    const [data, setData] = useState<string>()
    const [color, setColor] = useState<string>()
    console.log(data)
    useLayoutEffect(() => {
      if (code) {
        const fontColor = tinycolor(window.getComputedStyle(document.body).getPropertyValue('--font-primary')).toHexString()
        console.log(fontColor)
        QRCode.toDataURL(document.createElement('canvas'), code, {
          color: {
            dark: fontColor,
            light: '#00000000'
          },
          margin: 2
        }).then(res => {
          setData(res)
        })
        setColor(fontColor)
      } else {
        setData(undefined)
      }
    }, [code])
    return (
      <Modal visible={!!(visible && data)} onClose={onClose}>
        <div className={'flex flex-col items-center gap-4 p-6 w-[90vw] max-w-[22rem]'}>
          <div className={'text-2xl font-bold'}>请使用微信扫码支付</div>
          <div className={'w-full py-4'}>
            <div
              style={{
                outline: `4px solid ${color}`,
                maxWidth: '180px',
                margin: 'auto'
              }}
              className={classnames(
                css({
                  outlineOffset: '-5px',
                  mask:
                    'conic-gradient(at 30px 30px,#0000 75%,#000 0)\n' +
                    '    0 0/calc(100% - 30px) calc(100% - 30px),\n' +
                    '    linear-gradient(#000 0 0) content-box'
                }),
                'w-full p-2 relative rounded-lg'
              )}
            >
              <img src={data} className={'w-full'} />
            </div>
          </div>
          <div className={'flex gap-3 w-full font-medium'}>
            <div
              onClick={() => {
                onSubmit()
              }}
              className={'reverse-theme-button !py-1.5 items-center !rounded-full'}
              style={{
                flex: '1 0 50%',
                justifyContent: 'center',
                display: 'flex'
              }}
            >
              已完成支付
            </div>
            <div
              className={'button !rounded-full !py-1.5'}
              style={{
                border: Colors.Consts.Border,
                flex: '1 0 50%',
                justifyContent: 'center',
                display: 'flex'
              }}
              onClick={onClose}
            >
              取消
            </div>
          </div>
        </div>
      </Modal>
    )
  }
)
