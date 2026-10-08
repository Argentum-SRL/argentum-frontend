import type { MotionSignature } from '../core/types';

export interface SignatureMetadata {
  signature: MotionSignature;
  category: 'Directional' | 'Mechanical' | 'Physical' | 'Optical' | 'Drawing' | 'Reveal' | 'State-change' | 'Feedback';
  description: string;
}

export const MOTION_SIGNATURES: Record<MotionSignature, SignatureMetadata> = {
  'directional-flow': {
    signature: 'directional-flow',
    category: 'Directional',
    description: 'Trayectoria bidireccional continua de flechas o flujos de capital.',
  },
  'optical-sweep': {
    signature: 'optical-sweep',
    category: 'Optical',
    description: 'Barrido focal elíptico simulando inspección o búsqueda visual.',
  },
  'pendulum': {
    signature: 'pendulum',
    category: 'Physical',
    description: 'Oscilación pendular desde pivote superior con desfase armónico.',
  },
  'lid-open': {
    signature: 'lid-open',
    category: 'Mechanical',
    description: 'Apertura angular de tapa superior manteniendo base inerte.',
  },
  'document-slide': {
    signature: 'document-slide',
    category: 'Physical',
    description: 'Desplazamiento en profundidad de hoja frontal respecto a base.',
  },
  'path-draw': {
    signature: 'path-draw',
    category: 'Drawing',
    description: 'Trazado secuencial de vector SVG mediante pathLength.',
  },
  'pencil-sketch': {
    signature: 'pencil-sketch',
    category: 'Drawing',
    description: 'Micro-trazo diagonal con inclinación y retroceso de mina.',
  },
  'gear-rotate': {
    signature: 'gear-rotate',
    category: 'Mechanical',
    description: 'Rotación con enganche mecánico de engranajes a 60°/120°.',
  },
  'wallet-clasp': {
    signature: 'wallet-clasp',
    category: 'Physical',
    description: 'Flexión elástica de broche / solapa de billetera.',
  },
  'card-glide': {
    signature: 'card-glide',
    category: 'Physical',
    description: 'Deslizamiento horizontal con ligera inclinación de tarjeta.',
  },
  'iris-blink': {
    signature: 'iris-blink',
    category: 'Optical',
    description: 'Contracción de iris y parpadeo reactivo de párpado.',
  },
  'ring-focus': {
    signature: 'ring-focus',
    category: 'Optical',
    description: 'Pulso concéntrico escalonado de anillos hacia centro focal.',
  },
  'trend-flow': {
    signature: 'trend-flow',
    category: 'Drawing',
    description: 'Trazado ascendente/descendente de curva vectorial con empuje de flecha.',
  },
  'calendar-flip': {
    signature: 'calendar-flip',
    category: 'Physical',
    description: 'Vibración de anillos superiores y elevación de hoja de fecha.',
  },
  'clock-tick': {
    signature: 'clock-tick',
    category: 'Mechanical',
    description: 'Rotación desfasada de agujas horaria y minutero.',
  },
  'sync-spin': {
    signature: 'sync-spin',
    category: 'Directional',
    description: 'Rotación orbital sincronizada de flechas con desaceleración elástica.',
  },
  'filter-slide': {
    signature: 'filter-slide',
    category: 'Mechanical',
    description: 'Desplazamiento horizontal alternado de cursores en rieles.',
  },
  'shackle-unlock': {
    signature: 'shackle-unlock',
    category: 'Mechanical',
    description: 'Elevación y rotación angular de grillete de candado.',
  },
  'star-sparkle': {
    signature: 'star-sparkle',
    category: 'Optical',
    description: 'Rotación sutil y destello de puntas con pulso de escala.',
  },
  'sun-burst': {
    signature: 'sun-burst',
    category: 'Optical',
    description: 'Pulso radial expansivo de rayos solares con centro estable.',
  },
  'moon-tilt': {
    signature: 'moon-tilt',
    category: 'Physical',
    description: 'Oscilación sutil del arco lunar con fulgor volumétrico.',
  },
  'alert-bounce': {
    signature: 'alert-bounce',
    category: 'Feedback',
    description: 'Rebote de alerta con acento en punto de exclamación.',
  },
  'info-nod': {
    signature: 'info-nod',
    category: 'Feedback',
    description: 'Salto vertical del punto de información y retorno elástico.',
  },
  'disk-click': {
    signature: 'disk-click',
    category: 'Mechanical',
    description: 'Deslizamiento de persiana magnética de almacenamiento.',
  },
  'trophy-lift': {
    signature: 'trophy-lift',
    category: 'Feedback',
    description: 'Elevación de copa con reflejo de logro.',
  },
  'bill-float': {
    signature: 'bill-float',
    category: 'Physical',
    description: 'Ondulación suave de billete y pulso de emblema central.',
  },
  'globe-spin': {
    signature: 'globe-spin',
    category: 'Directional',
    description: 'Desplazamiento horizontal de meridianos en esfera terrestre.',
  },
  'envelope-open': {
    signature: 'envelope-open',
    category: 'Reveal',
    description: 'Apertura de solapa superior y asomo de tarjeta postal.',
  },
  'stagger-wave': {
    signature: 'stagger-wave',
    category: 'Directional',
    description: 'Onda progresiva en cascada a través de nodos de puntos.',
  },
  'shutter-snap': {
    signature: 'shutter-snap',
    category: 'Mechanical',
    description: 'Contracción instantánea de diafragma y flash óptico.',
  },
  'paper-feed': {
    signature: 'paper-feed',
    category: 'Mechanical',
    description: 'Alimentación milimétrica hacia abajo de ticket o recibo.',
  },
  'tray-drop': {
    signature: 'tray-drop',
    category: 'Directional',
    description: 'Ingreso elástico de flecha hacia bandeja receptora.',
  },
  'arrow-launch': {
    signature: 'arrow-launch',
    category: 'Directional',
    description: 'Eyección vertical de flecha hacia el exterior de bandeja.',
  },
  'arrow-thrust': {
    signature: 'arrow-thrust',
    category: 'Directional',
    description: 'Retroceso preparatorio y empuje frontal de flecha.',
  },
  'directional-nudge': {
    signature: 'directional-nudge',
    category: 'Directional',
    description: 'Micro-impulso reactivo en el sentido de la guía chevron.',
  },
  'cross-rotate': {
    signature: 'cross-rotate',
    category: 'State-change',
    description: 'Rotación angular de aspas con contracción y expansión.',
  },
  'avatar-nod': {
    signature: 'avatar-nod',
    category: 'Physical',
    description: 'Reclinación sutil de cabeza sobre hombros en saludo.',
  },
  'exit-door': {
    signature: 'exit-door',
    category: 'Reveal',
    description: 'Apertura de vano de puerta y desplazamiento de flecha.',
  },
  'smooth-spin': {
    signature: 'smooth-spin',
    category: 'Directional',
    description: 'Giro circular continuo e ininterrumpido a velocidad constante.',
  },
};
