import gnews from '@/assets/images/google-news.png?url'
export default (icon?: string) => {
  if (icon === 'gNews') {
    return gnews
  }
  return icon
}
