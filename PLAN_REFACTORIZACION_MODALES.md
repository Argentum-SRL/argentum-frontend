# 🎯 PLAN COMPLETO: REFACTORIZACIÓN CENTRALIZADA DE MODALES

## 📋 ÍNDICE
1. [Problema Identificado](#problema)
2. [Solución](#solución)
3. [Arquitectura](#arquitectura)
4. [Archivos a Crear](#crear)
5. [Archivos a Modificar](#modificar)
6. [Paso a Paso Implementación](#implementación)
7. [Testing](#testing)

---

## PROBLEMA

**Estado actual (CAÓTICO):**
- `BankPickerModal` → usa `useReducer` con `modalReducer` local
- `EditBilleteraModal` → usa `useReducer` con `editReducer` local
- `TransaccionModal` → usa `useReducer` con `formReducer` local
- `RecurrentesPage` → 6 `useState` diferentes
- `PerfilPage` → 8 `useState` para modales
- `DashboardPage` → `isProyeccionModalOpen` local
- `ProyeccionCard` → `modalOpen` local
- Algunos usan `window.confirm()` en lugar de `ConfirmModal`

**Problemas específicos:**
- Duplicación de lógica abrir/cerrar
- No hay forma de que un modal abra otro modal fácilmente
- Estado esparcido hace difícil debuggear
- Difícil agregar nuevos modales
- Inconsistencia en patrones

---

## SOLUCIÓN

**Sistema centralizado con:**
1. `ModalContext` - maneja estado de TODOS los modales
2. `useModal` hook - para abrir/cerrar desde cualquier lado
3. `ModalProvider` - envuelve la app
4. `ModalPortal` - renderiza todos los modales registrados

**Ventajas:**
- ✅ Un lugar para gobernarlos a todos
- ✅ Reutilizable: agregar modal nuevo = 5 líneas
- ✅ Sin prop drilling
- ✅ Fácil debuggear
- ✅ Modales pueden controlar otros modales

---

## ARQUITECTURA

```
App
├── ModalProvider (envuelve todo)
│   ├── ModalContext (estado global)
│   ├── ModalPortal (renderiza modales)
│   │   ├── BankPickerModal
│   │   ├── EditBilleteraModal
│   │   ├── TransaccionModal
│   │   ├── ConfirmModal
│   │   └── ...
│   └── El resto de componentes
└── Todos pueden llamar useModal() para abrir/cerrar
```

---

## ARCHIVOS A CREAR

### 1. `src/context/ModalContext.tsx`

```typescript
import React, { createContext, useCallback, useState, ReactNode } from 'react'

export interface ModalData {
  [key: string]: any
}

interface OpenModalOptions {
  data?: ModalData
  onClose?: () => void
}

interface ModalState {
  isOpen: boolean
  data?: ModalData
  onClose?: () => void
}

interface ModalContextType {
  // Estado de modales
  modals: Record<string, ModalState>
  
  // Abrir un modal
  openModal: (modalId: string, options?: OpenModalOptions) => void
  
  // Cerrar un modal
  closeModal: (modalId: string) => void
  
  // Cerrar todos
  closeAll: () => void
  
  // Utilidades
  isModalOpen: (modalId: string) => boolean
  getModalData: (modalId: string) => ModalData | undefined
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined)

interface ModalProviderProps {
  children: ReactNode
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [modals, setModals] = useState<Record<string, ModalState>>({})

  const openModal = useCallback((modalId: string, options: OpenModalOptions = {}) => {
    setModals((prev) => ({
      ...prev,
      [modalId]: {
        isOpen: true,
        data: options.data,
        onClose: options.onClose,
      },
    }))
  }, [])

  const closeModal = useCallback((modalId: string) => {
    setModals((prev) => {
      const modal = prev[modalId]
      if (modal?.onClose) {
        modal.onClose()
      }
      return {
        ...prev,
        [modalId]: { isOpen: false, data: undefined, onClose: undefined },
      }
    })
  }, [])

  const closeAll = useCallback(() => {
    setModals((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((key) => {
        if (updated[key]?.onClose) {
          updated[key].onClose()
        }
        updated[key] = { isOpen: false, data: undefined, onClose: undefined }
      })
      return updated
    })
  }, [])

  const isModalOpen = useCallback(
    (modalId: string) => modals[modalId]?.isOpen || false,
    [modals]
  )

  const getModalData = useCallback(
    (modalId: string) => modals[modalId]?.data,
    [modals]
  )

  const value: ModalContextType = {
    modals,
    openModal,
    closeModal,
    closeAll,
    isModalOpen,
    getModalData,
  }

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
}
```

### 2. `src/hooks/useModal.ts`

```typescript
import { useContext } from 'react'
import { ModalContext, type ModalData } from '@/context/ModalContext'

interface UseModalOptions {
  data?: ModalData
  onClose?: () => void
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within ModalProvider')
  }

  return {
    // Abrir modal
    open: (modalId: string, options: UseModalOptions = {}) => {
      context.openModal(modalId, options)
    },

    // Cerrar modal
    close: (modalId: string) => {
      context.closeModal(modalId)
    },

    // Cerrar todos
    closeAll: () => {
      context.closeAll()
    },

    // Verificar si está abierto
    isOpen: (modalId: string) => context.isModalOpen(modalId),

    // Obtener data del modal
    getData: (modalId: string) => context.getModalData(modalId),
  }
}
```

### 3. `src/components/ui/ModalPortal/ModalPortal.tsx`

```typescript
import React, { useContext } from 'react'
import { ModalContext } from '@/context/ModalContext'
import BankPickerModalContainer from '@/components/billeteras/BankPickerModalContainer'
import EditBilleteraModalContainer from '@/components/billeteras/EditBilleteraModalContainer'
import TransaccionModalContainer from '@/components/transacciones/TransaccionModalContainer'
import { ConfirmModal } from '@/components/ui/ConfirmModal/ConfirmModal'
import RecurrenteModalContainer from '@/components/transacciones/RecurrenteModalContainer'
import ProfileModalContainer from '@/components/perfil/ProfileModalContainer'

export function ModalPortal() {
  const context = useContext(ModalContext)
  if (!context) return null

  const { modals, closeModal } = context

  return (
    <>
      {/* BankPickerModal */}
      {modals['bankPicker']?.isOpen && (
        <BankPickerModalContainer
          data={modals['bankPicker'].data}
          onClose={() => closeModal('bankPicker')}
        />
      )}

      {/* EditBilleteraModal */}
      {modals['editBilletera']?.isOpen && (
        <EditBilleteraModalContainer
          data={modals['editBilletera'].data}
          onClose={() => closeModal('editBilletera')}
        />
      )}

      {/* TransaccionModal */}
      {modals['transaccion']?.isOpen && (
        <TransaccionModalContainer
          data={modals['transaccion'].data}
          onClose={() => closeModal('transaccion')}
        />
      )}

      {/* RecurrenteModal */}
      {modals['recurrente']?.isOpen && (
        <RecurrenteModalContainer
          data={modals['recurrente'].data}
          onClose={() => closeModal('recurrente')}
        />
      )}

      {/* ConfirmModal */}
      {modals['confirm']?.isOpen && (
        <ConfirmModal
          isOpen={true}
          onClose={() => closeModal('confirm')}
          {...(modals['confirm'].data || {})}
        />
      )}

      {/* Profile Modals */}
      {modals['profileDatos']?.isOpen && (
        <ProfileModalContainer
          type="datos"
          data={modals['profileDatos'].data}
          onClose={() => closeModal('profileDatos')}
        />
      )}

      {modals['profileEmail']?.isOpen && (
        <ProfileModalContainer
          type="email"
          data={modals['profileEmail'].data}
          onClose={() => closeModal('profileEmail')}
        />
      )}

      {modals['profilePassword']?.isOpen && (
        <ProfileModalContainer
          type="password"
          data={modals['profilePassword'].data}
          onClose={() => closeModal('profilePassword')}
        />
      )}

      {/* Agregar más modales aquí según sea necesario */}
    </>
  )
}
```

---

## ARCHIVOS A MODIFICAR

### 1. `src/main.tsx` - Envolver con ModalProvider

```typescript
// ANTES
import App from './App.tsx'
import { AuthProvider } from './hooks/useAuth'
import { ToastProvider } from './hooks/useToast'
import { FinancialProvider } from './hooks/useFinancial'

// DESPUÉS
import App from './App.tsx'
import { AuthProvider } from './hooks/useAuth'
import { ToastProvider } from './hooks/useToast'
import { FinancialProvider } from './hooks/useFinancial'
import { ModalProvider } from './context/ModalContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ModalProvider>
      <AuthProvider>
        <ToastProvider>
          <FinancialProvider>
            <App />
          </FinancialProvider>
        </ToastProvider>
      </AuthProvider>
    </ModalProvider>
  </React.StrictMode>,
)
```

### 2. Crear wrappers para cada modal

**`src/components/billeteras/BankPickerModalContainer.tsx`**

```typescript
import React from 'react'
import BankPickerModal from './BankPickerModal'
import { useFinancial } from '@/hooks/useFinancial'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useModal } from '@/hooks/useModal'
import billeteraService from '@/services/billetera.service'
import type { CreatePayload } from './BankPickerModal'

interface BankPickerModalContainerProps {
  data?: any
  onClose: () => void
}

export default function BankPickerModalContainer({
  onClose,
}: BankPickerModalContainerProps) {
  const { refreshBilleteras, billeteras } = useFinancial()
  const { usuario } = useAuth()
  const { showToast } = useToast()
  const { close } = useModal()

  const handleCrear = async (payload: CreatePayload) => {
    try {
      await billeteraService.create({
        nombre: payload.nombre,
        moneda: payload.moneda,
        saldo_inicial: payload.saldo_inicial,
        es_principal: payload.es_principal,
        bank_id: payload.bank_id,
      })
      await refreshBilleteras()
      close('bankPicker')
      showToast(`"${payload.nombre}" creada exitosamente`, 'success')
    } catch (error) {
      console.error(error)
      showToast('Error al crear la billetera', 'error')
    }
  }

  return (
    <BankPickerModal
      isOpen={true}
      onClose={onClose}
      onCrear={handleCrear}
      billeterasActuales={billeteras}
      monedaPrincipalUsuario={(usuario?.moneda_principal as 'ARS' | 'USD') || 'ARS'}
    />
  )
}
```

### 3. `src/pages/app/billeteras/BilleterasPage.tsx` - Refactorizar

```typescript
// ANTES
const [modalOpen, setModalOpen] = useState(false)
const [editModalOpen, setEditModalOpen] = useState(false)

const handleOpenModal = () => {
  setModalOpen(true)
}

// DESPUÉS
import { useModal } from '@/hooks/useModal'

const { open, close } = useModal()

const handleOpenModal = () => {
  open('bankPicker')
}

const handleEdit = (id: string) => {
  const b = billeteras.find((b) => b.id === id)
  if (b) {
    open('editBilletera', { data: { billetera: b } })
  }
}
```

### 4. `src/pages/app/transacciones/TransaccionesPage.tsx`

```typescript
// ANTES
const [isModalOpen, setIsModalOpen] = useState(false)
const [selectedTx, setSelectedTx] = useState<Transaccion | null>(null)

const openNewTransaccion = () => {
  setSelectedTx(null)
  setIsModalOpen(true)
}

const handleEdit = (id: string) => {
  const tx = transacciones.find(t => t.id === id)
  if (tx) {
    setSelectedTx(tx)
    setIsModalOpen(true)
  }
}

// DESPUÉS
import { useModal } from '@/hooks/useModal'

const { open } = useModal()

const openNewTransaccion = () => {
  open('transaccion', { data: { transaccion: null } })
}

const handleEdit = (id: string) => {
  const tx = transacciones.find(t => t.id === id)
  if (tx) {
    open('transaccion', { data: { transaccion: tx } })
  }
}
```

### 5. `src/pages/app/perfil/PerfilPage.tsx`

```typescript
// ANTES: 8+ estados de modales
const [activeModal, setActiveModal] = useState<string | null>(null)
const [showConfirmDelete, setShowConfirmDelete] = useState(false)
const [showConfirmLogout, setShowConfirmLogout] = useState(false)

const handleOpenModal = (modal: string) => {
  setActiveModal(modal)
}

// DESPUÉS
import { useModal } from '@/hooks/useModal'

const { open, close } = useModal()

const handleOpenModal = (modal: string) => {
  open(`profile${modal}`)
}

const handleConfirmDelete = () => {
  open('confirmDelete', {
    data: {
      title: '¿Estás seguro?',
      description: 'Esta acción no se puede deshacer',
      onConfirm: deleteAccount,
    }
  })
}
```

---

## PASO A PASO IMPLEMENTACIÓN

### **FASE 1: Infraestructura (20 min)**

```
1. Crear src/context/ModalContext.tsx (copiar código arriba)
2. Crear src/hooks/useModal.ts (copiar código arriba)
3. Crear src/components/ui/ModalPortal/ModalPortal.tsx (minimal, solo importar)
4. Envolver App con ModalProvider en src/main.tsx
5. Verificar que no hay errores de compilación
```

### **FASE 2: Wrappers de Modales (1h)**

```
Para CADA modal existente:
1. Crear xxxModalContainer.tsx que:
   - Importa el modal original
   - Importa hooks necesarios (useFinancial, useAuth, etc)
   - Recibe props: data, onClose
   - Devuelve el modal original con props conectadas
   
Modales a wrappear:
- BankPickerModalContainer
- EditBilleteraModalContainer
- TransaccionModalContainer
- RecurrenteModalContainer
- ProfileModalContainer (maneja profile/datos, email, password)
```

### **FASE 3: Refactorizar Componentes (1h30)**

**BilleterasPage:**
```typescript
// Eliminar:
const [modalOpen, setModalOpen] = useState(false)
const [editModalOpen, setEditModalOpen] = useState(false)
const [billeteraAEditar, setBilleteraAEditar] = useState(null)

// Reemplazar con:
const { open } = useModal()

// Y cambiar todos los setModalOpen(true) → open('bankPicker')
```

**TransaccionesPage:**
```typescript
// Eliminar:
const [isModalOpen, setIsModalOpen] = useState(false)
const [selectedTx, setSelectedTx] = useState(null)

// Reemplazar con:
const { open } = useModal()

// Y cambiar lógica
```

**PerfilPage:**
```typescript
// Eliminar todos estos:
const [activeModal, setActiveModal] = useState(null)
const [showConfirmDelete, setShowConfirmDelete] = useState(false)
const [showConfirmLogout, setShowConfirmLogout] = useState(false)
const [showConfirmDeleteFoto, setShowConfirmDeleteFoto] = useState(false)

// Reemplazar con:
const { open } = useModal()

// Para cada modal button → open('profileX')
```

**RecurrentesPage:**
```typescript
// Eliminar:
const [isModalOpen, setIsModalOpen] = useState(false)
const [editingId, setEditingId] = useState(null)
const [deleteTarget, setDeleteTarget] = useState(null)

// Reemplazar con:
const { open } = useModal()
```

**DashboardPage:**
```typescript
// Eliminar:
const [isProyeccionModalOpen, setIsProyeccionModalOpen] = useState(false)

// Reemplazar con:
const { open } = useModal()

// Y: onClick={() => open('proyeccion')}
```

### **FASE 4: Reemplazar window.confirm() (30 min)**

Buscar en toda la app:
```bash
grep -r "window.confirm" src/
```

Reemplazar cada uno con:
```typescript
const { open } = useModal()

open('confirm', {
  data: {
    title: '¿Estás seguro?',
    description: 'Descripción del confirmación',
    onConfirm: () => handleDelete(),
    variant: 'danger'
  }
})
```

### **FASE 5: ModalPortal Final (20 min)**

Completar `src/components/ui/ModalPortal/ModalPortal.tsx` con TODOS los modales:
- BankPickerModal
- EditBilleteraModal  
- TransaccionModal
- RecurrenteModal
- ConfirmModal
- ProfileModalContainer (con variantes)
- ProyeccionModal

### **FASE 6: Testing (15 min)**

```
En CADA página:
1. Verificar que botones abren modales
2. Verificar que modales cierran al clickear X o cancelar
3. Verificar que onSuccess cierra modal correctamente
4. Verificar que no hay errores en consola
5. Verificar que se puede abrir modal desde profundo en el árbol
```

---

## IDS DE MODALES PARA USAR

```typescript
// Billeteras
'bankPicker'           // Crear nueva billetera
'editBilletera'        // Editar billetera

// Transacciones
'transaccion'          // Crear/editar transacción
'recurrente'           // Crear/editar recurrente

// Confirmaciones
'confirm'              // Confirmación genérica
'confirmDeleteBilletera'
'confirmDeleteTx'
'confirmDeleteRecurrente'

// Perfil
'profileDatos'         // Editar datos personales
'profileEmail'         // Cambiar email
'profilePassword'      // Cambiar contraseña
'profileTelefono'      // Cambiar teléfono
'profileCiclo'         // Ciclo financiero
'profileMoneda'        // Preferencias de moneda
'profileFoto'          // Cambiar foto
'confirmDeleteAccount' // Eliminar cuenta
'confirmLogout'        // Logout

// Dashboard
'proyeccion'           // Ver proyección modal
```

---

## ANTES Y DESPUÉS

### ANTES (Estado Local Disperso)
```typescript
// BilleterasPage.tsx
const [modalOpen, setModalOpen] = useState(false)
const [editModalOpen, setEditModalOpen] = useState(false)
const [billeteraAEditar, setBilleteraAEditar] = useState(null)

// Código:
<button onClick={() => setModalOpen(true)}>Nueva</button>
{modalOpen && (
  <BankPickerModal
    isOpen={modalOpen}
    onClose={() => setModalOpen(false)}
    onCrear={handleCrear}
  />
)}
```

### DESPUÉS (Centralizado)
```typescript
// BilleterasPage.tsx
const { open } = useModal()

// Código:
<button onClick={() => open('bankPicker')}>Nueva</button>
// El modal se renderiza en ModalPortal automáticamente
```

---

## CHECKLIST FINAL

- [ ] ModalContext.tsx creado y funcionando
- [ ] useModal hook funcionando
- [ ] ModalProvider envuelve App
- [ ] ModalPortal renders todos los modales
- [ ] BankPickerModalContainer creado
- [ ] EditBilleteraModalContainer creado
- [ ] TransaccionModalContainer creado
- [ ] RecurrenteModalContainer creado
- [ ] ProfileModalContainer creado
- [ ] BilleterasPage refactorizado
- [ ] TransaccionesPage refactorizado
- [ ] PerfilPage refactorizado
- [ ] RecurrentesPage refactorizado
- [ ] DashboardPage refactorizado
- [ ] window.confirm() reemplazados
- [ ] No hay errores en consola
- [ ] Todos los modales abren/cierran correctamente
- [ ] Código redundante eliminado

---

## NOTAS IMPORTANTES

1. **Los modales originales NO se tocan** - Solo se crean wrappers alrededor
2. **El ModalPortal debe estar en el root** - Idealmente en main.tsx o App.tsx
3. **useModal() debe estar adentro de ModalProvider** - Error si no está
4. **Pasar data es opcional** - Usar cuando necesites pasar props al modal
5. **onClose en ModalContext es automático** - Se llama al closeModal()
6. **Agregar nuevo modal es fácil** - Solo 1. Crear container 2. Agregar a ModalPortal 3. Usar open()

---

## COMANDO DE BÚSQUEDA PARA ENCONTRAR TODOS LOS MODALES

```bash
# Buscar todos los componentes que usan Modal
grep -r "useState.*modal" src/ --include="*.tsx" --include="*.ts"
grep -r "setIsModalOpen\|setModalOpen\|setActiveModal" src/ --include="*.tsx"
grep -r "window.confirm" src/ --include="*.tsx"
```

---

**Este plan es 100% implementable. Síguelo paso a paso y en 3-4 horas todo estará centralizado y limpio.**
