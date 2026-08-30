/**
 * Diccionario de mapeo: mensajes de error del backend → mensajes para el usuario.
 * Usar siempre getErrorMessage() en lugar de mostrar error?.response?.data?.detail crudo.
 */

export const ERROR_MAP: Record<string, string> = {
  // Autenticación
  "El enlace que usaste ya no es válido. Pedí uno nuevo.": "El enlace que usaste ya no es válido. Pedí uno nuevo.",
  "Token inválido o expirado": "El enlace que usaste ya no es válido. Pedí uno nuevo.",
  "Token de verificación inválido": "Este enlace de verificación no es válido. Revisá tu email y usá el más reciente.",
  "Token de reset inválido o expirado": "El enlace para cambiar tu contraseña expiró. Podés pedir uno nuevo desde el inicio de sesión.",
  "Usuario no encontrado": "No encontramos una cuenta con esos datos.",
  "Credenciales incorrectas": "El email o la contraseña no son correctos. Revisalos e intentá de nuevo.",
  "Email ya registrado": "Ya existe una cuenta con ese email.",
  "Usuario no verificado": "Todavía no verificaste tu cuenta. Revisá tu email para activarla.",
  "Cuenta suspendida": "Tu cuenta está suspendida. Contactanos si creés que es un error.",
  "No autenticado": "Necesitás iniciar sesión para continuar.",
  "Sin permisos suficientes": "No tenés permiso para hacer eso.",
  "Contraseña incorrecta": "La contraseña actual no es correcta.",
  "Error al enviar email": "No pudimos enviarte el email. Intentá de nuevo en unos minutos.",
  "Código de verificación inválido": "El código que ingresaste no es válido. Revisalo o pedí uno nuevo.",
  "Código expirado": "El código ya expiró. Pedí uno nuevo.",
  "Teléfono ya verificado": "Tu número ya está verificado.",
  "Error al enviar SMS": "No pudimos mandarte el código por WhatsApp. Intentá de nuevo.",

  // Transacciones
  "No encontramos esa transacción.": "No encontramos esa transacción.",
  "Transacción no encontrada": "No encontramos esa transacción.",
  "Sin permisos para esta transacción": "No tenés permiso para modificar esa transacción.",
  "No se puede editar una transacción de transferencia": "Las transferencias se editan desde el módulo de billeteras.",
  "No se puede eliminar una transacción confirmada": "No podés eliminar una transacción que ya fue confirmada.",
  "Debe proporcionar info_cuotas si es padre de cuotas": "Para registrar una compra en cuotas, completá los datos de las cuotas.",
  "Monto debe ser positivo": "El monto tiene que ser mayor a cero.",
  "Billetera no encontrada": "No encontramos esa billetera.",
  "Billetera no pertenece al usuario": "No tenés permiso para usar esa billetera.",
  "Categoría no encontrada": "No encontramos esa categoría.",

  // Billeteras
  "No encontramos esa billetera.": "No encontramos esa billetera.",
  "No tienes permiso para acceder a esta billetera": "No tenés permiso para acceder a esa billetera.",
  "No puedes eliminar la billetera principal": "No podés eliminar tu billetera principal.",
  "Billetera con saldo no puede eliminarse": "Para eliminar una billetera tiene que tener saldo en cero.",
  "Nombre de billetera ya existe": "Ya tenés una billetera con ese nombre. Elegí otro.",
  "El nombre de la billetera no puede estar vacío.": "El nombre de la billetera no puede estar vacío.",
  "No podés cambiar la moneda de una billetera que ya tiene transacciones o transferencias asociadas.": "No podés cambiar la moneda de una billetera que ya tiene transacciones o transferencias asociadas.",
  "Las billeteras de efectivo (ARS/USD) no pueden eliminarse": "Las billeteras de efectivo no pueden eliminarse.",
  "No se puede eliminar la billetera porque tiene transacciones asociadas. Por favor, archivala para mantener el historial.": "No podés eliminar una billetera con transacciones asociadas. Te sugerimos archivarla.",
  "No se puede eliminar la billetera porque tiene transferencias internas asociadas. Por favor, archivala.": "No podés eliminar una billetera con transferencias asociadas. Te sugerimos archivarla.",
  "No se puede eliminar la billetera porque tiene suscripciones activas asociadas. Por favor, archivala o cancelá las suscripciones.": "No podés eliminar una billetera con suscripciones activas asociadas.",

  // Tarjetas
  "Tarjeta no encontrada": "No encontramos esa tarjeta.",
  "No tienes permiso para acceder a esta tarjeta": "No tenés permiso para acceder a esa tarjeta.",
  "Tarjeta con ese nombre ya existe": "Ya tenés una tarjeta con ese nombre. Elegí otro.",
  "Límite de crédito debe ser positivo": "El límite de crédito tiene que ser mayor a cero.",
  "No se puede eliminar tarjeta con cuotas activas": "No podés eliminar una tarjeta que tiene cuotas activas. Cancelalas primero.",
  "Día de cierre inválido": "El día de cierre tiene que estar entre 1 y 31.",
  "Día de vencimiento inválido": "El día de vencimiento tiene que estar entre 1 y 31.",

  // Cuotas
  "Grupo de cuotas no encontrado": "No encontramos ese grupo de cuotas.",
  "Cuota no encontrada": "No encontramos esa cuota.",
  "Cuota ya pagada": "Esa cuota ya estaba marcada como pagada.",
  "No se puede cancelar cuota ya pagada": "No podés cancelar una cuota que ya fue pagada.",

  // Transferencias
  "El monto de la transferencia debe ser mayor a cero.": "El monto de la transferencia tiene que ser mayor a cero.",
  "La billetera de origen y destino no pueden ser la misma.": "La billetera de origen y destino no pueden ser la misma.",
  "No puedes transferir a la misma billetera": "La billetera de origen y destino no pueden ser la misma.",
  "No encontramos la billetera de origen.": "No encontramos la billetera de origen.",
  "No encontramos la billetera de destino.": "No encontramos la billetera de destino.",
  "No se permiten transferencias entre billeteras de distinta moneda.": "No se permiten transferencias entre billeteras de distinta moneda.",
  "Transferencia no encontrada": "No encontramos esa transferencia.",
  "Saldo insuficiente": "No tenés saldo suficiente en esa billetera para hacer la transferencia.",
  "Monto de transferencia debe ser positivo": "El monto de la transferencia tiene que ser mayor a cero.",
  "Billetera origen no encontrada": "No encontramos la billetera de origen.",
  "Billetera destino no encontrada": "No encontramos la billetera de destino.",

  // Presupuestos
  "No encontramos ese presupuesto.": "No encontramos ese presupuesto.",
  "Presupuesto no encontrado": "No encontramos ese presupuesto.",
  "Sin permiso para este presupuesto": "No tenés permiso para modificar ese presupuesto.",
  "Monto límite debe ser positivo": "El límite del presupuesto tiene que ser mayor a cero.",
  "El monto límite debe ser mayor a cero": "El límite del presupuesto tiene que ser mayor a cero.",
  "El monto no puede tener más de 2 decimales": "El monto no puede tener más de 2 decimales.",
  "Ya tenés un presupuesto activo o pausado con ese nombre": "Ya tenés un presupuesto activo o pausado con ese nombre.",
  "Ya existe un presupuesto activo para esta categoría": "Ya tenés un presupuesto activo para esa categoría.",
  "Debe seleccionar al menos una categoría": "Tenés que seleccionar al menos una categoría.",
  "Los presupuestos solo pueden asociarse a categorías de egreso": "Los presupuestos solo pueden crearse sobre categorías de gasto.",
  "La subcategoría seleccionada no pertenece a la categoría indicada": "La subcategoría seleccionada no pertenece a la categoría indicada.",
  "El nombre del presupuesto no puede estar vacío": "Escribí un nombre para el presupuesto.",
  "El nombre no puede superar los 100 caracteres": "El nombre no puede tener más de 100 caracteres.",
  "Periodo inválido": "El periodo seleccionado no es válido.",
  "Tipo de renovación inválido": "El tipo de renovación no es válido.",
  "Moneda inválida": "La moneda seleccionada no es válida.",

  // Metas
  "Meta no encontrada": "No encontramos esa meta.",
  "Sin permiso para esta meta": "No tenés permiso para modificar esa meta.",
  "Monto objetivo debe ser positivo": "El monto objetivo tiene que ser mayor a cero.",
  "Meta ya completada": "Esa meta ya está completada.",

  // Suscripciones
  "Suscripción no encontrada": "No encontramos esa suscripción.",
  "Sin permiso para esta suscripción": "No tenés permiso para modificar esa suscripción.",

  // Onboarding
  "Onboarding ya completado": "Tu cuenta ya está configurada.",
  "Valor de sexo no es valido": "El género seleccionado no es válido.",

  // Admin
  "No puedes suspender tu propia cuenta": "No podés suspender tu propia cuenta.",
  "El usuario ya está en ese estado": "El usuario ya tiene ese estado.",

  // HTTP genéricos — fallback por código de status
  "Internal Server Error": "Algo salió mal de nuestro lado. Intentá de nuevo en unos minutos.",
  "Not Found": "No encontramos lo que buscabas.",
  "Unauthorized": "Necesitás iniciar sesión para continuar.",
  "Forbidden": "No tenés permiso para hacer eso.",
  "Unprocessable Entity": "Hay campos con errores. Revisá los datos e intentá de nuevo.",
  "Bad Request": "Hay algo incorrecto en los datos que enviaste.",
};

/**
 * Extrae un mensaje legible para el usuario a partir de un error de Axios/API.
 * Usa el diccionario ERROR_MAP. Si no hay match, devuelve el fallback.
 *
 * @param error - El error capturado en el catch
 * @param fallback - Mensaje por defecto si no hay match
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Algo salió mal. Intentá de nuevo."
): string {
  if (!error) return fallback;

  // Error de Axios con respuesta del backend
  const axiosError = error as { response?: { data?: { detail?: unknown }; status?: number } };
  const detail = axiosError?.response?.data?.detail;

  // detail puede ser string o array de objetos (Pydantic ValidationError)
  if (typeof detail === "string") {
    return ERROR_MAP[detail] ?? detail ?? fallback;
  }

  // detail puede ser un objeto con mensaje anidado { error: { message: ... } } o { message: ... }
  if (typeof detail === "object" && detail !== null && !Array.isArray(detail)) {
    const obj = detail as Record<string, unknown>;
    const nestedError = obj.error as Record<string, unknown> | undefined;
    const msg = (nestedError?.message || obj.message || obj.detail) as string | undefined;
    if (typeof msg === "string") {
      return ERROR_MAP[msg] ?? msg;
    }
  }

  // Pydantic v2 devuelve array de {loc, msg, type}
  if (Array.isArray(detail) && detail.length > 0) {
    const firstMsg = detail[0]?.msg;
    if (typeof firstMsg === "string") {
      return ERROR_MAP[firstMsg] ?? "Hay campos con errores. Revisá los datos e intentá de nuevo.";
    }
  }

  // Fallback por status code HTTP
  const status = axiosError?.response?.status;
  if (status === 401) return "Necesitás iniciar sesión para continuar.";
  if (status === 403) return "No tenés permiso para hacer eso.";
  if (status === 404) return "No encontramos lo que buscabas.";
  if (status === 422) return "Hay campos con errores. Revisá los datos e intentá de nuevo.";
  if (status && status >= 500) return "Algo salió mal de nuestro lado. Intentá de nuevo en unos minutos.";

  return fallback;
}
