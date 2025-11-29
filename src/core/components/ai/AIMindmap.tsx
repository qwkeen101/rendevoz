import React, { useRef, useEffect, memo, useState, useLayoutEffect } from 'react'
import { Markmap } from 'markmap-view'
import { Transformer } from 'markmap-lib'
import classnames from 'classnames'
import { Button, Icon } from '@/components'
import { Icons } from '@/consts'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import toast from 'react-hot-toast'

const transformer = new Transformer()

const save = async (value: string, action: 'copy' | 'download', name = 'Mindmap') => {
  covertSVG2Image(value, name, 'png', action)
}
const covertSVG2Image = async (value: string, name: string, type = 'png', action: 'copy' | 'download') => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.style.position = 'absolute'
  svg.style.opacity = '0'
  document.body.append(svg)
  const mm = Markmap.create(svg)
  svg.setAttribute('width', '1920')
  svg.setAttribute('height', '1080')

  const { root } = transformer.transform(value)
  mm.setData(root)
  await mm.fit()
  svg.style.opacity = '1'
  console.log(svg, svg.getBoundingClientRect())
  let serializer = new XMLSerializer()
  let image = new Image()
  const scale = 2
  let source = '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(svg)
  image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source)
  svg.remove()
  let canvas = document.createElement('canvas')
  canvas.width = 1920 * scale
  canvas.height = 1080 * scale
  let context = canvas.getContext('2d')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, 10000, 10000)
  image.onload = function () {
    context.scale(scale, scale)
    context.drawImage(image, 0, 0)
    if (action === 'download') {
      let a = document.createElement('a')
      a.download = `${name}.${type}`
      a.href = canvas.toDataURL(`image/${type}`)
      a.click()
    }
    if (action === 'copy') {
      canvas.toBlob(b => {
        if (b) {
          navigator.clipboard.write([
            new ClipboardItem({
              ['image/png']: b
            })
          ])
        }
      })
    }
  }
}
export default memo(
  ({
    value,
    onLoad,
    active,
    isLoading = false,
    mindmapName,
    className
  }: {
    value?: string
    mindmapName?: string
    onLoad?: VoidFunction
    active?: boolean
    isLoading?: boolean
    className?: string
  }) => {
    // Ref for SVG element
    const refSvg = useRef<SVGSVGElement>()
    // Ref for markmap object
    const refMm = useRef<Markmap>()

    const { t } = useTranslation()
    useEffect(() => {
      // Create markmap and save to refMm
      if (refMm.current) return
      const mm = Markmap.create(refSvg.current)
      refMm.current = mm
    }, [refSvg.current])
    const set = useRef(false)
    useEffect(() => {
      set.current = false
    }, [value])
    useLayoutEffect(() => {
      if (active) {
        if (!value) {
          onLoad?.()
        }
      }
    }, [active])
    useEffect(() => {
      // Update data for markmap once value is changed
      const mm = refMm.current
      if (!mm || !value || !active || set.current) return
      const { root } = transformer.transform(value)
      mm.setData(root, {
        spacingVertical: 10
      })
      mm.fit()
      set.current = true
    }, [refMm.current, value, active])

    return (
      <div className={classnames('w-full grow h-full flex-col relative', active ? 'flex' : 'hidden', className)}>
        <svg
          className="flex-1 w-full h-full"
          style={{
            visibility: isLoading ? 'hidden' : 'visible'
          }}
          ref={refSvg}
        />
        {isLoading ? (
          <div className={'inset-0 w-full h-full absolute flex items-center justify-center'}>
            <Icon name={Icons.Loading} size={40} spin />
          </div>
        ) : null}
        {!value && !isLoading && (
          <div className={'inset-0 w-full h-full absolute flex items-center justify-center'}>
            <Button.IconButton
              text={t(trans.Retry)}
              icon={'park-refresh'}
              onClick={onLoad}
              className={'reverse-theme-button !rounded-full !h-auto !px-6 !py-1.5'}
            ></Button.IconButton>
          </div>
        )}
        {value && !isLoading && (
          <div className={'absolute bottom-3 flex items-center gap-3 font-size-12 left-1/2 -translate-x-1/2'}>
            <div className={'rounded-full shrink-0'}>
              <Button.IconButton
                text={t(trans.Save)}
                icon={Icons.Save}
                size={14}
                className={'border-round-icon-button'}
                onClick={() => {
                  if (value) {
                    save(value, 'download', mindmapName)
                  }
                }}
              ></Button.IconButton>
            </div>
            <div className={'rounded-full shrink-0'}>
              <Button.IconButton
                text={t(trans.Copy)}
                icon={Icons.Copy}
                size={14}
                className={'border-round-icon-button'}
                onClick={() => {
                  if (value) {
                    save(value, 'copy').then(() => {
                      toast.success(t(trans.Copied))
                    })
                  }
                }}
              ></Button.IconButton>
            </div>
            <div className={'rounded-full shrink-0'}>
              <Icon
                size={14}
                onClick={() => {
                  refMm.current?.fit()
                }}
                className={'border-round-button icon-16 !p-1.5'}
                name={'park-auto-width'}
              />
            </div>
          </div>
        )}
      </div>
    )
  }
)
