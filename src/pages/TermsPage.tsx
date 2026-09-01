import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import styles from './TermsPage.module.css'

export default function TermsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(!isLoading && isAuthenticated ? '/app/dashboard' : '/register')
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button onClick={handleBack} className={styles.backBtn} aria-label="Volver">
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>
          <h1 className={styles.headerTitle}>Legales Argentum</h1>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.card}>
          <div className={styles.navigation}>
            <a href="#seccion-1" className={styles.navLink}>1. Quién está detrás</a>
            <a href="#seccion-3" className={styles.navLink}>3. Qué datos pedimos</a>
            <a href="#seccion-5" className={styles.navLink}>5. Proveedores</a>
            <a href="#seccion-9" className={styles.navLink}>9. Tus derechos (ARCO)</a>
            <a href="#seccion-15" className={styles.navLink}>15. Contacto</a>
          </div>

          <hr className={styles.divider} />

          {/* Document Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text)' }}>
              Términos y Condiciones y Política de Privacidad — Argentum
            </h1>
            <p className={styles.meta} style={{ marginBottom: '8px' }}>
              <strong>Última actualización:</strong> 1/9/2026
            </p>
            <p style={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--text-3)', margin: 0 }}>
              Este texto es una referencia para publicar y no reemplaza asesoramiento legal profesional.
            </p>
          </div>

          <hr className={styles.divider} />

          {/* Section 1 */}
          <section id="seccion-1" className={styles.section}>
            <h2>1. Quién está detrás de Argentum</h2>
            <p>
              Argentum es una app de gestión de finanzas personales pensada para Argentina. Hoy la operamos de forma independiente, sin una sociedad constituida.
            </p>
            <p>
              Cualquier consulta sobre este documento o sobre tus datos personales: <strong>srlargentum@gmail.com</strong>
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 2 */}
          <section id="seccion-2" className={styles.section}>
            <h2>2. Aceptación</h2>
            <p>
              Al crear tu cuenta tildás una casilla aceptando este documento. Es obligatorio: no podés registrarte sin aceptarlo. Si no estás de acuerdo con algo, no uses Argentum.
            </p>
            <p>
              <strong>Edad mínima:</strong> Argentum es para mayores de 18 años. Validamos tu fecha de nacimiento al registrarte, y si sos menor, no te dejamos crear la cuenta. Si de alguna forma un menor accedió poniendo datos falsos, escribinos a <strong>srlargentum@gmail.com</strong> para borrar esa cuenta ya mismo.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 3 */}
          <section id="seccion-3" className={styles.section}>
            <h2>3. Qué datos pedimos</h2>
            
            <h3>3.1 Los que nos das vos</h3>
            <ul>
              <li>Nombre y apellido</li>
              <li>Email y contraseña (la contraseña se guarda cifrada con bcrypt, nunca en texto plano) — o, si te registrás con Google, tomamos el email, nombre, apellido y foto de esa cuenta</li>
              <li>Teléfono, si vinculás WhatsApp</li>
              <li>Fecha de nacimiento</li>
              <li>Sexo (opcional — podés elegir &quot;prefiero no decirlo&quot;)</li>
              <li>Tus datos financieros: billeteras, saldos, transacciones, tarjetas de crédito (guardamos solo los últimos 4 dígitos, nunca el número completo), metas de ahorro, presupuestos, suscripciones</li>
              <li>Foto de perfil</li>
              <li>Lo que nos mandes por WhatsApp: texto, notas de voz, fotos de comprobantes</li>
              <li>Resúmenes de tarjeta en PDF, si usás la función de importación — hoy solo está disponible para cuentas administradoras, en etapa de prueba</li>
            </ul>

            <h3>3.2 Los que generamos nosotros</h3>
            <ul>
              <li>Un perfil financiero calculado automáticamente: patrones de gasto, categorías donde más gastás, tasa de ahorro estimada, nivel de riesgo orientativo. Se recalcula solo, cada tanto.</li>
              <li>Transcripciones de tus notas de voz de WhatsApp, hechas con IA.</li>
              <li>Datos que extraemos de tus fotos de comprobantes, con IA (monto, fecha, etc.).</li>
              <li>Datos que extraemos de resúmenes de tarjeta importados: antes de mandarle el texto a la IA, borramos automáticamente tu CUIT, DNI, número de cuenta y domicilio. Es un proceso automático — no podemos garantizar que funcione perfecto en todos los formatos de resumen que existen. El nombre del titular sí se conserva, porque lo necesitamos para separar bien los gastos cuando la tarjeta tiene más de un usuario.</li>
            </ul>

            <h3>3.3 Datos técnicos</h3>
            <p>
              No guardamos tu dirección IP en ninguna tabla de nuestra base de datos. Se usa un instante en memoria para frenar abusos (como demasiados intentos de login seguidos) y no queda registrada en ningún lado — salvo un caso puntual: si te avisamos por email que detectamos un inicio de sesión desde un dispositivo nuevo, ese email sí incluye la IP de ese momento. También quedan logs técnicos del servidor (qué ruta se pidió, cuánto tardó) por unos días, para poder diagnosticar errores.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 4 */}
          <section id="seccion-4" className={styles.section}>
            <h2>4. Para qué usamos tus datos</h2>
            <ul>
              <li>Crear y manejar tu cuenta</li>
              <li>Que la app funcione: transacciones, presupuestos, metas, alertas de vencimientos de cuotas y suscripciones</li>
              <li>Mandarte notificaciones — hoy te llegan por la campana dentro de la app en tiempo real, por WhatsApp, o por email cuando es algo de seguridad de tu cuenta (cambio de contraseña, verificación, dispositivo nuevo)</li>
              <li>Procesar tus mensajes de WhatsApp con IA para ayudarte a registrar transacciones</li>
              <li>Calcular tu perfil financiero y darte información orientativa sobre tus hábitos</li>
              <li>Mejorar y corregir la app</li>
              <li>Cumplir obligaciones legales</li>
            </ul>
            <p>
              No usamos tus datos financieros para venderte nada de terceros, ni los compartimos con fines publicitarios.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 5 */}
          <section id="seccion-5" className={styles.section}>
            <h2>5. Con quién compartimos tus datos</h2>
            <p>
              Para poder darte el servicio, parte de tus datos pasa por estos proveedores:
            </p>

            <div style={{ overflowX: 'auto', margin: '20px 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '10px', color: 'var(--text)', fontWeight: '600' }}>Proveedor</th>
                    <th style={{ padding: '10px', color: 'var(--text)', fontWeight: '600' }}>Para qué lo usamos</th>
                    <th style={{ padding: '10px', color: 'var(--text)', fontWeight: '600' }}>Qué le llega</th>
                    <th style={{ padding: '10px', color: 'var(--text)', fontWeight: '600' }}>Dónde procesa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontWeight: '600' }}>Supabase</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Base de datos de la app</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Todos tus datos de cuenta y financieros</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Brasil (San Pablo)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontWeight: '600' }}>OpenAI</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Interpretar tus mensajes de WhatsApp, transcribir audios, leer fotos de comprobantes, ayudar a leer resúmenes de tarjeta importados</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Mensajes de texto, notas de voz, fotos de comprobantes (con tu nombre reducido, ej. &quot;Juan P.&quot;), contexto financiero resumido, y texto de resúmenes ya sin CUIT/DNI/cuenta/domicilio</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Estados Unidos</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontWeight: '600' }}>Meta (WhatsApp Cloud API)</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Mandar y recibir tus mensajes de WhatsApp</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Tu teléfono y el contenido de esos mensajes</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Estados Unidos</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontWeight: '600' }}>Google</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Iniciar sesión con tu cuenta de Google</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Email, nombre, apellido y foto de tu cuenta de Google</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Estados Unidos</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontWeight: '600' }}>Resend</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Mandar los emails (verificación, recuperación de contraseña, alertas de seguridad)</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Tu email, tu nombre, y en alertas de seguridad: fecha/hora y algún dato del dispositivo o IP</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Estados Unidos</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontWeight: '600' }}>Railway</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Alojar y correr el backend de Argentum</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Todo lo que procesa el backend pasa por sus servidores mientras se ejecuta cada pedido; solo quedan logs técnicos efímeros por unos días</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Estados Unidos</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontWeight: '600' }}>Cloudflare</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Entregar la aplicación web (frontend)</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>IP y metadatos técnicos de tu conexión, para poder mostrarte la app</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Red global de Cloudflare, con mecanismos para transferir a Estados Unidos</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              <strong>Sobre la transferencia internacional:</strong> al aceptar este documento, autorizás que estos datos salgan de Argentina hacia Brasil y Estados Unidos, según el proveedor — es necesario para que funcionen las partes de IA, mensajería y hosting de la Plataforma.
            </p>

            <p>
              <strong>Cuánto tiempo retienen tus datos estos proveedores</strong> (según sus políticas oficiales al momento de escribir esto — pueden cambiar, conviene revisarlas antes de publicar):
            </p>
            <ul>
              <li>
                <strong>Meta:</strong> guarda los mensajes de WhatsApp un máximo de 30 días en sus sistemas, y no los usa para decidir qué publicidad te muestra.
              </li>
              <li>
                <strong>OpenAI:</strong> por defecto guarda lo que le mandamos hasta 30 días para control de abuso, y no lo usa para entrenar sus modelos.
              </li>
              <li>
                <strong>Resend:</strong> mientras la cuenta de Argentum esté activa en Resend, guarda los datos de envío hasta 30 días; si en algún momento dejamos de usar el servicio, borra el resto dentro de los 90 días siguientes.
              </li>
              <li>
                <strong>Supabase:</strong> mientras tu cuenta de Argentum esté activa, porque ahí vive toda la base de datos operativa.
              </li>
            </ul>

            <p>
              Nunca vendemos tus datos a terceros, ni los compartimos con fines de publicidad ajena a Argentum.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 6 */}
          <section id="seccion-6" className={styles.section}>
            <h2>6. Cómo usamos la Inteligencia Artificial</h2>
            <p>Usamos modelos de OpenAI para:</p>
            <ul>
              <li>Interpretar tus mensajes de WhatsApp y ayudarte a registrar transacciones conversando</li>
              <li>Transcribir tus notas de voz</li>
              <li>Leer fotos de comprobantes y transferencias para sacar montos y otros datos</li>
              <li>Ayudar a procesar resúmenes de tarjeta importados (función en prueba, solo para administradores)</li>
            </ul>

            <p>
              <strong>Minimización:</strong> cuando analizamos una foto de un comprobante, le mandamos a la IA tu nombre reducido (nombre + inicial del apellido) en vez del nombre completo. Cuando procesamos un resumen de tarjeta, antes le sacamos el CUIT, DNI, número de cuenta y domicilio.
            </p>
            <p>
              Como usamos OpenAI por API (distinto de usar ChatGPT gratis directamente), no usan tus datos para entrenar sus modelos.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 7 */}
          <section id="seccion-7" className={styles.section}>
            <h2>7. Función de WhatsApp</h2>
            <p>
              Tus mensajes de texto y las transcripciones de tus notas de voz se guardan en nuestra base para que la conversación tenga contexto (por ejemplo, para acordarnos de qué veníamos hablando hace unos minutos). Hoy no hay un límite de tiempo definido para esto — se borran si eliminás tu cuenta.
            </p>
            <p>
              Podés desvincular tu WhatsApp cuando quieras desde tu perfil.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 8 */}
          <section id="seccion-8" className={styles.section}>
            <h2>8. Importación de resúmenes de tarjeta (PDF)</h2>
            <p>
              Esta función hoy es solo para cuentas administradoras, en etapa de prueba.
            </p>
            <ul>
              <li>El PDF se procesa en el momento y no se guarda en ningún lado — ni el archivo original ni una copia.</li>
              <li>Las transacciones que salen de ahí sí quedan guardadas, como cualquier otra transacción tuya.</li>
              <li>Antes de mandarle el texto a la IA, sacamos automáticamente tu CUIT, DNI, número de cuenta y domicilio. Es automático y basado en patrones de texto, así que no podemos asegurar que funcione perfecto en todos los formatos de resumen bancario que existen.</li>
              <li>Si el resumen incluye tarjetas adicionales de otro titular, podés elegir de quién importar los gastos antes de confirmar.</li>
            </ul>
          </section>

          <hr className={styles.divider} />

          {/* Section 9 */}
          <section id="seccion-9" className={styles.section}>
            <h2>9. Tus derechos sobre tus datos (Derechos ARCO)</h2>
            <p>
              Bajo la Ley 25.326, en cualquier momento y gratis tenés derecho a:
            </p>
            <ul>
              <li><strong>Acceso:</strong> pedirnos una copia de los datos que tenemos sobre vos.</li>
              <li><strong>Rectificación:</strong> corregir datos mal cargados o desactualizados. La mayoría los podés cambiar vos mismo desde tu perfil en la app.</li>
              <li><strong>Cancelación (borrar todo):</strong> pedir que eliminemos tu cuenta y tus datos. Lo podés hacer vos mismo desde la configuración de tu cuenta, o escribiéndonos a <strong>srlargentum@gmail.com</strong>. Al borrar tu cuenta se borra todo de una, sin vuelta atrás: transacciones, billeteras, tarjetas, cuotas, metas, presupuestos, suscripciones, conversaciones de WhatsApp, resúmenes importados, notificaciones, categorías propias que hayas creado, foto de perfil y el resto de tu información.</li>
              <li><strong>Oposición:</strong> oponerte a que usemos tus datos para algo puntual, cuando corresponda.</li>
            </ul>

            <p>
              Para ejercer cualquiera de estos derechos, escribinos a <strong>srlargentum@gmail.com</strong>. Respondemos dentro de los plazos que marca la ley (hoy: 10 días hábiles para acceso, 5 días hábiles para rectificación o borrado).
            </p>
            <p>
              Si sentís que no te respondimos bien, podés hacer una denuncia ante la AAIP (Agencia de Acceso a la Información Pública), el organismo que controla esto en Argentina: <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer">www.argentina.gob.ar/aaip</a>
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 10 */}
          <section id="seccion-10" className={styles.section}>
            <h2>10. Seguridad</h2>
            <ul>
              <li>Tu contraseña se guarda cifrada con bcrypt, nunca en texto plano.</li>
              <li>Todo viaja cifrado entre tu dispositivo y nuestros servidores (HTTPS).</li>
              <li>Las sesiones se manejan con tokens que vencen solos y se pueden revocar en cualquier momento.</li>
            </ul>
            <p>
              Ningún sistema es 100% infalible. Si detectamos un incidente de seguridad que te afecte, te lo vamos a avisar.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 11 */}
          <section id="seccion-11" className={styles.section}>
            <h2>11. Cuánto tiempo guardamos tus datos</h2>
            <ul>
              <li>Cuenta y datos financieros: mientras tu cuenta esté activa.</li>
              <li>Conversaciones de WhatsApp: sin límite definido por ahora, hasta que borres tu cuenta.</li>
              <li>Códigos de verificación: minutos — se descartan solos.</li>
              <li>Sesiones vencidas: se limpian cada 6 horas.</li>
            </ul>
          </section>

          <hr className={styles.divider} />

          {/* Section 12 */}
          <section id="seccion-12" className={styles.section}>
            <h2>12. Cookies y almacenamiento local</h2>
            <p>
              No usamos cookies de terceros con fines de publicidad ni de rastreo. Lo único que guardamos en tu navegador son preferencias visuales — cosas como si preferís el tema claro u oscuro, o cómo te gusta ver tus tablas — nunca tus saldos, transacciones ni ningún dato financiero, que siempre se piden en el momento a nuestros servidores.
            </p>
            <p>
              Argentum tiene funciones técnicas de app instalable (PWA), pero verificamos específicamente que ningún dato personal ni financiero se guarda en tu dispositivo para uso offline.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 13 */}
          <section id="seccion-13" className={styles.section}>
            <h2>13. Menores de edad</h2>
            <p>
              Argentum no es para menores de 18. Lo validamos al registrarte. Si nos enteramos de que un menor entró con datos falsos, le borramos la cuenta.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 14 */}
          <section id="seccion-14" className={styles.section}>
            <h2>14. Cambios a este documento</h2>
            <p>
              Podemos actualizarlo. Si el cambio es importante, te avisamos por email o dentro de la app antes de que entre en vigencia.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 15 */}
          <section id="seccion-15" className={styles.section}>
            <h2>15. Contacto</h2>
            <p>
              <strong>srlargentum@gmail.com</strong>
            </p>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© 2026 Argentum. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
