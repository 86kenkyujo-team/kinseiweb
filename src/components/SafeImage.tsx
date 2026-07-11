'use client'

import { CSSProperties, useState } from 'react'

type SafeImageProps = {
  alt: string
  className?: string
  fallbackText: string
  src: string
  style?: CSSProperties
}

export function SafeImage({ alt, className, fallbackText, src, style }: SafeImageProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <span className="safe-image-fallback" role="img" aria-label={`${alt}（画像を表示できません）`}>
        {fallbackText}
      </span>
    )
  }

  return <img alt={alt} className={className} onError={() => setHasError(true)} src={src} style={style} />
}
