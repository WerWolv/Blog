export default function PdfDocument({
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
      <span className="icon-[lucide--file-text] size-3.5 mr-0.5"></span>
      <span>{children}</span>
    </a>
  )
}
