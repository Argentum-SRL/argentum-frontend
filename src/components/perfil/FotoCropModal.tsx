import { useState, useRef, useEffect } from 'react'
import { Camera, X } from 'lucide-react'
import Modal from '@/components/ui/Modal/Modal'
import usuarioService from '@/services/usuario.service'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import styles from './FotoCropModal.module.css'

interface FotoCropModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (fotoUrl: string) => void
}

export default function FotoCropModal({ open, onClose, onSuccess }: FotoCropModalProps) {
  const { usuario, updateUsuario } = useAuth()
  const { showToast } = useToast()

  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [isSaving, setIsSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
    }
  }, [offset, scale, imageSrc])

  const handleClose = () => {
    setImageSrc(null)
    setOffset({ x: 0, y: 0 })
    setScale(1)
    setIsDragging(false)
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      showToast('La foto supera el límite de 5MB', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Mouse Drag Events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageSrc) return
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart.current) return
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    })
  }

  const handleMouseUp = () => {
    dragStart.current = null
    setIsDragging(false)
  }

  // Touch Drag Events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!imageSrc || e.touches.length !== 1) return
    const touch = e.touches[0]
    dragStart.current = { x: touch.clientX, y: touch.clientY, ox: offset.x, oy: offset.y }
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStart.current || e.touches.length !== 1) return
    const touch = e.touches[0]
    setOffset({
      x: dragStart.current.ox + (touch.clientX - dragStart.current.x),
      y: dragStart.current.oy + (touch.clientY - dragStart.current.y),
    })
  }

  const handleTouchEnd = () => {
    dragStart.current = null
    setIsDragging(false)
  }

  const getCroppedBlob = async () => {
    if (!imageRef.current || !imageSrc) return
    const canvas = document.createElement('canvas')
    const SIZE = 400
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = imageRef.current
    const displaySize = 280 // cropArea visual size in px
    const ratio = SIZE / displaySize

    ctx.save()
    ctx.translate(SIZE / 2, SIZE / 2)
    ctx.scale(scale, scale)
    ctx.translate(-SIZE / 2, -SIZE / 2)
    ctx.drawImage(
      img,
      (SIZE - img.naturalWidth * (displaySize / img.naturalHeight) * ratio) / 2 + offset.x * ratio,
      (SIZE - img.naturalHeight * (displaySize / img.naturalHeight) * ratio) / 2 + offset.y * ratio,
      img.naturalWidth * (displaySize / img.naturalHeight) * ratio,
      img.naturalHeight * (displaySize / img.naturalHeight) * ratio,
    )
    ctx.restore()

    canvas.toBlob(async (blob) => {
      if (!blob) return
      setIsSaving(true)
      try {
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
        const res = await usuarioService.subirFoto(file)
        if (usuario) {
          updateUsuario({ ...usuario, foto_url: res.foto_url })
        }
        onSuccess(res.foto_url)
        showToast('Foto de perfil actualizada', 'success')
        handleClose()
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } }
        showToast(error.response?.data?.detail || 'Error al subir la foto', 'error')
      } finally {
        setIsSaving(false)
      }
    }, 'image/jpeg', 0.92)
  }

  return (
    <Modal isOpen={open} onClose={handleClose} showHeader={false} noPadding ariaLabel="Ajustar foto de perfil">
      <div className={styles.slidesContainer}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h2 className={styles.headerTitle}>Ajustar foto de perfil</h2>
            <button type="button" className={styles.closeBtn} onClick={handleClose} title="Cerrar"><X size={16} /></button>
          </div>

          <div className={styles.formBody}>
            <input 
              type="file" 
              ref={fileInputRef} 
              className={styles.hiddenInput} 
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              title="Seleccionar foto de perfil"
              aria-label="Seleccionar foto de perfil"
            />

            {!imageSrc ? (
              <div className={styles.dropZone} onClick={() => fileInputRef.current?.click()}>
                <Camera size={32} className={styles.dropZoneIcon} />
                <span className={styles.dropZoneText}>Seleccioná una foto</span>
                <span className={styles.dropZoneSubtext}>JPG, PNG o WebP · Máx 5MB</span>
              </div>
            ) : (
              <div className={styles.cropWrapper}>
                <div 
                  className={`${styles.cropArea} ${isDragging ? styles.grabbing : ''}`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <img 
                    ref={imageRef}
                    src={imageSrc} 
                    alt="Ajustar avatar" 
                    className={styles.cropImage}
                    draggable={false}
                  />
                </div>

                <div className={styles.zoomRow}>
                  <span className={styles.zoomLabel}>Zoom</span>
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.01" 
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className={styles.zoomSlider}
                    title="Zoom de imagen"
                    aria-label="Zoom de imagen"
                  />
                  <span className={styles.zoomValue}>{Math.round(scale * 100)}%</span>
                </div>

                <button 
                  type="button" 
                  className={styles.changeFotoBtn}
                  onClick={() => {
                    setImageSrc(null)
                    setOffset({ x: 0, y: 0 })
                    setScale(1)
                  }}
                >
                  Cambiar foto
                </button>
              </div>
            )}
          </div>

          <div className={styles.formFooter}>
            <button type="button" className={styles.cancelBtn} onClick={handleClose}>Cancelar</button>
            <button 
              type="button" 
              className={styles.submitBtn} 
              onClick={getCroppedBlob}
              disabled={!imageSrc || isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar foto'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
