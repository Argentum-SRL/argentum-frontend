export interface PasswordRequirements {
  length: boolean
  maxLength: boolean
  upper: boolean
  lower: boolean
  number: boolean
  match: boolean
}

export const getPasswordRequirements = (password: string, confirmPassword?: string): PasswordRequirements => {
  return {
    length: password.length >= 8,
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
  if (pwd.length > 128) return 'La contraseña no puede superar los 128 caracteres.'
  if (!/[A-Z]/.test(pwd)) return 'Debe incluir al menos una mayúscula.'
  if (!/[a-z]/.test(pwd)) return 'Debe incluir al menos una minúscula.'
  if (!/[0-9]/.test(pwd)) return 'Debe incluir al menos un número.'
  return null
}

export const validatePasswordConfirmation = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return 'Confirmá tu contraseña.'
  if (confirmPassword !== password) return 'Las contraseñas no coinciden. Revisalas.'
  return null
}
