import type {
  MotoFichaTecnica,
  CombustionEngineSpec,
  ElectricEngineSpec,
} from "@moto125/api-client";
import SectionHeader from "../common/SectionHeader";

export interface MotoSpecsProps {
  ficha?: MotoFichaTecnica | null;
}

function fmtNum(value: unknown, unit?: string): string {
  if (value === null || value === undefined || value === "") return "-";
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num === 0) return "-";
  const n = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(num);
  return unit ? `${n} ${unit}` : n;
}

function fmtText(value: unknown): string {
  const s = String(value ?? "").trim();
  return s ? s : "-";
}

type RowDef = { label: string; value?: string };

function Table({ rows }: { rows: RowDef[] }) {
  if (!rows.length) return null;

  return (
    <div className="overflow-x-auto max-w-3xl mx-auto">
      <table className="w-full text-center border-separate border-spacing-0 shadow-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.label}
              className={
                i % 2 === 0
                  ? "bg-[var(--color-surface)]"
                  : "bg-[var(--color-surface-2,#fafafa)]"
              }
            >
              <th className="w-1/2 py-3 px-4 font-medium border-b border-[var(--color-border)]">
                {r.label}
              </th>
              <td className="py-3 px-4 font-semibold border-b border-[var(--color-border)]">
                {r.value && r.value !== "" ? r.value : "Sin datos"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChassisTable({ f }: { f: MotoFichaTecnica }) {
  const rows: RowDef[] = [
    { label: "Ancho", value: fmtNum(f.width, "mm") },
    { label: "Alto", value: fmtNum(f.height, "mm") },
    { label: "Longitud", value: fmtNum(f.longitude, "mm") },
    { label: "Distancia entre ejes", value: fmtNum(f.wheelbase, "mm") },
    { label: "Altura del asiento", value: fmtNum(f.seatHeight, "mm") },
    { label: "Peso total", value: fmtNum(f.totalWeight, "kg") },
    { label: "Capacidad del depósito", value: fmtNum(f.depositCapacity, "L") },
    { label: "Neumático delantero (balón)", value: fmtText(f.frontWheelBallon) },
    { label: "Neumático trasero (balón)", value: fmtText(f.rearWheelBallon) },
    { label: "Diámetro freno delantero", value: fmtNum(f.frontBreakDiameter, "mm") },
    { label: "Tipo freno delantero", value: fmtText(f.frontBreakTypeName) },
    { label: "Diámetro freno trasero", value: fmtNum(f.rearBreakDiameter, "mm") },
    { label: "Tipo freno trasero", value: fmtText(f.rearBreakTypeName) },
    {
      label: "Nº suspensiones traseras",
      value: f.rearNumSuspensions != null && f.rearNumSuspensions !== 0 ? String(f.rearNumSuspensions) : "Sin datos",
    },
    { label: "Recorrido suspensión delantera", value: fmtNum(f.frontSuspensionTravel, "mm") },
    { label: "Recorrido suspensión trasera", value: fmtNum(f.rearSuspensionTravel, "mm") },
    {
      label: "Reparto tren delantero",
      value: f.frontTrainDistribution != null && f.frontTrainDistribution !== 0 ? `${f.frontTrainDistribution} %` : "Sin datos",
    },
    {
      label: "Reparto tren trasero",
      value: f.rearTrainDistribution != null && f.rearTrainDistribution !== 0 ? `${f.rearTrainDistribution} %` : "Sin datos",
    },
    { label: "Tipo de suspensión delantera", value: fmtText(f.frontSuspensionTypeName) },
    { label: "Tipo de chasis", value: fmtText(f.motorcycleFrameTypeName) },
    { label: "Material del chasis", value: fmtText(f.motorcycleFrameMaterialName) },
  ];

  return (
    <section className="mt-8">
      <h3 className="mb-3 text-lg font-semibold">Dimensiones y chasis</h3>
      <Table rows={rows} />
    </section>
  );
}

function CombustionTable({ e }: { e: CombustionEngineSpec }) {
  const potenciaBase = e.horsePower && e.horsePower !== 0 ? fmtNum(e.horsePower, "CV") : "Sin datos";
  const potenciaRpm = e.powerRPM && e.powerRPM !== 0 ? ` @ ${fmtNum(e.powerRPM, "rpm")}` : "";
  const potencia = potenciaBase === "Sin datos" ? "Sin datos" : `${potenciaBase}${potenciaRpm}`;

  const parBase = e.maxTorqueNP && e.maxTorqueNP !== 0 ? fmtNum(e.maxTorqueNP, "N·m") : "Sin datos";
  const parRpm = e.maxTorqueRPM && e.maxTorqueRPM !== 0 ? ` @ ${fmtNum(e.maxTorqueRPM, "rpm")}` : "";
  const par = parBase === "Sin datos" ? "Sin datos" : `${parBase}${parRpm}`;

  const rows: RowDef[] = [
    { label: "Cilindrada", value: fmtNum(e.engineDisplacement, "cc") },
    { label: "Potencia", value: potencia },
    { label: "Par máximo", value: par },
    {
      label: "Nº de cilindros",
      value: e.numberOfCylinders != null && e.numberOfCylinders !== 0 ? String(e.numberOfCylinders) : "Sin datos",
    },
    { label: "Diámetro del pistón", value: fmtNum(e.pistonDiameter, "mm") },
    { label: "Carrera del pistón", value: fmtNum(e.pistonStroke, "mm") },
    {
      label: "Relación de compresión",
      value: e.compressionRatio && e.compressionRatio !== 0 ? `${e.compressionRatio}:1` : "Sin datos",
    },
    { label: "Alimentación", value: fmtText(e.fuelFeedingName) },
    { label: "Distribución", value: fmtText(e.distributionName) },
    { label: "Refrigeración", value: fmtText(e.refrigerationName) },
    { label: "Encendido", value: fmtText(e.ignitionType) },
    { label: "Caja de cambios", value: fmtText(e.gearboxName) },
  ];

  return (
    <section className="mt-8">
      <h3 className="mb-3 text-lg font-semibold">Motor de combustión</h3>
      <Table rows={rows} />
    </section>
  );
}

function ElectricTable({ e }: { e: ElectricEngineSpec }) {
  const rows: RowDef[] = [
    { label: "Potencia", value: fmtNum(e.powerKW, "kW") },
    { label: "Potencia pico", value: fmtNum(e.powerPM, "kW") },
    { label: "Par", value: fmtNum(e.torque, "N·m") },
    { label: "Régimen", value: fmtNum(e.rpm, "rpm") },
    {
      label: "Nº de motores",
      value: e.numberOfMotors != null && e.numberOfMotors !== 0 ? String(e.numberOfMotors) : "Sin datos",
    },
    { label: "Batería", value: fmtText(e.batteryName) },
    { label: "Voltaje de batería", value: fmtNum(e.batteryVolts, "V") },
    { label: "Capacidad de batería", value: fmtNum(e.batteryCapacity, "kWh") },
  ];

  return (
    <section className="mt-8">
      <h3 className="mb-3 text-lg font-semibold">Motor eléctrico</h3>
      <Table rows={rows} />
    </section>
  );
}

export default function MotoSpecs({ ficha }: MotoSpecsProps) {
  const noData =
    !ficha ||
    Object.values(ficha).every(
      (v) =>
        v == null ||
        v === "" ||
        (Array.isArray(v) && v.length === 0) ||
        (typeof v === "object" &&
          v &&
          Object.values(v).every((x) => x == null || x === "" || x === 0))
    );

  if (noData) {
    return (
      <section className="mt-8">
        <SectionHeader title="Ficha técnica" />
        <p className="mt-2 text-center text-sm italic text-[var(--color-muted,#777)]">
          No hay datos disponibles para esta moto. Muy pronto los añadiremos.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <SectionHeader title="Ficha técnica" />
      <ChassisTable f={ficha!} />
      {ficha?.combustionEngine ? <CombustionTable e={ficha.combustionEngine} /> : null}
      {ficha?.electricEngine ? <ElectricTable e={ficha.electricEngine} /> : null}
    </section>
  );
}
