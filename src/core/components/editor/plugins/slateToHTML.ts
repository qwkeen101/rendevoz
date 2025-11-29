import { slateToMarkdown } from '@/core/components/editor/plugins/slateToMarkdown'
import { CustomElement } from '~/typings'
import showdown from 'showdown'
import { getPlainText } from '@/core/components/editor/slate-react/utils/dom'
export default (fragments: CustomElement[], totalFragments?: CustomElement[]) => {
  const markdown = slateToMarkdown(fragments)
  const converter = new showdown.Converter()
  const html = converter.makeHtml(markdown)
  const wrapper = document.createElement('div')
  wrapper.innerHTML = html
  const attached = document.createElement('div')
  const data = window.btoa(encodeURIComponent(JSON.stringify(totalFragments || fragments)))
  attached.setAttribute('data-slate-fragment', data)
  wrapper.appendChild(attached)
  document.body.appendChild(wrapper)
  const result = wrapper.innerHTML
  const text = getPlainText(wrapper)
  document.body.removeChild(wrapper)
  console.log(result, markdown)
  return {
    html: result,
    text
  }
}
