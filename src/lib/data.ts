import { getCollection, type CollectionEntry } from 'astro:content'

export function postsSort(posts: CollectionEntry<'posts'>[]) {
  return posts.slice().sort((a, b) => {
    const dateA = a.data.updatedDate ?? a.data.pubDate
    const dateB = b.data.updatedDate ?? b.data.pubDate
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })
}

export async function getAllPosts(): Promise<CollectionEntry<'posts'>[]> {
  const allPosts = await getCollection('posts')
  return postsSort(allPosts.filter((post) => !post.data.draft || import.meta.env.DEV))
}

export async function getPinnedPosts(): Promise<CollectionEntry<'posts'>[]> {
  const allPosts = await getCollection('posts')
  const pinnedPosts = allPosts.filter((post) => post.data.pinned)
  return postsSort(pinnedPosts)
}

export async function getNumPosts(size: number): Promise<CollectionEntry<'posts'>[]> {
  const allPosts = await getCollection('posts')
  return postsSort(allPosts.filter((post) => !post.data.draft || import.meta.env.DEV)).slice(0, size)
}

export async function getAllTags(): Promise<Record<string, number>> {
  const allPosts = await getAllPosts()
  const tags = allPosts.flatMap((post) => post.data.tags || [])
  return tags.reduce(
    (acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
}

export async function getAllProjects(): Promise<CollectionEntry<'projects'>[]> {
  const allProjects = await getCollection('projects')
  return allProjects
    .filter((project) => !project.data.draft || import.meta.env.DEV)
    .sort((a, b) => {
      return a.data.order - b.data.order
    })
}
