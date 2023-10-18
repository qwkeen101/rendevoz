const parser = new DOMParser()
export const WwwThevergeComExtractor = {
  domain: 'www.theverge.com',

  title: {
    selectors: ['h1']
  },

  author: {
    selectors: [['meta[name="author"]', 'value']]
  },

  date_published: {
    selectors: [['meta[name="article:published_time"]', 'value']]
  },

  dek: {
    selectors: ['.p-dek']
  },

  lead_image_url: {
    selectors: [['meta[name="og:image"]', 'value']]
  },

  content: {
    selectors: ['article'],
    // Transform lazy-loaded images
    transforms: {
      img: $node => {
        console.log($node.attr('src'))
        if ($node.attr('src').includes('base64')) {
          $node.removeAttr('src')
        }
      }
    },
    clean: ['audio']
  }
}
