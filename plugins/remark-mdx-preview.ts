import { visit } from 'unist-util-visit'
import type { RemarkPlugin } from '@astrojs/markdown-remark'

/**
 * Remark plugin that automatically injects the raw source of <MdxPreview>
 * children as a `code` prop, so the component can display both a syntax-
 * highlighted code block and a live preview without the author repeating
 * the content twice.
 *
 * Usage in MDX:
 *   <MdxPreview>
 *     Hello, I am <Age birthDate="1998-11-04" /> years old.
 *   </MdxPreview>
 *
 * The plugin reads the raw file source and extracts the text between the
 * opening and closing tags, then injects it as code={`...`}.
 */
const remarkMdxPreview: RemarkPlugin = () => {
  return (tree: any, vfile: any) => {
    const source: string = String(vfile.value)

    visit(tree, 'mdxJsxFlowElement', (node: any) => {
      if (node.name !== 'MdxPreview') return

      const children: any[] = node.children
      if (!children || children.length === 0) return

      // Skip if a `code` prop was already provided explicitly
      const alreadyHasCode = node.attributes?.some((a: any) => a.name === 'code')
      if (alreadyHasCode) return

      const firstChild = children[0]
      const lastChild = children[children.length - 1]

      if (!firstChild.position || !lastChild.position) return

      const innerStart: number = firstChild.position.start.offset
      const innerEnd: number = lastChild.position.end.offset
      const innerSource: string = source.slice(innerStart, innerEnd).trim()

      node.attributes = node.attributes ?? []
      node.attributes.push({
        type: 'mdxJsxAttribute',
        name: 'code',
        value: {
          type: 'mdxJsxAttributeValueExpression',
          value: JSON.stringify(innerSource),
          data: {
            estree: {
              type: 'Program',
              body: [
                {
                  type: 'ExpressionStatement',
                  expression: {
                    type: 'Literal',
                    value: innerSource,
                    raw: JSON.stringify(innerSource),
                  },
                },
              ],
              sourceType: 'module',
            },
          },
        },
      })
    })
  }
}

export default remarkMdxPreview
