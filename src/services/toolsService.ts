import api from './api';
import type { IPCData, ConvenienciaRequest, ConvenienciaResult } from '@/types/tools';

interface StandardResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export const toolsService = {
  getIPCActual: async (): Promise<IPCData> => {
    const response = await api.get<StandardResponse<IPCData>>('/api/v1/tools/ipc/current');
    return response.data.data;
  },
  
  calcularConveniencia: async (data: ConvenienciaRequest): Promise<ConvenienciaResult> => {
    const response = await api.post<StandardResponse<ConvenienciaResult>>('/api/v1/tools/installment-convenience', data);
    return response.data.data;
  }
};

export default toolsService;
