import React, { useState, useRef } from 'react'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import styles from './ImportacionResumenSection.module.css'

interface UploadPdfResumenProps {
  selectedFile: File | null
  onFileSelected: (file: File | null) => void
}

export const UploadPdfResumen: React.FC<UploadPdfResumenProps> = ({
  selectedFile,
  onFileSelected,
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateAndSetFile = (file: File) => {
    setError(null)
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setError('El archivo debe ser un PDF.')
      onFileSelected(null)
      return
    }

    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size === 0) {
      setError('El archivo seleccionado está vacío.')
      onFileSelected(null)
      return
    }
    if (file.size > maxSize) {
      setError('El tamaño del archivo no puede superar los 50MB.')
      onFileSelected(null)
      return
    }

    onFileSelected(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const onButtonClick = () => {
    inputRef.current?.click()
  }

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFileSelected(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={styles.formField}>
      <label className={styles.fieldLabel}>Archivo del Resumen</label>
      
      {!selectedFile ? (
        <div
          className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
        >
          <input
            ref={inputRef}
            type="file"
            className={styles.fileInput}
            accept=".pdf"
            onChange={handleChange}
            aria-label="Subir archivo de resumen"
            title="Subir archivo de resumen"
          />
          <Upload size={32} className={styles.uploadIcon} />
          <p className={styles.uploadTitle}>
            Arrastrá y soltá tu resumen acá, o hacé clic para buscar
          </p>
          <p className={styles.uploadSubtitle}>Formatos soportados: PDF (Hasta 50MB)</p>
        </div>
      ) : (
        <div className={styles.fileSelectedCard}>
          <FileText size={28} className={styles.fileIcon} />
          <div className={styles.fileDetails}>
            <span className={styles.fileName}>{selectedFile.name}</span>
            <span className={styles.fileSize}>{formatFileSize(selectedFile.size)}</span>
          </div>
          <button
            type="button"
            className={styles.removeFileBtn}
            onClick={removeFile}
            title="Quitar archivo"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <span className={styles.errorText}>
          <AlertCircle size={14} />
          {error}
        </span>
      )}
    </div>
  )
}

export default UploadPdfResumen
