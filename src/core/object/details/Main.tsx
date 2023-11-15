import { MetaStore } from '@/api/stores'
import { Button, Content, IconWithPopover, Image, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { GlobalGraphInstance, useRenderObject } from '@/core'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { Colors } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import { GlobalInstance } from '@/hooks'

const flatButton = css([
  ClassName.flatButton(999, '3px 10px '),
  {
    backgroundColor: Colors.Background.ButtonHover,
    fontWeight: 600,
    borderRadius: '999px !important',
    fontSize: 13,
    gap: 4,
    alignItems: 'center',
    ':hover': {
      backgroundColor: `${Colors.Background.ButtonActive} !important`
    }
  }
])

const MetaMainDetails = ({ metaId, onViewLinks, onViewAtt }: { onViewAtt: VoidFunction; metaId: number; onViewLinks: VoidFunction }) => {
  const object = MetaStore.useValue(metaId)
  const { renderWhole } = useRenderObject({ metaObjectId: metaId })
  const { t } = useTranslation()
  if (!object) return null

  return (
    <Content flex column fullHeight>
      <Content flex gap={12}>
        {object?.coverImgSrc && (
          <Image
            preview={true}
            src={object.coverImgSrc}
            width={96}
            height={96}
            containerStyle={{
              borderRadius: 8
            }}
            style={{ objectFit: 'cover' }}
          />
        )}
        <Content flex column auto gap={5} justifyContent={'center'}>
          {renderWhole({
            renderOptions: {
              renderImage: false
            },
            titleOptions: {
              clickToEdit: true,
              clickOriginToEdit: true
            }
          })}
        </Content>
      </Content>
      <Content style={{ paddingTop: 12, flexWrap: 'wrap' }} flex gap={8}>
        <Button.IconButton
          text={t('general.Open')}
          icon={'park-share'}
          onClick={() => {
            Rendevoz.Actions.Open.Meta.openMetaObject(metaId)
          }}
          className={flatButton}
        ></Button.IconButton>
        <Button.IconButton
          onClick={() => {
            Rendevoz.Actions.Open.Meta.openEditMetaDialog(metaId)
          }}
          text={t('general.edit')}
          icon={'park-edit'}
          className={flatButton}
        ></Button.IconButton>
        <Button.IconButton
          onClick={() => {
            MetaStore.updateMetaObject({ id: metaId, pinned: !object.pinned }, true)
          }}
          theme={object.pinned ? 'filled' : undefined}
          style={{
            color: object.pinned ? Colors.Common.Red : undefined
          }}
          text={object.pinned ? t('general.unpin') : t('general.pin')}
          icon={'park-like'}
          className={flatButton}
        ></Button.IconButton>
        <Button.IconButton onClick={onViewLinks} text={t('general.Links')} icon={'park-link'} className={flatButton}></Button.IconButton>
        <Button.IconButton
          onClick={() => {
            onViewAtt()
          }}
          text={t('general.attachments')}
          icon={'park-link-one'}
          className={flatButton}
        ></Button.IconButton>
        <Button.IconButton
          onClick={() => {
            GlobalGraphInstance.open?.({ id: metaId }, true)
          }}
          text={t('general.graph')}
          icon={'park-share-one'}
          className={flatButton}
        ></Button.IconButton>
        <IconWithPopover
          closeOnContentClick={true}
          content={
            <WithBorder padding={6} style={{ fontSize: 14 }} width={140}>
              <Button.IconButton
                text={t('general.Copy link')}
                onClick={() => {
                  GlobalInstance.metaOps?.copyLink(metaId)
                }}
                icon={'park-link'}
              />
              <Button.IconButton
                text={t('general.delete')}
                icon={'park-delete'}
                dangerous={true}
                onClick={() => {
                  MetaStore.deleteMetaObject(metaId, true)
                }}
              ></Button.IconButton>
            </WithBorder>
          }
          style={{ padding: '4px' }}
          name={'park-more'}
          className={flatButton}
        />
      </Content>
    </Content>
  )
}

export default MetaMainDetails
