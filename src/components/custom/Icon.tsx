export default function Icon({ iconPack, name, size = 4 }: { iconPack: string; name: string; size?: number }) {
  return <span className={`icon-[${iconPack}--${name}] size-${size}`}></span>
}
