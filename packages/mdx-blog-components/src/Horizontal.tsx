export default function Horizontal({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  )
}
