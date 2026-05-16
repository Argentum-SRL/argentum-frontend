import { useContext } from 'react'
import { ModalContext } from '@/context/ModalContext'
import BankPickerModal from '@/components/billeteras/BankPickerModal'
import EditBilleteraModal from '@/components/billeteras/EditBilleteraModal'
import TransaccionModal from '@/components/transacciones/TransaccionModal'
import TarjetaModal from '@/components/tarjetas/TarjetaModal'
import RecurrenteModal from '@/components/transacciones/RecurrenteModal'
import FilterBarMobileDrawer from '@/components/transacciones/FilterBarMobileDrawer'
import { ConfirmModal } from '@/components/ui/ConfirmModal/ConfirmModal'
import ProyeccionModal from '@/components/dashboard/ProyeccionModal/ProyeccionModal'
import PresupuestoModal from '@/components/presupuestos/PresupuestoModal'
import GoalModal from '@/components/goals/GoalModal'
import GoalContributionModal from '@/components/goals/GoalContributionModal'

export function ModalPortal() {
  const context = useContext(ModalContext)

  if (!context) return null

  const { modals, closeModal } = context
  const typedModals = modals
  const bankPickerData = typedModals.bankPicker?.data
  const editBilleteraData = typedModals.editBilletera?.data
  const transaccionData = typedModals.transaccion?.data
  const tarjetaData = typedModals.tarjeta?.data
  const recurrenteData = typedModals.recurrente?.data
  const filterDrawerData = typedModals.transaccionFilters?.data
  const proyeccionData = typedModals.proyeccion?.data
  const presupuestoData = typedModals.presupuesto?.data
  const goalData = typedModals.goal?.data
  const goalContributionData = typedModals.goalContribution?.data
  const confirmData = typedModals.confirm?.data

  return (
    <>
      {typedModals.bankPicker?.isOpen && bankPickerData && (
        <BankPickerModal
          isOpen={true}
          onClose={() => closeModal('bankPicker')}
          onCrear={bankPickerData.onCrear}
          billeterasActuales={bankPickerData.billeterasActuales}
          monedaPrincipalUsuario={bankPickerData.monedaPrincipalUsuario}
        />
      )}

      {typedModals.editBilletera?.isOpen && editBilleteraData?.billetera && (
        <EditBilleteraModal
          isOpen={true}
          onClose={() => closeModal('editBilletera')}
          onEditar={editBilleteraData.onEditar}
          billetera={editBilleteraData.billetera}
          billeteraPrincipalActual={editBilleteraData.billeteraPrincipalActual}
        />
      )}

      {typedModals.transaccion?.isOpen && transaccionData && (
        <TransaccionModal
          open={true}
          onClose={() => closeModal('transaccion')}
          transaccion={transaccionData.transaccion}
          billeteras={transaccionData.billeteras}
          categorias={transaccionData.categorias}
          tarjetas={transaccionData.tarjetas}
          onSuccess={transaccionData.onSuccess}
        />
      )}

      {typedModals.tarjeta?.isOpen && tarjetaData && (
        <TarjetaModal />
      )}

      {typedModals.recurrente?.isOpen && recurrenteData && (
        <RecurrenteModal
          isOpen={true}
          onClose={() => closeModal('recurrente')}
          recurrente={recurrenteData.recurrente}
          billeteras={recurrenteData.billeteras}
          categorias={recurrenteData.categorias}
          onSuccess={recurrenteData.onSuccess}
        />
      )}

      {typedModals.transaccionFilters?.isOpen && filterDrawerData && (
        <FilterBarMobileDrawer
          isOpen={true}
          onClose={() => closeModal('transaccionFilters')}
          filters={filterDrawerData.filters}
          onFilterChange={filterDrawerData.onFilterChange}
          onClear={filterDrawerData.onClear}
          billeteras={filterDrawerData.billeteras}
          categorias={filterDrawerData.categorias}
          hasActiveFilters={filterDrawerData.hasActiveFilters}
        />
      )}

      {typedModals.proyeccion?.isOpen && proyeccionData?.proyeccion && (
        <ProyeccionModal
          isOpen={true}
          onClose={() => closeModal('proyeccion')}
          proyeccion={proyeccionData.proyeccion}
        />
      )}

      {typedModals.presupuesto?.isOpen && presupuestoData && (
        <PresupuestoModal
          open={true}
          onClose={() => closeModal('presupuesto')}
          presupuesto={presupuestoData.presupuesto}
          categorias={presupuestoData.categorias}
          onSuccess={presupuestoData.onSuccess}
        />
      )}

      {typedModals.goal?.isOpen && goalData && (
        <GoalModal
          open={true}
          onClose={() => closeModal('goal')}
          goal={goalData.goal}
          onSuccess={goalData.onSuccess}
        />
      )}

      {typedModals.goalContribution?.isOpen && goalContributionData && (
        <GoalContributionModal
          open={true}
          onClose={() => closeModal('goalContribution')}
          goal={goalContributionData.goal}
          billeteras={goalContributionData.billeteras}
          onSuccess={goalContributionData.onSuccess}
        />
      )}

      {typedModals.confirm?.isOpen && confirmData && (
        <ConfirmModal
          isOpen={true}
          onClose={() => closeModal('confirm')}
          onConfirm={confirmData.onConfirm}
          title={confirmData.title}
          description={confirmData.description}
          confirmLabel={confirmData.confirmLabel}
          cancelLabel={confirmData.cancelLabel}
          variant={confirmData.variant}
          requireTyping={confirmData.requireTyping}
        />
      )}
    </>
  )
}