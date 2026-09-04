/**
 * Control de integridad contra desbordamiento numérico (anti-overflow).
 * Límite técnico máximo para montos monetarios en la aplicación (1 billón).
 * Previene desbordamiento y pérdida de precisión en operaciones matemáticas.
 * NO es una regla de negocio comercial, sino una salvaguarda de integridad estructural.
 */
export const MAX_MONTO_INTEGRIDAD = 1_000_000_000_000;
