import { useEffect, useRef, useState } from 'react'

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function Video({ src, title, width }: { src: string; title: string; width?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showVolume, setShowVolume] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play()
      setPlaying(true)
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  return (
    <figure className="my-6 flex flex-col items-center">
      <div ref={containerRef} className="group relative overflow-hidden rounded-sm shadow-lg" style={{ width: width ?? '100%' }}>
        <video
          ref={videoRef}
          className={`block w-full !my-0${fullscreen ? ' h-full object-contain' : ''}`}
          onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
          onEnded={() => setPlaying(false)}
          onClick={togglePlay}
        >
          <source src={src} type="video/mp4" />
        </video>

        {/* Controls overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-3 pt-8 pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Progress bar */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.01}
            value={currentTime}
            onChange={(e) => {
              const v = videoRef.current
              if (!v) return
              v.currentTime = Number(e.target.value)
              setCurrentTime(Number(e.target.value))
            }}
            className="w-full h-1 accent-white cursor-pointer mb-2"
          />

          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-white/80 transition-colors shrink-0"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <span className="icon-[lucide--pause] size-5 block" /> : <span className="icon-[lucide--play] size-5 block" />}
            </button>

            {/* Time */}
            <span className="text-white/80 text-xs tabular-nums shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Volume */}
            <div
              className="relative flex items-center gap-2"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              {showVolume && (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    const v = videoRef.current
                    if (!v) return
                    const val = Number(e.target.value)
                    v.volume = val
                    v.muted = val === 0
                    setVolume(val)
                    setMuted(val === 0)
                  }}
                  className="w-20 h-1 accent-white cursor-pointer"
                />
              )}
              <button
                onClick={toggleMute}
                className="text-white hover:text-white/80 transition-colors shrink-0"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted || volume === 0 ? (
                  <span className="icon-[lucide--volume-x] size-5 block" />
                ) : volume < 0.5 ? (
                  <span className="icon-[lucide--volume-1] size-5 block" />
                ) : (
                  <span className="icon-[lucide--volume-2] size-5 block" />
                )}
              </button>
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-white/80 transition-colors shrink-0"
              aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {fullscreen ? (
                <span className="icon-[lucide--minimize] size-5 block" />
              ) : (
                <span className="icon-[lucide--maximize] size-5 block" />
              )}
            </button>
          </div>
        </div>

        {/* Centre play button when paused */}
        {!playing && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center text-white/90 hover:text-white transition-colors"
            aria-label="Play"
          >
            <span className="icon-[lucide--play] size-16 drop-shadow-lg block" />
          </button>
        )}
      </div>

      {title && <figcaption className="text-center text-sm text-muted-foreground mt-2">{title}</figcaption>}
    </figure>
  )
}
