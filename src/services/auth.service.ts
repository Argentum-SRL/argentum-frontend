import api from '../lib/axios'

export interface OkResponse {
  ok: boolean
}

export async function enviarCodigoWhatsapp(telefono: string): Promise<OkResponse> {
  const { data } = await api.post<OkResponse>('/auth/enviar-codigo-whatsapp', {
    telefono: telefono.trim(),
  })
  return data
}

export async function verificarCodigo(telefono: string, codigo: string): Promise<OkResponse> {
  const { data } = await api.post<OkResponse>('/auth/verificar-codigo', {
    telefono: telefono.trim(),
    codigo: codigo.trim(),
  })
  return data
}

export async function eliminarCuenta(): Promise<void> {
  await api.delete('/auth/me')
}
