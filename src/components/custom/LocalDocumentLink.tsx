export default function LocalDocumentLink({
  children,
  document,
  fragment = '',
}: {
  children: React.ReactNode
  document: string
  fragment?: string
}) {
  const href = `${document}${fragment ? `#${fragment}` : ''}`
  return (
    <a href={href} className="text-primary hover:underline">
      {children}
    </a>
  )
}
