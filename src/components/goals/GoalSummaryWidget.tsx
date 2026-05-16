import { useState, useEffect } from 'react'
import { Target, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import goalsService from '@/services/goals.service'
import type { GoalSummary } from '@/types/goals'
import styles from './GoalSummaryWidget.module.css'

export default function GoalSummaryWidget() {
  const [summary, setSummary] = useState<GoalSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await goalsService.getSummary()
        setSummary(data)
      } catch (err) {
        console.error('Error loading goal summary:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

  if (loading) {
    return <div className={`${styles.card} ${styles.skeleton}`} />
  }

  if (!summary || summary.total_metas === 0) return null

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Target size={18} className={styles.icon} />
          <h3 className={styles.title}>Tus Metas</h3>
        </div>
        <Link to="/app/metas" className={styles.seeAll}>
          Gestionar <ChevronRight size={14} />
        </Link>
      </div>
      
      <div className={styles.content}>
        <div className={styles.metric}>
          <span className={styles.value}>{summary.total_metas}</span>
          <span className={styles.label}>Activas</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.metric}>
          <span className={styles.value}>{summary.completadas}</span>
          <span className={styles.label}>Logradas</span>
        </div>
        {summary.proximo_vencimiento && (
          <>
            <div className={styles.divider} />
            <div className={styles.metric}>
              <span className={`${styles.value} ${styles.valueSmall}`}>
                {new Date(summary.proximo_vencimiento).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </span>
              <span className={styles.label}>Próximo hito</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
