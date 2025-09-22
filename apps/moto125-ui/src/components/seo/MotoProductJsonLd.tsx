import { getMirrorState } from "@/server/dataMirror";
import JsonLd from "./JsonLd";
import { mediaUrl } from "@/utils/utils";
import { Moto } from "@moto125/api-client";

type Spec = { name: string; value: string };

type Props = {
  url: string;
  name: string;
  description?: string | null;
  images?: string[];
  sku?: string | null;
  brandName?: string | null;
  category?: string | null;
  releaseDate?: string | null;
  normative?: string | null;
  specs?: Spec[];
};

export default function MotoProductJsonLd({
  url, name, description, images,
  sku, brandName, category, releaseDate, normative, specs
}: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    url,
    description: description ?? undefined,
    image: images?.length ? images : undefined,
    sku: sku ?? undefined,
    brand: brandName ? { "@type": "Brand", name: brandName } : undefined,
    category: category ?? undefined,
    releaseDate: releaseDate ?? undefined,
    additionalProperty: [
      ...(normative ? [{ "@type": "PropertyValue", name: "Normativa", value: normative }] : []),
      ...(specs?.length ? specs.map(s => ({ "@type": "PropertyValue", name: s.name, value: s.value })) : []),
    ],
  };

  return <JsonLd data={data} />;
}


export async function MotoProductJsonLdFromMoto({ moto }: { moto: Moto }) {
  const state = await getMirrorState();
  const base = (state?.data?.config?.canonicalUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const url = base ? `${base}/moto/${moto.moto125Id}` : `/moto/${moto.moto125Id}`;

  const img = moto.images?.[0]?.url ? mediaUrl(moto.images[0].url) : undefined;

  const nf = new Intl.NumberFormat("es-ES");
  const withUnit = (v?: number | null, u?: string) => (v == null ? null : `${nf.format(v)}${u ? ` ${u}` : ""}`);

  const ft = moto.fichaTecnica ?? {};
  const ce = ft.combustionEngine ?? {};
  const el = ft.electricEngine ?? {};

  const specs: Spec[] = [];

  if (ft.width != null) specs.push({ name: "Ancho", value: withUnit(ft.width, "mm")! });
  if (ft.height != null) specs.push({ name: "Alto", value: withUnit(ft.height, "mm")! });
  if (ft.longitude != null) specs.push({ name: "Longitud", value: withUnit(ft.longitude, "mm")! });
  if (ft.wheelbase != null) specs.push({ name: "Distancia entre ejes", value: withUnit(ft.wheelbase, "mm")! });
  if (ft.seatHeight != null) specs.push({ name: "Altura del asiento", value: withUnit(ft.seatHeight, "mm")! });
  if (ft.totalWeight != null) specs.push({ name: "Peso", value: withUnit(ft.totalWeight, "kg")! });
  if (ft.depositCapacity != null) specs.push({ name: "Depósito", value: withUnit(ft.depositCapacity, "L")! });
  if (ft.frontWheelBallon) specs.push({ name: "Neumático delantero", value: ft.frontWheelBallon });
  if (ft.rearWheelBallon) specs.push({ name: "Neumático trasero", value: ft.rearWheelBallon });
  if (ft.frontBreakDiameter != null) specs.push({ name: "Freno delantero (Ø)", value: withUnit(ft.frontBreakDiameter, "mm")! });
  if (ft.frontBreakTypeName) specs.push({ name: "Tipo freno delantero", value: ft.frontBreakTypeName });
  if (ft.rearBreakDiameter != null) specs.push({ name: "Freno trasero (Ø)", value: withUnit(ft.rearBreakDiameter, "mm")! });
  if (ft.rearBreakTypeName) specs.push({ name: "Tipo freno trasero", value: ft.rearBreakTypeName });
  if (ft.frontSuspensionTravel != null) specs.push({ name: "Recorrido suspensión delantera", value: withUnit(ft.frontSuspensionTravel, "mm")! });
  if (ft.rearSuspensionTravel != null) specs.push({ name: "Recorrido suspensión trasera", value: withUnit(ft.rearSuspensionTravel, "mm")! });
  if (ft.rearNumSuspensions != null) specs.push({ name: "Nº amortiguadores traseros", value: String(ft.rearNumSuspensions) });
  if (ft.frontTrainDistribution != null) specs.push({ name: "Reparto tren delantero", value: withUnit(ft.frontTrainDistribution, "%")! });
  if (ft.rearTrainDistribution != null) specs.push({ name: "Reparto tren trasero", value: withUnit(ft.rearTrainDistribution, "%")! });
  if (ft.frontSuspensionTypeName) specs.push({ name: "Suspensión delantera", value: ft.frontSuspensionTypeName });
  if (ft.motorcycleFrameTypeName) specs.push({ name: "Tipo de chasis", value: ft.motorcycleFrameTypeName });
  if (ft.motorcycleFrameMaterialName) specs.push({ name: "Material del chasis", value: ft.motorcycleFrameMaterialName });

  if (ce.engineDisplacement != null) specs.push({ name: "Cilindrada", value: withUnit(ce.engineDisplacement, "cc")! });
  if (ce.horsePower != null) specs.push({ name: "Potencia", value: withUnit(ce.horsePower, "CV")! });
  if (ce.powerRPM != null) specs.push({ name: "Potencia @rpm", value: withUnit(ce.powerRPM, "rpm")! });
  if (ce.maxTorqueNP != null) specs.push({ name: "Par", value: withUnit(ce.maxTorqueNP, "N·m")! });
  if (ce.maxTorqueRPM != null) specs.push({ name: "Par @rpm", value: withUnit(ce.maxTorqueRPM, "rpm")! });
  if (ce.numberOfCylinders != null) specs.push({ name: "Cilindros", value: String(ce.numberOfCylinders) });
  if (ce.pistonDiameter != null) specs.push({ name: "Diámetro pistón", value: withUnit(ce.pistonDiameter, "mm")! });
  if (ce.pistonStroke != null) specs.push({ name: "Carrera pistón", value: withUnit(ce.pistonStroke, "mm")! });
  if (ce.compressionRatio != null) specs.push({ name: "Compresión", value: `${ce.compressionRatio}:1` });
  if (ce.fuelFeedingName) specs.push({ name: "Alimentación", value: ce.fuelFeedingName });
  if (ce.distributionName) specs.push({ name: "Distribución", value: ce.distributionName });
  if (ce.refrigerationName) specs.push({ name: "Refrigeración", value: ce.refrigerationName });
  if (ce.gearboxName) specs.push({ name: "Caja de cambios", value: ce.gearboxName });
  if (ce.ignitionType) specs.push({ name: "Ignición", value: ce.ignitionType });

  if (el.powerKW != null) specs.push({ name: "Potencia eléctrica", value: withUnit(el.powerKW, "kW")! });
  if (el.powerPM != null) specs.push({ name: "Potencia pico", value: withUnit(el.powerPM, "kW")! });
  if (el.torque != null) specs.push({ name: "Par eléctrico", value: withUnit(el.torque, "N·m")! });
  if (el.rpm != null) specs.push({ name: "Régimen eléctrico", value: withUnit(el.rpm, "rpm")! });
  if (el.numberOfMotors != null) specs.push({ name: "Nº motores", value: String(el.numberOfMotors) });
  if (el.batteryName) specs.push({ name: "Batería", value: el.batteryName });
  if (el.batteryVolts != null) specs.push({ name: "Voltaje batería", value: withUnit(el.batteryVolts, "V")! });
  if (el.batteryCapacity != null) specs.push({ name: "Capacidad batería", value: withUnit(el.batteryCapacity, "kWh")! });

  return (
    <MotoProductJsonLd
      url={url}
      name={moto.fullName ?? moto.modelName}
      description={moto.description ?? undefined}
      images={img ? [img] : undefined}
      sku={moto.moto125Id}
      brandName={moto.company?.name ?? undefined}
      category={moto.motoType?.fullName ?? moto.motoType?.name ?? undefined}
      releaseDate={moto.publishedAt ?? moto.createdAt ?? undefined}
      normative={moto.normativa ?? undefined}
      specs={specs}
    />
  );
}