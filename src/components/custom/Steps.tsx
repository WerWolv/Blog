export default function Steps({ children, document, fragment = '' }: { children: React.ReactNode; document: string; fragment?: string }) {
  const href = `${document}${fragment ? `#${fragment}` : ''}`

  const style = `
    @layer components {
        .steps-container > * {
            position: relative;
        }
        .steps-container > * > *:first-child {
            margin-top: 0;
        }
        .steps-container > *::before {
            content: "";
            position: absolute;
            left: -30px;
            top: 18px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: var(--color-indigo-500, #6366f1);
            box-shadow: 0 0 0 6px var(--color-white, #ffffff);
            z-index: 10;
        }
        .dark .steps-container > *::before {
            box-shadow: 0 0 0 6px var(--color-neutral-950, #0a0a0a);
        }
    }
  `

  return (
    <>
      <style>{style}</style>
      <div className={'my-8 ml-4 border-l-2 border-neutral-200 dark:border-neutral-800 pl-6 space-y-8 relative steps-container'}>
        {children}
      </div>
    </>
  )
}
