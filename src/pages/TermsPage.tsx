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
            <a href="#aviso" className={styles.navLink}>Aviso Importante</a>
            <a href="#terminos" className={styles.navLink}>Términos y Condiciones</a>
            <a href="#politica" className={styles.navLink}>Política de Privacidad</a>
          </div>

          <hr className={styles.divider} />

          {/* Document Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text)' }}>
              Términos y Condiciones y Política de Privacidad — Argentum
            </h1>
            <p className={styles.meta}>
              <strong>Última actualización:</strong> [completar fecha de publicación]<br />
              <strong>Versión del documento:</strong> 1.0 — Borrador basado en auditoría técnica del código fuente (julio 2026)
            </p>
          </div>

          {/* Section: Aviso Importante */}
          <section id="aviso" className={styles.section} style={{ background: 'var(--error-bg)', border: '1px solid var(--error)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
            <h2 style={{ color: 'var(--error)', fontSize: '1.25rem', marginTop: 0, marginBottom: '12px' }}>AVISO IMPORTANTE — LEER ANTES DE PUBLICAR</h2>
            <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Este documento fue redactado en base a una auditoría técnica real del código de Argentum y al marco de la Ley N° 25.326 de Protección de Datos Personales de Argentina, vigente al momento de redacción. No reemplaza el asesoramiento de un abogado. Antes de publicar esta versión o cualquier variante de ella:
            </p>
            <ol style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: '1.6', marginTop: '12px', marginBottom: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>Un abogado especializado en protección de datos y derecho del consumidor debe revisarlo.</li>
              <li style={{ marginBottom: '8px' }}>Hay que completar los espacios marcados como [completar].</li>
              <li style={{ marginBottom: '8px' }}>Hay que registrar la base de datos de Argentum ante la AAIP (Agencia de Acceso a la Información Pública) si corresponde según el volumen y tipo de datos tratados.</li>
              <li style={{ marginBottom: 0 }}>Argentina tiene proyectos de reforma de la Ley 25.326 en trámite parlamentario (no vigentes aún). Conviene revisar el estado de esa reforma antes de publicar, por si ya se sancionó.</li>
            </ol>
          </section>

          <hr className={styles.divider} />

          {/* Section 1 */}
          <section id="seccion-1" className={styles.section}>
            <h2>1. Quiénes somos</h2>
            <p>
              Argentum es una aplicación de gestión de finanzas personales operada por [completar razón social / nombre del responsable — persona física o jurídica; al momento de redacción de este documento, Argentum opera sin una persona jurídica constituida], con domicilio en [completar], Argentina, en adelante "Argentum", "nosotros" o "la Plataforma".
            </p>
            <p>
              Argentum es responsable del tratamiento de los datos personales que se describen en este documento, en los términos del artículo 1° de la Ley 25.326.
            </p>
            <p>
              Contacto para consultas sobre privacidad y datos personales: <strong>srlargentum@gmail.com</strong>
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 2 */}
          <section id="seccion-2" className={styles.section}>
            <h2>2. Aceptación de estos Términos</h2>
            <p>
              Al crear una cuenta en Argentum, tildás una casilla de aceptación explícita de este documento. Esa aceptación es una condición necesaria para poder usar la Plataforma — no podés crear una cuenta sin aceptarla.
            </p>
            <p>
              Si no estás de acuerdo con alguna parte de este documento, no debés registrarte ni usar Argentum.
            </p>
            <p>
              <strong>Edad mínima:</strong> Argentum está destinado exclusivamente a personas mayores de 18 años. El sistema valida la fecha de nacimiento provista en el proceso de alta y rechaza el registro de menores de edad. Si tenías menos de 18 años y de todas formas accediste a la Plataforma proveyendo datos falsos, pedimos que nos contactes a <strong>srlargentum@gmail.com</strong> para eliminar tu cuenta de inmediato.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 3 */}
          <section id="seccion-3" className={styles.section}>
            <h2>3. Qué datos recolectamos</h2>
            
            <h3>3.1 Datos que nos das directamente</h3>
            <p><strong>Al registrarte:</strong></p>
            <ul>
              <li>Nombre y apellido</li>
              <li>Email (si te registrás con email/contraseña) o los datos de tu cuenta de Google (email, nombre, foto de perfil) si te registrás con Google</li>
              <li>Número de teléfono (si vinculás WhatsApp)</li>
              <li>Fecha de nacimiento (usada, entre otras cosas, para verificar que sos mayor de edad)</li>
              <li>Sexo (opcional)</li>
              <li>Contraseña (la almacenamos cifrada con un algoritmo de hash seguro — bcrypt —, nunca en texto plano)</li>
            </ul>

            <p><strong>Al usar la app:</strong></p>
            <ul>
              <li>Datos financieros que vos cargás: billeteras, saldos, transacciones (monto, fecha, descripción, categoría), tarjetas de crédito (guardamos solo los últimos 4 dígitos, nunca el número completo), metas de ahorro, presupuestos, suscripciones recurrentes</li>
              <li>Fotos de perfil que subas</li>
              <li>Mensajes de texto, notas de voz e imágenes de comprobantes que nos envíes por WhatsApp, si usás esa función</li>
              <li>Resúmenes de tarjeta de crédito en PDF que subas a través de la función de importación de resúmenes (disponible actualmente solo para administradores durante la etapa de prueba de esta función)</li>
            </ul>

            <h3>3.2 Datos que generamos u obtenemos indirectamente</h3>
            <ul>
              <li><strong>Perfil financiero calculado:</strong> analizamos tus transacciones para calcular automáticamente patrones de gasto, categorías de mayor consumo, tasa de ahorro estimada y un nivel de riesgo financiero orientativo. Este análisis es automático y se recalcula periódicamente.</li>
              <li><strong>Transcripciones de audio:</strong> si nos mandás una nota de voz por WhatsApp, la transcribimos automáticamente usando un servicio de inteligencia artificial (ver sección 5) para poder registrar tu transacción.</li>
              <li><strong>Datos extraídos de comprobantes:</strong> si nos mandás una foto de un comprobante o transferencia, usamos inteligencia artificial para extraer el monto, la fecha y otros datos relevantes.</li>
              <li><strong>Datos extraídos de resúmenes de tarjeta:</strong> si un administrador importa tu resumen de tarjeta (función en etapa de prueba), el sistema extrae automáticamente tus transacciones, y en algunos casos usa inteligencia artificial para eso. Antes de enviar el texto del resumen a ese servicio de IA, eliminamos de forma automática datos como tu CUIT, DNI, número de cuenta y domicilio — pero esta eliminación es automática y no garantizamos que sea 100% efectiva en todos los formatos de resumen posibles. Los nombres de titulares de la tarjeta sí se conservan, porque son necesarios para poder separar correctamente los gastos cuando la tarjeta tiene más de un titular o usuario adicional.</li>
            </ul>

            <h3>3.3 Datos técnicos</h3>
            <ul>
              <li>Dirección IP, tipo de dispositivo y navegador (recolectados de forma estándar por cualquier aplicación web)</li>
              <li>Tokens de sesión (para mantenerte identificado mientras usás la app)</li>
            </ul>
          </section>

          <hr className={styles.divider} />

          {/* Section 4 */}
          <section id="seccion-4" className={styles.section}>
            <h2>4. Para qué usamos tus datos</h2>
            <p>Usamos tus datos personales exclusivamente para:</p>
            <ul>
              <li>Crear y gestionar tu cuenta</li>
              <li>Brindarte las funcionalidades de la app: registro de transacciones, seguimiento de presupuestos, metas de ahorro, alertas de vencimientos de cuotas y suscripciones</li>
              <li>Enviarte notificaciones que vos configurás (por WhatsApp, email, o dentro de la app)</li>
              <li>Procesar tus mensajes de WhatsApp cuando usás esa función, incluyendo el uso de inteligencia artificial para interpretar tus mensajes y registrar transacciones automáticamente</li>
              <li>Calcular tu perfil financiero y ofrecerte información orientativa sobre tus hábitos de consumo</li>
              <li>Mejorar y corregir el funcionamiento de la Plataforma</li>
              <li>Cumplir obligaciones legales</li>
            </ul>
            <p>
              No usamos tus datos financieros para venderte productos de terceros, ni compartimos tu información con fines publicitarios.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 5 */}
          <section id="seccion-5" className={styles.section}>
            <h2>5. Con quién compartimos tus datos</h2>
            <p>
              Para poder ofrecerte el servicio, algunos de tus datos se procesan a través de proveedores externos ("encargados de tratamiento" en los términos de la Ley 25.326). Estos son los que usamos actualmente:
            </p>

            <div style={{ overflowX: 'auto', margin: '20px 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '10px', color: 'var(--text)', fontWeight: '600' }}>Proveedor</th>
                    <th style={{ padding: '10px', color: 'var(--text)', fontWeight: '600' }}>Para qué lo usamos</th>
                    <th style={{ padding: '10px', color: 'var(--text)', fontWeight: '600' }}>Qué datos recibe</th>
                    <th style={{ padding: '10px', color: 'var(--text)', fontWeight: '600' }}>País donde procesa datos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontWeight: '500' }}>Supabase</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Alojar la base de datos de la aplicación</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Todos tus datos personales y financieros</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Brasil (San Pablo — región sa-east-1, América del Sur)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontWeight: '500' }}>OpenAI</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Interpretar tus mensajes de WhatsApp, transcribir notas de voz, analizar fotos de comprobantes, y ayudar a procesar resúmenes de tarjeta importados</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Mensajes de texto, transcripciones de audio, imágenes de comprobantes, contexto financiero resumido (billeteras, categorías, metas, presupuestos), y en el caso de comprobantes, tu nombre de forma minimizada (ej. "Juan P." en vez de tu nombre completo)</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Estados Unidos</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontWeight: '500' }}>Twilio</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Gestionar el envío y recepción de mensajes de WhatsApp</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Tu número de teléfono y el contenido de los mensajes que intercambiás con el bot de Argentum</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Estados Unidos</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontWeight: '500' }}>Google</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Permitirte iniciar sesión con tu cuenta de Google</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Tu email, nombre y foto de perfil de Google (solo si elegís este método de registro)</td>
                    <td style={{ padding: '10px', color: 'var(--text-2)' }}>Estados Unidos</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              <strong>Sobre la transferencia internacional de datos:</strong> algunos de estos proveedores procesan datos fuera de Argentina, principalmente en Estados Unidos. Esto constituye una transferencia internacional de datos personales en los términos del artículo 12 de la Ley 25.326. Al aceptar estos Términos, autorizás expresamente esta transferencia, que es necesaria para el funcionamiento de las funcionalidades de inteligencia artificial y mensajería de la Plataforma. Nuestra base de datos principal, en cambio, está alojada en Brasil (Supabase, región de San Pablo), dentro de América del Sur.
            </p>

            <p>
              <strong>Política de retención de estos proveedores</strong> (verificada en las políticas oficiales vigentes al momento de redacción de este documento — pueden cambiar, revisar los enlaces directamente antes de publicar):
            </p>
            <ul>
              <li>
                <strong>OpenAI:</strong> los datos enviados vía API (que es como Argentum se conecta a OpenAI, no la versión de consumo masivo ChatGPT) se retienen hasta 30 días con fines de monitoreo de abuso, y después se eliminan. No se usan para entrenar sus modelos por defecto. Más información: <a href="https://openai.com/enterprise-privacy" target="_blank" rel="noopener noreferrer">https://openai.com/enterprise-privacy</a>
              </li>
              <li>
                <strong>Twilio:</strong> los registros de mensajes se conservan por defecto hasta 13 meses en los sistemas de Twilio. Para los mensajes de WhatsApp específicamente, el contenido del mensaje se elimina en cuanto se confirma la entrega al destinatario; sin embargo, WhatsApp (Meta) retiene los números de teléfono de forma indefinida en sus propios sistemas, fuera del control de Twilio. Más información: <a href="https://help.twilio.com/articles/4410585868443" target="_blank" rel="noopener noreferrer">https://help.twilio.com/articles/4410585868443</a>
              </li>
              <li>
                <strong>Supabase:</strong> tus datos se conservan mientras tu cuenta esté activa en Argentum, dado que es la base de datos operativa principal de la aplicación (no un servicio de logs con expiración automática).
              </li>
            </ul>

            <p>
              Nunca vendemos tus datos personales a terceros, ni los compartimos con fines de publicidad o marketing de terceros ajenos a Argentum.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 6 */}
          <section id="seccion-6" className={styles.section}>
            <h2>6. Inteligencia artificial: cómo la usamos</h2>
            <p>Argentum usa modelos de inteligencia artificial de OpenAI para varias funciones:</p>
            <ul>
              <li>Interpretar tus mensajes de WhatsApp y ayudarte a registrar transacciones conversacionalmente</li>
              <li>Transcribir tus notas de voz</li>
              <li>Analizar fotos de comprobantes y transferencias para extraer montos y otros datos automáticamente</li>
              <li>Procesar resúmenes de tarjeta de crédito subidos por administradores (función en etapa de prueba)</li>
            </ul>

            <p>
              <strong>Minimización de datos:</strong> nos esforzamos por enviarle a estos servicios de IA solo la información estrictamente necesaria para cada tarea. Por ejemplo, cuando analizamos una foto de un comprobante, usamos una versión reducida de tu nombre (solo tu primer nombre y la inicial de tu apellido) en vez de tu nombre completo.
            </p>
            <p>
              Los proveedores de IA no usan tus datos para entrenar sus modelos, según la política vigente de OpenAI para uso vía API (distinta de sus productos de consumo masivo como ChatGPT gratuito). Podés consultar la política oficial y actualizada de OpenAI en <a href="https://openai.com/enterprise-privacy" target="_blank" rel="noopener noreferrer">https://openai.com/enterprise-privacy</a>.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 7 */}
          <section id="seccion-7" className={styles.section}>
            <h2>7. Función de WhatsApp</h2>
            <ul>
              <li>Los mensajes de texto y las transcripciones de tus notas de voz se guardan en nuestra base de datos para que la conversación tenga contexto y podamos ofrecerte una mejor experiencia (por ejemplo, recordar de qué estábamos hablando hace unos minutos).</li>
              <li>Actualmente, estos mensajes y transcripciones se conservan sin un límite de tiempo definido, salvo que elimines tu cuenta, en cuyo caso se eliminan junto con el resto de tus datos.</li>
              <li>Podés desvincular tu WhatsApp en cualquier momento desde la configuración de tu cuenta.</li>
            </ul>
          </section>

          <hr className={styles.divider} />

          {/* Section 8 */}
          <section id="seccion-8" className={styles.section}>
            <h2>8. Función de importación de resúmenes de tarjeta</h2>
            <p>
              Esta función permite subir un PDF de tu resumen de tarjeta de crédito para cargar tus transacciones automáticamente. Actualmente está disponible solo para usuarios administradores, en etapa de prueba.
            </p>
            <p>Cosas importantes que tenés que saber sobre esta función:</p>
            <ul>
              <li>El archivo PDF se procesa en el momento y no se guarda en nuestros servidores — ni el archivo original ni una copia.</li>
              <li>El nombre del archivo que subiste sí queda registrado (por ejemplo, "resumen_visa_mayo.pdf"), pero no su contenido binario.</li>
              <li>Las transacciones extraídas del PDF sí se guardan, como cualquier otra transacción tuya.</li>
              <li>Para algunos bancos, el procesamiento usa inteligencia artificial (ver sección 6), y antes de mandarle el texto del resumen a ese servicio, eliminamos automáticamente datos como tu CUIT, DNI, número de cuenta y domicilio. Esta eliminación es automática y basada en patrones de texto — no podemos garantizar que sea 100% efectiva en todos los casos, dado que los formatos de resumen bancario varían.</li>
              <li>Si tu resumen incluye tarjetas adicionales con otros titulares (por ejemplo, una tarjeta familiar), el sistema te permite elegir de quién importar los gastos antes de confirmar.</li>
            </ul>
          </section>

          <hr className={styles.divider} />

          {/* Section 9 */}
          <section id="seccion-9" className={styles.section}>
            <h2>9. Tus derechos sobre tus datos (Derechos ARCO)</h2>
            <p>
              Bajo la Ley 25.326, tenés los siguientes derechos sobre tus datos personales, en cualquier momento y de forma gratuita:
            </p>
            <ul>
              <li><strong>Acceso:</strong> pedir una copia de los datos personales que tenemos sobre vos.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o desactualizados. Podés hacerlo directamente desde tu perfil en la app para la mayoría de tus datos.</li>
              <li><strong>Cancelación (supresión):</strong> pedir que eliminemos tu cuenta y tus datos personales. Podés hacerlo directamente desde la configuración de tu cuenta, o escribiéndonos a <strong>srlargentum@gmail.com</strong>. Al eliminar tu cuenta, borramos: tus transacciones, billeteras, tarjetas, metas, presupuestos, suscripciones, conversaciones de WhatsApp, resúmenes importados, foto de perfil, y el resto de tu información personal.</li>
              <li><strong>Oposición:</strong> oponerte a un tratamiento específico de tus datos, cuando corresponda.</li>
            </ul>

            <p>
              Para ejercer cualquiera de estos derechos, escribinos a <strong>srlargentum@gmail.com</strong>. Vamos a responder tu solicitud dentro de los plazos que establece la ley (actualmente, 10 días hábiles para acceso y 5 días hábiles para rectificación o supresión, según el artículo 14 y 16 de la Ley 25.326).
            </p>
            <p>
              Si considerás que no respondimos adecuadamente a tu solicitud, podés hacer una denuncia ante la Agencia de Acceso a la Información Pública (AAIP), autoridad de control en materia de protección de datos personales en Argentina: <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer">www.argentina.gob.ar/aaip</a>.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 10 */}
          <section id="seccion-10" className={styles.section}>
            <h2>10. Seguridad de tus datos</h2>
            <p>Tomamos medidas técnicas para proteger tu información:</p>
            <ul>
              <li>Tu contraseña se guarda cifrada (nunca en texto plano), usando el algoritmo bcrypt.</li>
              <li>Las comunicaciones entre tu dispositivo y nuestros servidores viajan cifradas (HTTPS).</li>
              <li>Los tokens que usamos para mantener tu sesión iniciada tienen tiempos de expiración cortos y se pueden revocar en cualquier momento.</li>
            </ul>
            <p>
              A pesar de estas medidas, ningún sistema es 100% infalible. Si detectamos un incidente de seguridad que afecte tus datos personales, te lo vamos a informar según lo requiera la normativa vigente.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 11 */}
          <section id="seccion-11" className={styles.section}>
            <h2>11. Retención de datos</h2>
            <p>Conservamos tus datos personales mientras tu cuenta esté activa. Algunos datos específicos tienen reglas particulares:</p>
            <ul>
              <li>Datos de tu cuenta y transacciones: mientras tu cuenta esté activa</li>
              <li>Conversaciones de WhatsApp (mensajes y transcripciones): sin límite definido actualmente, hasta que elimines tu cuenta</li>
              <li>Códigos de verificación (email, WhatsApp): minutos (se descartan automáticamente tras su uso o vencimiento)</li>
              <li>Tokens de sesión vencidos: se eliminan automáticamente cada 6 horas</li>
            </ul>
          </section>

          <hr className={styles.divider} />

          {/* Section 12 */}
          <section id="seccion-12" className={styles.section}>
            <h2>12. Uso de cookies y almacenamiento local</h2>
            <p>
              Argentum usa el almacenamiento del navegador para mantener tu sesión iniciada. No usamos cookies de terceros con fines publicitarios ni de rastreo.
            </p>
            <p>
              <strong>Sobre la funcionalidad offline (PWA):</strong> Argentum tiene capacidades técnicas de aplicación web progresiva, pero verificamos específicamente que ningún dato personal, financiero o transaccional se almacena en tu dispositivo para uso offline. Todo lo que se guarda localmente son archivos de la interfaz de la aplicación (el código de la app, imágenes, íconos) — nunca tus saldos, transacciones, ni ningún dato tuyo, que siempre se piden en tiempo real a nuestros servidores.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 13 */}
          <section id="seccion-13" className={styles.section}>
            <h2>13. Menores de edad</h2>
            <p>
              Argentum no está destinado a menores de 18 años. Validamos la edad en el proceso de registro. Si tomamos conocimiento de que un menor de edad creó una cuenta proveyendo datos falsos, la vamos a eliminar.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 14 */}
          <section id="seccion-14" className={styles.section}>
            <h2>14. Cambios a este documento</h2>
            <p>
              Podemos actualizar estos Términos y esta Política de Privacidad en el futuro. Si hacemos cambios importantes, te vamos a avisar por email o dentro de la app antes de que entren en vigencia.
            </p>
          </section>

          <hr className={styles.divider} />

          {/* Section 15 */}
          <section id="seccion-15" className={styles.section}>
            <h2>15. Contacto</h2>
            <p>
              Para cualquier consulta sobre este documento o sobre el tratamiento de tus datos personales, escribinos a: <strong>srlargentum@gmail.com</strong>
            </p>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Argentum. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
