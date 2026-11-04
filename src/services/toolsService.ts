import api from './api';
import type { IPCData, ConvenienciaRequest, ConvenienciaResult, FinancialContext, CanAffordRequest, CanAffordResult, InflacionEsperadaData } from '@/types/tools';

interface StandardResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export const toolsService = {
  getInflacionEsperada: async (): Promise<InflacionEsperadaData | null> => {
    const response = await api.get<StandardResponse<InflacionEsperadaData | null>>('/api/v1/tools/inflacion-esperada');
    return response.data.data;
  },

  getIPCActual: async (): Promise<IPCData> => {
    const response = await api.get<StandardResponse<IPCData>>('/api/v1/tools/ipc/current');
    return response.data.data;
  },
  
  calcularConveniencia: async (data: ConvenienciaRequest): Promise<ConvenienciaResult> => {
    const response = await api.post<StandardResponse<ConvenienciaResult>>('/api/v1/tools/installment-convenience', data);
    return response.data.data;
  },

  getFinancialContext: async (): Promise<FinancialContext> => {
    const response = await api.get<StandardResponse<FinancialContext>>('/api/v1/tools/financial-context');
    return response.data.data;
  },
  
  calculateCanAfford: async (data: CanAffordRequest): Promise<CanAffordResult> => {
    const response = await api.post<StandardResponse<CanAffordResult>>('/api/v1/tools/can-afford', data);
    return response.data.data;
  }
};

export default toolsService;

