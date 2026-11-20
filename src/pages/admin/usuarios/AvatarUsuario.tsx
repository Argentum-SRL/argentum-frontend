import React, { useState } from 'react'
import { getFotoUrl } from '@/utils/fotoUrl'
import { inicialesDe } from '@/utils/admin'
import styles from './AvatarUsuario.module.css'

interface AvatarUsuarioProps {
  fotoUrl: string | null | undefined
  nombre: string | null | undefined
  apellido: string | null | undefined
  email: string | null | undefined
  tamano: 32 | 40 | 48
}

export const AvatarUsuario: React.FC<AvatarUsuarioProps> = ({
  fotoUrl,
  nombre,
  apellido,
  email,
  tamano,
}) => {
  const src = getFotoUrl(fotoUrl)
  const [fallo, setFallo] = useState(false)
  const [prevSrc, setPrevSrc] = useState(src)

  if (src !== prevSrc) {
    setPrevSrc(src)
    setFallo(false)
  }

  const sizeCls =
    tamano === 32 ? styles.size32 : tamano === 40 ? styles.size40 : styles.size48

  if (src && !fallo) {
    return (
      <img
        key={src}
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={() => setFallo(true)}
        className={`${styles.avatar} ${sizeCls}`}
      />
    )
  }

  return (
    <span className={`${styles.avatar} ${styles.fallback} ${sizeCls}`} aria-hidden="true">
      {inicialesDe(nombre, apellido, email)}
    </span>
  )
}

export default AvatarUsuario
