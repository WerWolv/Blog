import { readdir } from 'node:fs/promises'
import { visit } from 'unist-util-visit'
import type { Emphasis, PhrasingContent, Root } from 'mdast'
import type { Element } from 'hast'

interface EmoteOptions {
  /** Filesystem directory served at urlPrefix. */
  directory?: string
  /** Public URL of directory, including the site's base path if needed. */
  urlPrefix?: string
}

/** Turn :name: into inline images served directly from the emote directory. */
export default function remarkEmotes({ directory = 'public/emotes', urlPrefix = '/emotes' }: EmoteOptions = {}) {
  return async (tree: Root) => {
    const entries = await readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return []
      throw error
    })
    const files = new Map<string, string>()
    for (const entry of entries) {
      const match = /^([\w+-]+)\.(png|gif|webp|jpe?g|svg)$/i.exec(entry.name)
      if (!entry.isFile() || !match) continue
      if (files.has(match[1])) throw new Error(`Duplicate emote name: ${match[1]} in ${directory}`)
      files.set(match[1], entry.name)
    }
    if (!files.size) return

    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index === undefined) return
      const children: PhrasingContent[] = []
      let end = 0
      for (const match of node.value.matchAll(/:([\w+-]+):/g)) {
        const filename = files.get(match[1])
        if (!filename) continue
        if (match.index > end) children.push({ type: 'text', value: node.value.slice(end, match.index) })
        const src = `${urlPrefix.replace(/\/$/, '')}/${encodeURIComponent(filename)}`
        const image: Element = {
          type: 'element',
          tagName: 'img',
          properties: { src, alt: match[0], className: ['no-zoom', 'noDarken'], decoding: 'async' },
          children: [],
        }
        const emote: Emphasis = {
          type: 'emphasis',
          children: [{ type: 'text', value: match[0] }],
          data: {
            hName: 'span',
            hProperties: { className: ['inline-emote'], title: match[0] },
            hChildren: [image],
          },
        }
        children.push(emote)
        end = match.index + match[0].length
      }
      if (!children.length) return
      if (end < node.value.length) children.push({ type: 'text', value: node.value.slice(end) })
      parent.children.splice(index, 1, ...children)
      return index + children.length
    })
  }
}
