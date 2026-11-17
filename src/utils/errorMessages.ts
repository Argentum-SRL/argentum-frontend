import { problemasTextoWeb } from "./reglasTextoWeb";

/**
 * Diccionario de mapeo: mensajes de error técnicos del backend -> mensajes para el usuario.
 * Usar siempre getErrorMessage() en lugar de mostrar error?.response?.data?.detail crudo.
 */

const FALLBACK_POR_DEFECTO = "Algo salió mal. Probá de nuevo.";

export const ERROR_MAP: Record<string, string> = {
  // Validaciones automáticas en inglés (Pydantic)
  "Input should be greater than 0": "El monto tiene que ser mayor a 0.",
  "Decimal input should have no more than 2 decimal places":
    "El monto no puede tener más de 2 decimales.",
  "Decimal input should have no more than 15 digits in total":
    "El monto ingresado es demasiado grande.",
  "Field required": "Falta completar un dato.",

  // HTTP genéricos — fallback por código de status
  "Internal Server Error":
    "Algo salió mal. Probá de nuevo en unos minutos.",
  "Not Found": "No se encontró lo que buscabas.",
  "Unauthorized": "Necesitás iniciar sesión para continuar.",
  "Forbidden": "No tenés permiso para hacer eso.",
  "Unprocessable Entity":
    "Hay datos con errores. Revisalos y probá de nuevo.",
  "Bad Request": "Hay algo incorrecto en los datos que enviaste.",
};

function resolverSiCumple(texto: string, fallback: string): string {
  return problemasTextoWeb(texto).length === 0 ? texto : fallback;
}

/**
 * Extrae un mensaje legible para el usuario a partir de un error de Axios/API.
 * Usa ERROR_MAP y valida con problemasTextoWeb antes de mostrarlo; si no cumple,
 * devuelve el fallback.
 *
 * @param error - El error capturado en el catch
 * @param fallback - Mensaje por defecto si no hay match o no cumple las reglas
 */
export function getErrorMessage(
  error: unknown,
  fallback = FALLBACK_POR_DEFECTO
): string {
  if (!error) return fallback;

  const axiosError = error as {
    response?: {
      data?: {
        detail?: unknown;
        error?: { message?: string; code?: string };
        message?: string;
      };
      status?: number;
    };
  };
  const data = axiosError?.response?.data;

  // 1. Verificar data.error.message (estándar de Starlette/FastAPI handler del proyecto)
  if (data?.error?.message && typeof data.error.message === "string") {
    const resuelto = ERROR_MAP[data.error.message] ?? data.error.message;
    return resolverSiCumple(resuelto, fallback);
  }

  // 2. Verificar data.message
  if (data?.message && typeof data.message === "string") {
    const resuelto = ERROR_MAP[data.message] ?? data.message;
    return resolverSiCumple(resuelto, fallback);
  }

  const detail = data?.detail;

  // 3. detail como string
  if (typeof detail === "string") {
    if (!detail) return fallback;
    const resuelto = ERROR_MAP[detail] ?? detail;
    return resolverSiCumple(resuelto, fallback);
  }

  // 4. detail como objeto con mensaje anidado { error: { message: ... } } o { message: ... }
  if (typeof detail === "object" && detail !== null && !Array.isArray(detail)) {
    const obj = detail as Record<string, unknown>;
    const nestedError = obj.error as Record<string, unknown> | undefined;
    const msg = (nestedError?.message || obj.message || obj.detail) as string | undefined;
    if (typeof msg === "string" && msg) {
      const resuelto = ERROR_MAP[msg] ?? msg;
      return resolverSiCumple(resuelto, fallback);
    }
  }

  // 5. Pydantic v2 devuelve array de {loc, msg, type}
  if (Array.isArray(detail) && detail.length > 0) {
    const firstMsg = detail[0]?.msg;
    if (typeof firstMsg === "string") {
      const cleanMsg = firstMsg.startsWith("Value error, ")
        ? firstMsg.replace("Value error, ", "")
        : firstMsg;
      const resuelto = ERROR_MAP[cleanMsg] ?? cleanMsg;
      return resolverSiCumple(resuelto, fallback);
    }
  }

  // Fallback por status code HTTP
  const status = axiosError?.response?.status;
  if (status === 401) return ERROR_MAP["Unauthorized"];
  if (status === 403) return ERROR_MAP["Forbidden"];
  if (status === 404) return ERROR_MAP["Not Found"];
  if (status === 422) return ERROR_MAP["Unprocessable Entity"];
  if (status && status >= 500) return ERROR_MAP["Internal Server Error"];

  return fallback;
}
