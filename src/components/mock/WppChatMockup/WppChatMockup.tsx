import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { MessageCircle, PieChart, Play, RefreshCw } from 'lucide-react'
import styles from './WppChatMockup.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────
type Msg =
  | { side: 'user' | 'bot'; kind: 'text'; text: ReactNode }
  | { side: 'user'; kind: 'audio' }

// ─── Data ─────────────────────────────────────────────────────────────────────
const BAR_HEIGHTS = [4, 8, 14, 10, 16, 6, 12, 16, 8, 10, 6, 4]

const ALL_MSGS: Msg[] = [
  { side: 'user', kind: 'audio' },
  { 
    side: 'bot', 
    kind: 'text', 
    text: (
      <>
        ¡Listo! 📝 Anoté <strong>$12.480</strong> en <strong>Supermercado</strong>. 🛒 Llevás <strong>$84.200</strong> gastados este mes. ¡Buen control! 💪
      </>
    )
  },
  { side: 'user', kind: 'text', text: 'balance?' },
  { 
    side: 'bot', 
    kind: 'text', 
    text: (
      <>
        Tu balance actual: ⚖️<br/>
        💵 <strong>$1.247.350,80</strong> en pesos.<br/>
        💵 <strong>USD $2.100</strong> en dólares.
      </>
    )
  },
]

// ─── Decorative moons ─────────────────────────────────────────────────────────
interface DecoMoonDef {
  id: string; top: string; left?: string; right?: string
  size: number; opacity: number; anim: string
}

const DECO_MOONS: DecoMoonDef[] = [
  { id: 'w1', top: '8%',  right: '8%',  size: 80,  opacity: 0.08, anim: 'float-slow 9s ease-in-out infinite' },
  { id: 'w2', top: '65%', left:  '5%',  size: 48,  opacity: 0.12, anim: 'float-medium 7s ease-in-out infinite 1.5s' },
  { id: 'w3', top: '80%', right: '12%', size: 120, opacity: 0.05, anim: 'float-slow 11s ease-in-out infinite 3s' },
  { id: 'w4', top: '25%', left:  '3%',  size: 32,  opacity: 0.15, anim: 'float-medium 8s ease-in-out infinite 0.8s' },
  { id: 'w5', top: '45%', right: '3%',  size: 64,  opacity: 0.07, anim: 'float-slow 13s ease-in-out infinite 2s' },
]

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ─── Components ───────────────────────────────────────────────────────────────
function DecoMoon({ id, top, left, right, size, opacity, anim }: DecoMoonDef) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 100 100" aria-hidden="true"
      className={styles.decoMoon}
      style={{ 
        '--top': top, 
        '--left': left, 
        '--right': right, 
        '--opacity': opacity, 
        '--anim': reducedMotion ? 'none' : anim 
      } as React.CSSProperties}
    >
      <defs>
        <mask id={`deco-${id}`}>
          <circle cx="50" cy="50" r="24" fill="white" />
          <circle cx="58" cy="50" r="19" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="24" fill="var(--silver)" mask={`url(#deco-${id})`} />
    </svg>
  )
}

function MoonIcon({ size, color = 'var(--silver)' }: { size: number; color?: string }) {
  const maskId = `m${useId().replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <mask id={maskId}>
          <circle cx="50" cy="50" r="24" fill="white" />
          <circle cx="58" cy="50" r="19" fill="black" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="24" fill={color} mask={`url(#${maskId})`} />
    </svg>
  )
}

function TypingIndicator() {
  return (
    <div className={styles.typingWrap}>
      <div className={styles.typing}>
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className={styles.typingDot}
            style={{
              '--delay': `${delay}ms`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}

function ChatBubble({ msg }: { msg: Msg }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const isUser = msg.side === 'user'

  return (
    <div
      className={`${styles.bubbleWrap} ${isUser ? styles.bubbleWrapUser : styles.bubbleWrapBot}`}
      style={{
        '--opacity': visible ? 1 : 0,
        '--translateY': visible ? '0' : '8px',
      } as React.CSSProperties}
    >
      {msg.kind === 'audio' ? (
        <div className={styles.bubbleAudio}>
          <div className={styles.playBtn}>
            <Play size={12} fill="white" color="white" />
          </div>
          <svg width="58" height="20" viewBox="0 0 58 20" className={styles.audioBars} aria-hidden="true">
            {BAR_HEIGHTS.map((h, i) => (
              <rect key={i} x={i * 5} y={(20 - h) / 2} width={3} height={h} rx={1.5} fill="#8A95A8" />
            ))}
          </svg>
          <span className={styles.audioTime}>0:04</span>
          <span className={styles.msgTime}>14:32</span>
        </div>
      ) : (
        <div className={`${styles.bubbleText} ${isUser ? styles.bubbleTextUser : ''}`}>
          <p className={styles.textMain}>{msg.text}</p>
          <p className={styles.textTime}>14:32</p>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WppChatMockup() {
  const [visibleMsgs, setVisibleMsgs] = useState(reducedMotion ? 4 : 0)
  const [typingState, setTypingState] = useState<'none' | 'bot1' | 'bot2'>('none')
  const [chatFading, setChatFading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 50)
  }, [visibleMsgs, typingState])

  useEffect(() => {
    if (reducedMotion) return

    let active = true
    const T: ReturnType<typeof setTimeout>[] = []
    const s = (fn: () => void, ms: number) => T.push(setTimeout(() => { if (active) fn() }, ms))

    function run() {
      setVisibleMsgs(0)
      setTypingState('none')
      setChatFading(false)

      s(() => setVisibleMsgs(1), 50)                                        // audio bubble
      s(() => setTypingState('bot1'), 400)                                   // typing 1
      s(() => { setTypingState('none'); setVisibleMsgs(2) }, 1000)          // bot msg 1
      s(() => setVisibleMsgs(3), 2400)                                       // "balance?"
      s(() => setTypingState('bot2'), 2600)                                  // typing 2
      s(() => { setTypingState('none'); setVisibleMsgs(4) }, 3200)          // bot msg 2
      s(() => setChatFading(true), 6200)                                     // fade out
      s(() => T.push(setTimeout(run, 50)), 6500)                             // reset + loop
    }

    run()
    return () => { active = false; T.forEach(clearTimeout) }
  }, [])

  return (
    <div className={styles.root}>
      {DECO_MOONS.map((m) => <DecoMoon key={m.id} {...m} />)}

      {/* Logo */}
      <div className={styles.logoArea}>
        <div className="flex items-center gap-3 mb-3">
          <MoonIcon size={64} />
          <span className={styles.logoText}>
            Argentum
          </span>
        </div>
        <p className={styles.logoSubtitle}>
          Tu plata, anotada por mensaje.
        </p>
      </div>

      {/* Chat card */}
      <div className={styles.chatArea}>
        <div className={styles.chatCard}>
          {/* WA header */}
          <div className={styles.waHeader}>
            <div className={styles.waAvatarWrap}>
              <MoonIcon size={20} />
            </div>
            <div>
              <p className={styles.waName}>Argentum</p>
              <p className={styles.waStatus}>en línea</p>
            </div>
          </div>

          {/* Messages */}
          <div
            className={`${styles.messages} scrollbar-none`}
            style={{
              '--chat-opacity': chatFading ? 0 : 1,
            } as React.CSSProperties}
          >
            {visibleMsgs >= 1 && <ChatBubble key="msg-0" msg={ALL_MSGS[0]} />}
            {typingState === 'bot1' && <TypingIndicator key="typing-1" />}
            {visibleMsgs >= 2 && <ChatBubble key="msg-1" msg={ALL_MSGS[1]} />}
            {visibleMsgs >= 3 && <ChatBubble key="msg-2" msg={ALL_MSGS[2]} />}
            {typingState === 'bot2' && <TypingIndicator key="typing-2" />}
            {visibleMsgs >= 4 && <ChatBubble key="msg-3" msg={ALL_MSGS[3]} />}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Bullets — lg+ only */}
      <div className={styles.bullets}>
        {[
          { Icon: MessageCircle, text: 'Registrá gastos por WhatsApp o audio' },
          { Icon: RefreshCw,    text: 'Pesos y dólares, siempre actualizados' },
          { Icon: PieChart,     text: 'Presupuestos y metas en un solo lugar' },
        ].map(({ Icon, text }) => (
          <div key={text} className={styles.bullet}>
            <Icon size={16} className={styles.bulletIcon} />
            <span className={styles.bulletText}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
