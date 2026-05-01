import { createContext } from 'react'
import type { FinancialContextType } from '../types/financial'

export const FinancialContext = createContext<FinancialContextType | undefined>(undefined)
