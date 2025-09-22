import type {
  MotoFichaTecnica,
  CombustionEngineSpec,
  ElectricEngineSpec,
} from "@moto125/api-client";

export interface MotoSpecsProps {
  ficha?: MotoFichaTecnica | null;
}

function withUnit(value: unknown, unit?: string): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") {
    const n = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(value);
    return unit ? `${n} ${unit}` : n;
  }
  return unit ? `${String(value)} ${unit}` : String(value);
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <tr className="border-b">
      <th className="w-1/3 py-2 pr-4 text-left font-medium">{label}</th>
      <td className="py-2">{value ?? ""}</td>
    </tr>
  );
}

function ChassisTable({ f }: { f: MotoFichaTecnica }) {
  return (
    <section className="mt-8">
      <h3 className="mb-3 text-lg font-semibold">Dimensiones y chasis</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            <Row label="Ancho" value={withUnit(f.width, "mm")} />
            <Row label="Alto" value={withUnit(f.height, "mm")} />
            <Row label="Longitud" value={withUnit(f.longitude, "mm")} />
            <Row label="Distancia entre ejes" value={withUnit(f.wheelbase, "mm")} />
            <Row label="Altura del asiento" value={withUnit(f.seatHeight, "mm")} />
            <Row label="Peso total" value={withUnit(f.totalWeight, "kg")} />
            <Row label="Capacidad del depósito" value={withUnit(f.depositCapacity, "L")} />
            <Row label="Neumático delantero (balón)" value={f.frontWheelBallon ?? ""} />
            <Row label="Neumático trasero (balón)" value={f.rearWheelBallon ?? ""} />
            <Row label="Diámetro freno delantero" value={withUnit(f.frontBreakDiameter, "mm")} />
            <Row label="Tipo freno delantero" value={f.frontBreakTypeName ?? ""} />
            <Row label="Diámetro freno trasero" value={withUnit(f.rearBreakDiameter, "mm")} />
            <Row label="Tipo freno trasero" value={f.rearBreakTypeName ?? ""} />
            <Row label="Nº suspensiones traseras" value={f.rearNumSuspensions != null ? String(f.rearNumSuspensions) : ""} />
            <Row label="Recorrido suspensión delantera" value={withUnit(f.frontSuspensionTravel, "mm")} />
            <Row label="Recorrido suspensión trasera" value={withUnit(f.rearSuspensionTravel, "mm")} />
            <Row label="Reparto tren delantero" value={f.frontTrainDistribution != null ? withUnit(f.frontTrainDistribution, "%") : ""} />
            <Row label="Reparto tren trasero" value={f.rearTrainDistribution != null ? withUnit(f.rearTrainDistribution, "%") : ""} />
            <Row label="Tipo de suspensión delantera" value={f.frontSuspensionTypeName ?? ""} />
            <Row label="Tipo de chasis" value={f.motorcycleFrameTypeName ?? ""} />
            <Row label="Material del chasis" value={f.motorcycleFrameMaterialName ?? ""} />
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CombustionTable({ e }: { e: CombustionEngineSpec }) {
  return (
    <section className="mt-8">
      <h3 className="mb-3 text-lg font-semibold">Motor de combustión</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            <Row label="Cilindrada" value={withUnit(e.engineDisplacement, "cc")} />
            <Row
              label="Potencia"
              value={
                e.horsePower != null
                  ? `${withUnit(e.horsePower, "CV")}${e.powerRPM ? ` @ ${withUnit(e.powerRPM, "rpm")}` : ""}`
                  : ""
              }
            />
            <Row
              label="Par máximo"
              value={
                e.maxTorqueNP != null
                  ? `${withUnit(e.maxTorqueNP, "N·m")}${e.maxTorqueRPM ? ` @ ${withUnit(e.maxTorqueRPM, "rpm")}` : ""}`
                  : ""
              }
            />
            <Row label="Nº de cilindros" value={e.numberOfCylinders != null ? String(e.numberOfCylinders) : ""} />
            <Row label="Diámetro del pistón" value={withUnit(e.pistonDiameter, "mm")} />
            <Row label="Carrera del pistón" value={withUnit(e.pistonStroke, "mm")} />
            <Row label="Relación de compresión" value={e.compressionRatio != null ? `${e.compressionRatio}:1` : ""} />
            <Row label="Alimentación" value={e.fuelFeedingName ?? ""} />
            <Row label="Distribución" value={e.distributionName ?? ""} />
            <Row label="Refrigeración" value={e.refrigerationName ?? ""} />
            <Row label="Encendido" value={e.ignitionType ?? ""} />
            <Row label="Caja de cambios" value={e.gearboxName ?? ""} />
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ElectricTable({ e }: { e: ElectricEngineSpec }) {
  return (
    <section className="mt-8">
      <h3 className="mb-3 text-lg font-semibold">Motor eléctrico</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            <Row label="Potencia" value={withUnit(e.powerKW, "kW")} />
            <Row label="Potencia pico" value={withUnit(e.powerPM, "kW")} />
            <Row label="Par" value={withUnit(e.torque, "N·m")} />
            <Row label="Régimen" value={withUnit(e.rpm, "rpm")} />
            <Row label="Nº de motores" value={e.numberOfMotors != null ? String(e.numberOfMotors) : ""} />
            <Row label="Batería" value={e.batteryName ?? ""} />
            <Row label="Voltaje de batería" value={withUnit(e.batteryVolts, "V")} />
            <Row label="Capacidad de batería" value={withUnit(e.batteryCapacity, "kWh")} />
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function MotoSpecs({ ficha }: MotoSpecsProps) {
  if (!ficha) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-semibold">Ficha técnica</h2>
      <ChassisTable f={ficha} />
      {ficha.combustionEngine ? <CombustionTable e={ficha.combustionEngine} /> : null}
      {ficha.electricEngine ? <ElectricTable e={ficha.electricEngine} /> : null}
    </section>
  );
}
