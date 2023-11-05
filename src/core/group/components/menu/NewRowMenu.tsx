import { Button, Content } from '@/components'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import { Path } from 'slate'
import { GlobalInstance } from '@/hooks'
import { useTranslation } from 'react-i18next'

export default ({
  currentRowId,
  onClose,
  direction
}: {
  currentRowId?: number
  direction: 'above' | 'below' | 'inner'
  onClose: VoidFunction
}) => {
  const { t } = useTranslation()
  const instance = useGroupInstance()
  const handleInsert = (type: 'text' | 'subGroup' | 'object', metaId?: number) => {
    let path
    if (currentRowId) {
      path = instance.pathOps?.getPathById(currentRowId)
      if (path) {
        if (direction === 'below') {
          path = Path.next(path)
        }
        if (direction === 'inner') {
          path = [...path, 0]
        }
      }
    }
    switch (type) {
      case 'text': {
        instance.valueOps?.insertValueByPath(
          {
            textContent: '',
            type: 'text'
          },
          path
        )
        break
      }
      case 'subGroup': {
        break
      }
      case 'object': {
        if (metaId) {
          instance.valueOps?.insertValueByPath(
            {
              type: 'metaObject',
              id: metaId
            },
            path
          )
        }
        break
      }
    }
  }
  return (
    <Content>
      {/*<Button.IconButton*/}
      {/*  text={'New text row'}*/}
      {/*  icon={'park-add-text'}*/}
      {/*  onClick={() => {*/}
      {/*    handleInsert('text')*/}
      {/*  }}*/}
      {/*></Button.IconButton>*/}
      <Button.IconButton
        icon={'park-filter'}
        onClick={() => {
          onClose()
          if (currentRowId) {
            instance.values.currentInsertTarget = {
              rowId: currentRowId,
              direction
            }
          }
          instance.openFilterPanel?.()
        }}
        text={t('general.Filter objects in library')}
      />
      <Button.IconButton
        icon={'park-plus'}
        text={t('general.Create new object')}
        onClick={() => {
          onClose()
          GlobalInstance.metaOps?.createObject().then(object => {
            handleInsert('object', object.id)
          })
        }}
      ></Button.IconButton>
    </Content>
  )
}
