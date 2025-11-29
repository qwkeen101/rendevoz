import Id from '@/utils/id'

export const ELEMENT_TAGS: Record<string, (el: HTMLElement) => any> = {
  A: el => ({ type: 'link', url: el.getAttribute('href'), id: Id.getId() }),
  BLOCKQUOTE: () => ({ type: 'block-quote', id: Id.getId() }),
  H1: () => ({ type: 'heading-one', id: Id.getId() }),
  H2: () => ({ type: 'heading-two', id: Id.getId() }),
  H3: () => ({ type: 'heading-three', id: Id.getId() }),
  H4: () => ({ type: 'heading-four', id: Id.getId() }),
  H5: () => ({ type: 'heading-five', id: Id.getId() }),
  H6: () => ({ type: 'heading-six', id: Id.getId() }),
  HR: () => ({ type: 'divider', id: Id.getId() }),
  PRE: () => ({ type: 'code-block', id: Id.getId(), language: 'plain text' }),
  AUDIO: el => ({ type: 'audio', id: Id.getId(), url: el.getAttribute('src') }),
  IMG: el => ({
    type: 'image',
    url: el.hasAttribute('data-src')
      ? new URL(el.getAttribute('data-src')!, el.ownerDocument.querySelector('base')!.href).href
      : el.getAttribute('src'),
    id: Id.getId()
  }),
  IFRAME: el => ({
    type: 'iframe',
    url: el.getAttribute('src'),
    id: Id.getId()
  }),
  P: () => ({ type: 'paragraph', id: Id.getId() }),
  SUP: () => ({ type: 'sup', id: Id.getId() }),
  FIGCAPTION: () => ({ type: 'figcaption', id: Id.getId() })
}

export const TEXT_TAGS: Record<string, () => any> = {
  CODE: () => ({ code: true }),
  DEL: () => ({ strikethrough: true }),
  EM: () => ({ italic: true }),
  I: () => ({ italic: true }),
  S: () => ({ strikethrough: true }),
  STRONG: () => ({ bold: true }),
  U: () => ({ underline: true }),
  B: () => ({ bold: true })
}
