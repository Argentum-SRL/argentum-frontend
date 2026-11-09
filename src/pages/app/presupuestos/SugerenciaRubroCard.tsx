import { Button } from '@/components/ui'
import { SubcategoriaIcon } from '@/components/ui/SubcategoriaIcon'
import type { SugerenciaRubro } from '@/types'
import styles from './SugerenciaRubroCard.module.css'

interface SugerenciaRubroCardProps {
  sugerencia: SugerenciaRubro
  onArmar: () => void
}

export default function SugerenciaRubroCard({
  sugerencia,
  onArmar
}: SugerenciaRubroCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.avatar}>
          <SubcategoriaIcon nombre={null} parentCategory={sugerencia.categoria} size={20} />
        </div>
        <div className={styles.textGroup}>
          <h3 className={styles.title}>{sugerencia.titulo}</h3>
          <p className={styles.texto}>{sugerencia.texto}</p>
        </div>
      </div>
      <Button
        variant="secondary"
        className={styles.actionBtn}
        onClick={onArmar}
      >
        Armar uno
      </Button>
    </div>
  )
}

