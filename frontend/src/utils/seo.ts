interface MetaTags {
  title: string
  description: string
  image?: string
  url?: string
  type?: string
}

export const updateMetaTags = (tags: MetaTags) => {
  document.title = `${tags.title} | KHUB`
  
  // Update meta description
  let metaDescription = document.querySelector('meta[name="description"]')
  if (!metaDescription) {
    metaDescription = document.createElement('meta')
    metaDescription.setAttribute('name', 'description')
    document.head.appendChild(metaDescription)
  }
  metaDescription.setAttribute('content', tags.description)
  
  // Update OG tags
  updateOgTag('og:title', tags.title)
  updateOgTag('og:description', tags.description)
  if (tags.image) updateOgTag('og:image', tags.image)
  if (tags.url) updateOgTag('og:url', tags.url)
  if (tags.type) updateOgTag('og:type', tags.type)
  
  // Update Twitter tags
  updateMetaTag('twitter:title', tags.title)
  updateMetaTag('twitter:description', tags.description)
  if (tags.image) updateMetaTag('twitter:image', tags.image)
}

const updateMetaTag = (name: string, content: string) => {
  let tag
