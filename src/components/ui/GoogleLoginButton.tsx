import { memo } from 'react'
import { GoogleLogin } from '@react-oauth/google'

interface GoogleLoginButtonProps {
  onSuccess: (credentialResponse: { credential: string }) => void
  onError: () => void
}

const GoogleLoginButton = memo(function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        if (credentialResponse.credential) {
          onSuccess({ credential: credentialResponse.credential })
        }
      }}
      onError={onError}
    />
  )
})

export default GoogleLoginButton
