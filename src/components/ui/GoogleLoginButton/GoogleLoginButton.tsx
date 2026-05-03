import { memo, useEffect } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import styles from './GoogleLoginButton.module.css'

interface GoogleLoginButtonProps {
  onSuccess: (credentialResponse: { credential: string }) => void
  onError: () => void
}

const GoogleLoginButton = memo(function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {

  return (
    <div className={styles.container}>
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
        shape="rectangular"
        width="340px"
      />
    </div>
  )
})

export default GoogleLoginButton
