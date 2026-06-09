import { memo, useEffect, useRef, useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import styles from './GoogleLoginButton.module.css'

interface GoogleLoginButtonProps {
  onSuccess: (credentialResponse: { credential: string }) => void
  onError: () => void
}

const GoogleLoginButton = memo(function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [buttonWidth, setButtonWidth] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Initial measurement
    const initialWidth = containerRef.current.getBoundingClientRect().width
    if (initialWidth > 0) {
      const clampedWidth = Math.min(400, Math.max(200, Math.round(initialWidth)))
      setButtonWidth(`${clampedWidth}px`)
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Clamp width between 200px and 400px (Google API constraints)
        const w = Math.min(400, Math.max(200, Math.round(entry.contentRect.width)))
        const nextWidth = `${w}px`
        setButtonWidth((prev) => (prev === nextWidth ? prev : nextWidth))
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={styles.container}>
      {buttonWidth && (
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              onSuccess({ credential: credentialResponse.credential })
            } else {
              onError()
            }
          }}
          onError={() => {
            console.error('[Auth][Google] Error en el componente GoogleLogin')
            onError()
          }}
          theme="outline"
          size="large"
          shape="pill"
          width={buttonWidth}
        />
      )}
    </div>
  )
})

export default GoogleLoginButton
