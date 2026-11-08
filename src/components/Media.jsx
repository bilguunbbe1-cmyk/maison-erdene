import { useEffect, useRef, useState } from 'react'

// An image that switches to `fallback` if `src` is missing or broken.
// The fallback artwork is square, so it is shown whole instead of cropped.
// `focus` is the CSS object-position of the part of the photo to keep when cropped.
export function FallbackImage({ src, fallback, focus, alt = '', className = '', ...rest }) {
  const [current, setCurrent] = useState(src || fallback)

  useEffect(() => setCurrent(src || fallback), [src, fallback])

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      style={current === fallback ? { objectFit: 'contain' } : { objectPosition: focus }}
      onError={() => {
        if (fallback && current !== fallback) setCurrent(fallback)
      }}
      {...rest}
    />
  )
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// A silent looping background video, like a fashion campaign film.
// It falls back to the poster image when the video is missing, fails to load,
// or the visitor has asked their device to reduce motion.
export function CampaignVideo({ media, className = '' }) {
  const [failed, setFailed] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return undefined
    // The error can happen before React's own handler is attached, so check
    // for it directly as well as listening for it.
    const fail = () => setFailed(true)
    if (video.error) fail()
    video.addEventListener('error', fail)
    // Browsers only autoplay muted video. React does not always set the muted
    // attribute, so set the property and start playback by hand.
    video.muted = true
    video.play().catch(() => {})
    return () => video.removeEventListener('error', fail)
  }, [])

  if (failed || prefersReducedMotion()) {
    return <FallbackImage src={media.poster} fallback={media.fallback} alt={media.label} className={className} />
  }

  return (
    <video
      ref={ref}
      className={className}
      src={media.video}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={media.label}
    />
  )
}
