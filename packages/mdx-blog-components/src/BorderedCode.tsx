export default function BorderedCode({ children }: { children: string }) {
  return (
    <code
      style={{
        border: '1.5px solid var(--color-muted-foreground)',
        borderRadius: '0.30rem',
        padding: '0.0rem 0.3rem',
      }}
    >
      {children}
    </code>
  )
}
