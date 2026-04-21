import React from 'react'

interface SpoilerProps {
  children: React.ReactNode
  blur?: number
}

export const Spoiler: React.FC<SpoilerProps> = ({ children, blur = 6 }) => {
  return (
    <>
      <style>{spoilerStyles}</style>
      <span
        style={{
          display: 'inline-block',
          filter: `blur(${blur}px)`,
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          backgroundClip: 'padding-box',
        }}
        className="spoiler"
        data-blur={blur}
      >
        {children}
      </span>
    </>
  )
}

const spoilerStyles = `
  .spoiler:hover {
    filter: blur(0px) !important;
  }
`

export default Spoiler
