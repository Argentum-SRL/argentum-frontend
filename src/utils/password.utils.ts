export interface PasswordRequirements {
  length: boolean
  maxBytes: boolean
  maxLength: boolean
  upper: boolean
  lower: boolean
  number: boolean
  match: boolean
}

export const getUtf8ByteLength = (value: string): number => {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length
  }
  return value.length
}

export const getPasswordRequirements = (password: string, confirmPassword?: string): PasswordRequirements => {
  return {
    length: password.length >= 8,
    maxBytes: getUtf8ByteLength(password) <= 72,
    maxLength: password.length <= 128,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    match: confirmPassword !== undefined ? password.length > 0 && password === confirmPassword : true,
  }
}

export const validatePassword = (pwd: string): string | null => {
  if (!pwd) return 'Creá una contraseña.'
  if (pwd.length < 8) return 'La contraseña tiene que tener al menos 8 caracteres.'
  if (getUtf8ByteLength(pwd) > 72) return 'La contraseña es demasiado larga. Probá con una más corta.'
  if (pwd.length > 128) return 'La contraseña no puede superar los 128 caracteres.'
  if (!/[A-Z]/.test(pwd)) return 'Tiene que incluir al menos una mayúscula.'
  if (!/[a-z]/.test(pwd)) return 'Tiene que incluir al menos una minúscula.'
  if (!/[0-9]/.test(pwd)) return 'Tiene que incluir al menos un número.'
  return null
}

export const getPasswordMissingError = (pwd: string): string | null => {
  if (!pwd) return 'Creá una contraseña.'
  if (getUtf8ByteLength(pwd) > 72) return 'La contraseña es demasiado larga. Probá con una más corta.'
  if (pwd.length > 128) return 'La contraseña no puede superar los 128 caracteres.'

  const reqs = getPasswordRequirements(pwd)
  const faltantes: string[] = []
  if (!reqs.length) faltantes.push('al menos 8 caracteres')
  if (!reqs.upper) faltantes.push('una mayúscula')
  if (!reqs.lower) faltantes.push('una minúscula')
  if (!reqs.number) faltantes.push('un número')

  if (faltantes.length === 0) return null
  if (faltantes.length === 1) return `Tiene que tener ${faltantes[0]}.`

  const ult = faltantes.pop()
  return `Tiene que tener ${faltantes.join(', ')} y ${ult}.`
}

export const validatePasswordConfirmation = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return 'Confirmá tu contraseña.'
  if (confirmPassword !== password) return 'Las contraseñas no coinciden. Revisalas.'
  return null
}
