import React, { type ReactNode, isValidElement, useState } from 'react'

interface TreeNode {
  name: string
  isDir: boolean
  highlighted: boolean
  placeholder: boolean
  comment: string
  children: TreeNode[]
}

function parseLine(raw: string): Omit<TreeNode, 'children'> {
  const trimmed = raw.trim().replace(/^-\s*/, '')

  const highlighted = /^<strong>.+<\/strong>/.test(trimmed)
  const unwrapped = highlighted ? trimmed.replace(/^<strong>(.+?)<\/strong>(.*)$/, '$1$2') : trimmed

  let name = ''
  let comment = ''

  const codeMatch = unwrapped.match(/^`([^`]+)`(.*)/)
  if (codeMatch) {
    name = codeMatch[1] ?? ''
    comment = (codeMatch[2] ?? '').trim()
  } else {
    const spaceIdx = unwrapped.search(/\s/)
    if (spaceIdx === -1) {
      name = unwrapped
    } else {
      name = unwrapped.slice(0, spaceIdx)
      comment = unwrapped.slice(spaceIdx).trim()
    }
  }

  const placeholder = name === '...' || name === '…'
  const isDir = name.endsWith('/') || placeholder
  const cleanName = isDir && !placeholder ? name.slice(0, -1) : name

  return {
    name: cleanName,
    isDir,
    highlighted,
    placeholder,
    comment,
  }
}

function getDirectText(el: Element): string {
  let text = ''

  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const child = node as HTMLElement
      if (child.tagName !== 'UL') {
        text += child.textContent
      }
    }
  }

  return text.trim()
}

function parseList(ul: Element): TreeNode[] {
  const nodes: TreeNode[] = []

  for (const li of Array.from(ul.children)) {
    if (li.tagName !== 'LI') continue

    const rawText = getDirectText(li)
    if (!rawText) continue

    const parsed = parseLine(rawText)

    const childUl = Array.from(li.children).find((el) => el.tagName === 'UL') as Element | undefined

    const children = childUl ? parseList(childUl) : []

    if (children.length > 0) {
      parsed.isDir = true
    }

    nodes.push({
      ...parsed,
      children,
    })
  }

  return nodes
}

function parseHtml(html: string): TreeNode[] {
  if (typeof document === 'undefined') return []

  const container = document.createElement('div')
  container.innerHTML = html

  const rootUl = container.querySelector('ul')
  if (!rootUl) return []

  return parseList(rootUl)
}

function parseFiles(input: ReactNode): TreeNode[] {
  const first = React.Children.toArray(input)[0]

  if (isValidElement(first) && typeof (first.props as any)?.value === 'string') {
    return parseHtml((first.props as any).value)
  }

  return []
}

const EXT_ICON: Record<string, string> = {
  json: 'icon-[lucide--braces]',
  jsonc: 'icon-[lucide--braces]',
  toml: 'icon-[lucide--settings]',
  yaml: 'icon-[lucide--settings]',
  yml: 'icon-[lucide--settings]',
  env: 'icon-[lucide--key-round]',
  lock: 'icon-[lucide--lock]',
  html: 'icon-[lucide--code]',
  htm: 'icon-[lucide--code]',
  css: 'icon-[lucide--paintbrush]',
  scss: 'icon-[lucide--paintbrush]',
  less: 'icon-[lucide--paintbrush]',
  py: 'icon-[lucide--file-code]',
  rs: 'icon-[lucide--file-code]',
  c: 'icon-[lucide--file-code]',
  cpp: 'icon-[lucide--file-code]',
  h: 'icon-[lucide--file-code]',
  hpp: 'icon-[lucide--file-code]',
  sh: 'icon-[lucide--terminal]',
  bash: 'icon-[lucide--terminal]',
  md: 'icon-[lucide--file-text]',
  txt: 'icon-[lucide--file-text]',
  pdf: 'icon-[lucide--file-text]',
  png: 'icon-[lucide--image]',
  jpg: 'icon-[lucide--image]',
  jpeg: 'icon-[lucide--image]',
  gif: 'icon-[lucide--image]',
  svg: 'icon-[lucide--image]',
  ico: 'icon-[lucide--image]',
  webp: 'icon-[lucide--image]',
}

const SPECIAL_ICON: Record<string, string> = {
  'readme.md': 'icon-[lucide--book-open]',
  'license': 'icon-[lucide--scale]',
  'license.md': 'icon-[lucide--scale]',
}

function getFileIconClass(name: string): string {
  if (!name) return 'icon-[lucide--file]'
  const special = SPECIAL_ICON[name.toLowerCase()]
  if (special) return special

  const ext = name.includes('.') ? (name.split('.').pop()?.toLowerCase() ?? '') : ''

  return EXT_ICON[ext] ?? 'icon-[lucide--file]'
}

const iconStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 15,
  height: 15,
  flexShrink: 0,
  verticalAlign: 'middle',
}

function Icon({ cls, color }: { cls: string; color?: string }) {
  return <span className={cls} style={{ ...iconStyle, ...(color ? { color } : {}) }} aria-hidden />
}

function FileRow({ node }: { node: TreeNode }) {
  const iconCls = node.placeholder ? 'icon-[lucide--ellipsis]' : getFileIconClass(node.name)

  return (
    <div
      className="ft-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 6px',
        borderRadius: 4,
        marginInlineStart: 19,
      }}
    >
      <Icon cls={iconCls} color="#94a3b8" />
      <span style={{ fontWeight: node.highlighted ? 600 : 400 }}>{node.placeholder ? '…' : node.name}</span>
      {node.comment && <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>{node.comment}</span>}
    </div>
  )
}

function DirRow({ node, open, onToggle }: { node: TreeNode; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="ft-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 6px',
        borderRadius: 4,
        background: 'transparent',
        border: 'none',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <span
        className="icon-[lucide--chevron-right]"
        style={{
          ...iconStyle,
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        }}
      />
      <Icon cls={open ? 'icon-[lucide--folder-open]' : 'icon-[lucide--folder]'} />
      <span style={{ fontWeight: node.highlighted ? 600 : 400 }}>{node.placeholder ? '…' : `${node.name}/`}</span>
    </button>
  )
}

function TreeNodeComponent({ node }: { node: TreeNode }) {
  const [open, setOpen] = useState(true)

  if (node.isDir) {
    return (
      <div>
        <DirRow node={node} open={open} onToggle={() => setOpen(!open)} />
        {open && node.children.length > 0 && (
          <div style={{ paddingInlineStart: '1.25rem' }}>
            {node.children.map((child, i) => (
              <TreeNodeComponent key={i} node={child} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return <FileRow node={node} />
}

/* ------------------ MAIN ------------------ */

export default function FileTree({ children }: { children: ReactNode }) {
  const nodes = parseFiles(children)

  return (
    <>
      <style>{`.ft-row:hover { background: rgba(255,255,255,0.06); }`}</style>

      <div
        style={{
          border: '1px solid #1e293b',
          padding: '0.625rem 0.5rem',
          backgroundColor: '#0f172a',
          fontSize: '0.8125rem',
          fontFamily: 'monospace',
          borderRadius: '0.5rem',
        }}
      >
        {nodes.map((node, i) => (
          <TreeNodeComponent key={i} node={node} />
        ))}
      </div>
    </>
  )
}
