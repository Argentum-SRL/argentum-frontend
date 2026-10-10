import { useContext } from 'react'
import { ModalContext } from '@/context/ModalContext'
import BankPickerModal from '@/components/billeteras/BankPickerModal'
import EditBilleteraModal from '@/components/billeteras/EditBilleteraModal'
import TransaccionModal from '@/components/transacciones/TransaccionModal'
import TarjetaModal from '@/components/tarjetas/TarjetaModal'
import FilterBarMobileDrawer from '@/components/transacciones/FilterBarMobileDrawer'
import { ConfirmModal } from '@/components/ui/ConfirmModal/ConfirmModal'
import ProyeccionModal from '@/components/dashboard/ProyeccionModal/ProyeccionModal'
import BalanceCicloModal from '@/components/dashboard/BalanceCicloModal/BalanceCicloModal'
import PresupuestoModal from '@/components/presupuestos/PresupuestoModal'
import PresupuestoDetailModal from '@/components/presupuestos/PresupuestoDetailModal'
import GoalModal from '@/components/goals/GoalModal'
import GoalContributionModal from '@/components/goals/GoalContributionModal'
import GoalDetailModal from '@/components/goals/GoalDetailModal'
import ExplicativoFinancieroModal from '@/components/dashboard/ExplicativoFinancieroModal/ExplicativoFinancieroModal'
import { ModalErrorBoundary } from '@/components/ui/ErrorBoundary/ModalErrorBoundary'

export function ModalPortal() {
  const context = useContext(ModalContext)

  if (!context) return null

  const { modals, closeModal } = context
  const typedModals = modals
  const bankPickerData = typedModals.bankPicker?.data
  const editBilleteraData = typedModals.editBilletera?.data
  const transaccionData = typedModals.transaccion?.data
  const tarjetaData = typedModals.tarjeta?.data
  const filterDrawerData = typedModals.transaccionFilters?.data
  const proyeccionData = typedModals.proyeccion?.data
  const presupuestoData = typedModals.presupuesto?.data
  const presupuestoDetailData = typedModals.presupuestoDetail?.data
  const goalData = typedModals.goal?.data
  const goalContributionData = typedModals.goalContribution?.data
  const goalDetailData = typedModals.goalDetail?.data
  const confirmData = typedModals.confirm?.data
  const bienvenidaData = typedModals.bienvenidaFinanciera?.data

  return (
    <>
      {typedModals.bankPicker?.isOpen && bankPickerData && (
        <ModalErrorBoundary modalName="bankPicker" onClose={() => closeModal('bankPicker')}>
          <BankPickerModal
            isOpen={true}
            onClose={() => closeModal('bankPicker')}
            onCrear={bankPickerData.onCrear}
            billeterasActuales={bankPickerData.billeterasActuales}
            monedaPrincipalUsuario={bankPickerData.monedaPrincipalUsuario}
          />
        </ModalErrorBoundary>
      )}

      {typedModals.editBilletera?.isOpen && editBilleteraData?.billetera && (
        <ModalErrorBoundary modalName="editBilletera" onClose={() => closeModal('editBilletera')}>
          <EditBilleteraModal
            isOpen={true}
            onClose={() => closeModal('editBilletera')}
            onEditar={editBilleteraData.onEditar}
            billetera={editBilleteraData.billetera}
            billeteraPrincipalActual={editBilleteraData.billeteraPrincipalActual}
          />
        </ModalErrorBoundary>
      )}

      {typedModals.transaccion?.isOpen && transaccionData && (
        <ModalErrorBoundary modalName="transaccion" onClose={() => closeModal('transaccion')}>
          <TransaccionModal
            open={true}
            onClose={() => closeModal('transaccion')}
            transaccion={transaccionData.transaccion}
            billeteraInicialId={transaccionData.billeteraInicialId}
            tipoInicial={transaccionData.tipoInicial}
            billeteras={transaccionData.billeteras}
            categorias={transaccionData.categorias}
            tarjetas={transaccionData.tarjetas}
            onSuccess={transaccionData.onSuccess}
          />
        </ModalErrorBoundary>
      )}

      {typedModals.tarjeta?.isOpen && tarjetaData && (
        <ModalErrorBoundary modalName="tarjeta" onClose={() => closeModal('tarjeta')}>
          <TarjetaModal />
        </ModalErrorBoundary>
      )}


      {typedModals.transaccionFilters?.isOpen && filterDrawerData && (
        <ModalErrorBoundary modalName="transaccionFilters" onClose={() => closeModal('transaccionFilters')}>
          <FilterBarMobileDrawer
            isOpen={true}
            onClose={() => closeModal('transaccionFilters')}
            filters={filterDrawerData.filters}
            onFilterChange={filterDrawerData.onFilterChange}
            onClear={filterDrawerData.onClear}
            billeteras={filterDrawerData.billeteras}
            categorias={filterDrawerData.categorias}
            hasActiveFilters={filterDrawerData.hasActiveFilters}
            showMonedaFilter={filterDrawerData.showMonedaFilter}
          />
        </ModalErrorBoundary>
      )}

      {typedModals.proyeccion?.isOpen && proyeccionData?.proyeccion && (
        <ModalErrorBoundary modalName="proyeccion" onClose={() => closeModal('proyeccion')}>
          <ProyeccionModal
            isOpen={true}
            onClose={() => closeModal('proyeccion')}
            proyeccion={proyeccionData.proyeccion}
          />
        </ModalErrorBoundary>
      )}

      {typedModals.balance_ciclo?.isOpen && (
        <ModalErrorBoundary modalName="balance_ciclo" onClose={() => closeModal('balance_ciclo')}>
          <BalanceCicloModal
            isOpen={true}
            onClose={() => closeModal('balance_ciclo')}
          />
        </ModalErrorBoundary>
      )}

      {typedModals.presupuesto?.isOpen && presupuestoData && (
        <ModalErrorBoundary modalName="presupuesto" onClose={() => closeModal('presupuesto')}>
          <PresupuestoModal
            open={true}
            onClose={() => closeModal('presupuesto')}
            presupuesto={presupuestoData.presupuesto}
            categorias={presupuestoData.categorias}
            onSuccess={presupuestoData.onSuccess}
          />
        </ModalErrorBoundary>
      )}

      {typedModals.presupuestoDetail?.isOpen && presupuestoDetailData && (
        <ModalErrorBoundary modalName="presupuestoDetail" onClose={() => closeModal('presupuestoDetail')}>
          <PresupuestoDetailModal
            open={true}
            onClose={() => closeModal('presupuestoDetail')}
            presupuesto={presupuestoDetailData.presupuesto}
            categorias={presupuestoDetailData.categorias}
            billeteras={presupuestoDetailData.billeteras}
            onSuccess={presupuestoDetailData.onSuccess}
          />
        </ModalErrorBoundary>
      )}

      {typedModals.goal?.isOpen && goalData && (
        <ModalErrorBoundary modalName="goal" onClose={() => closeModal('goal')}>
          <GoalModal
            open={true}
            onClose={() => closeModal('goal')}
            goal={goalData.goal}
            onSuccess={goalData.onSuccess}
          />
        </ModalErrorBoundary>
      )}

      {typedModals.goalContribution?.isOpen && goalContributionData && (
        <ModalErrorBoundary modalName="goalContribution" onClose={() => closeModal('goalContribution')}>
          <GoalContributionModal
            open={true}
            onClose={() => closeModal('goalContribution')}
            goal={goalContributionData.goal}
            billeteras={goalContributionData.billeteras}
            onSuccess={goalContributionData.onSuccess}
          />
        </ModalErrorBoundary>
      )}

      {typedModals.goalDetail?.isOpen && goalDetailData && (
        <ModalErrorBoundary modalName="goalDetail" onClose={() => closeModal('goalDetail')}>
          <GoalDetailModal
            open={true}
            onClose={() => closeModal('goalDetail')}
            goal={goalDetailData.goal}
            billeteras={goalDetailData.billeteras}
            onSuccess={goalDetailData.onSuccess}
          />
        </ModalErrorBoundary>
      )}

      {typedModals.confirm?.isOpen && confirmData && (
        <ModalErrorBoundary modalName="confirm" onClose={() => closeModal('confirm')}>
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
        </ModalErrorBoundary>
      )}

      {typedModals.bienvenidaFinanciera?.isOpen && (
        <ModalErrorBoundary modalName="bienvenidaFinanciera" onClose={() => closeModal('bienvenidaFinanciera')}>
          <ExplicativoFinancieroModal
            isOpen={true}
            onClose={() => closeModal('bienvenidaFinanciera')}
            initialTab={bienvenidaData?.initialTab ?? 'perfil'}
          />
        </ModalErrorBoundary>
      )}
    </>
  )
}