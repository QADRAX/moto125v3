import {
  getCompanyIdByName,
  getImageIdsByMoto125Id,
  getMotorcycleTypeIdByName,
} from "./strapi";
import {
  Company,
  CompanyData,
  MotoData,
  Motorcycle,
  Prestaciones,
  StrapiFichaTecnica,
  StrapiMotorcycle,
} from "./types";

export function parseCompanyToCompanyData(company: Company): CompanyData {
  return {
    name: company.name,
    phone: company.contactPhoneNumber,
    url: company.webUrl,
    active: true,
  };
}

/**
 * Converts a Motorcycle object to a StrapiMotorcycle object.
 * @param motorcycle - The Motorcycle object to convert.
 * @returns The converted StrapiMotorcycle object.
 */
export function parseMotorcycleToStrapiMotorcycle(
  motorcycle: Motorcycle
): StrapiMotorcycle {
  const {
    id,
    legacyId,
    isActive,
    modelName,
    priece,
    totalWeight,
    rearTrainDistribution,
    frontTrainDistribution,
    rearSuspensionTravel,
    rearNumSuspensions,
    frontSuspensionTravel,
    rearBreakDiameter,
    frontBreakDiameter,
    rearWheelBallon,
    rearWheelDiameter,
    frontWheelBallon,
    frontWheelDiameter,
    longitude,
    height,
    width,
    wheelbase,
    seatHeight,
    depositCapacity,
    descrition: description,
    company,
    motorcycleType,
    combustionEngine,
    electricEngine,
    motorcycleFrameType,
    motorcycleFrameMaterial,
    frontSuspensionType,
    frontBreakType,
    rearBreakType,
  } = motorcycle;

  const fichaTecnica: StrapiFichaTecnica = {
    totalWeight,
    rearTrainDistribution,
    frontTrainDistribution,
    rearSuspensionTravel,
    rearNumSuspensions,
    frontSuspensionTravel,
    rearBreakDiameter,
    frontBreakDiameter,
    rearWheelBallon,
    rearWheelDiameter,
    frontWheelBallon,
    frontWheelDiameter,
    longitude,
    height,
    width,
    wheelbase,
    seatHeight,
    depositCapacity,
    combustionEngine: combustionEngine
      ? {
          numberOfCylinders: combustionEngine.numberOfCylinders,
          pistonDiameter: combustionEngine.pistonDiameter,
          pistonStroke: combustionEngine.pistonStroke,
          compressionRatio: combustionEngine.compressionRatio,
          engineDisplacement: combustionEngine.engineDisplacement,
          horsePower: combustionEngine.horsePower,
          powerRPM: combustionEngine.powerRPM,
          maxTorqueNP: combustionEngine.maxTorqueNP,
          maxTorqueRPM: combustionEngine.maxTorqueRPM,
          ignitionType: combustionEngine.ignitionType,
          fuelFeedingName: combustionEngine.fuelFeeding?.name ?? "",
          refrigerationName: combustionEngine.refrigeration?.name ?? "",
          gearboxName: combustionEngine.gearbox?.name ?? "",
          distributionName: combustionEngine.distribution?.name ?? "",
        }
      : undefined,
    electricEngine: electricEngine
      ? {
          numberOfMotors: electricEngine.numberOfMotors,
          powerKW: electricEngine.powerKW,
          powerPM: electricEngine.powerPM,
          torque: electricEngine.torque,
          rpm: electricEngine.rpm,
          batteryVolts: electricEngine.batteryVolts,
          batteryCapacity: electricEngine.batteryCapacity,
          batteryName: electricEngine.batteryType?.name ?? "",
        }
      : undefined,
    motorcycleFrameTypeName: motorcycleFrameType.name,
    motorcycleFrameMaterialName: motorcycleFrameMaterial.name,
    frontSuspensionTypeName: frontSuspensionType.name,
    frontBreakTypeName: frontBreakType.name,
    rearBreakTypeName: rearBreakType.name,
  };

  return {
    id,
    legacyId,
    isActive,
    modelName,
    priece,
    companyName: company.name,
    fichaTecnica,
    description,
    motorcycleTypeName: motorcycleType.name,
    
  };
}

export async function parseMotoData(
  strapiMoto: StrapiMotorcycle
): Promise<MotoData> {
  const companyId = await getCompanyIdByName(strapiMoto.companyName);
  const typeId = await getMotorcycleTypeIdByName(strapiMoto.motorcycleTypeName);
  const imageIds = await getImageIdsByMoto125Id(strapiMoto.legacyId.toString());

  return {
    moto125Id: strapiMoto.legacyId.toString(),
    motoType: Number(typeId?.toString()) ?? null,
    company: Number(companyId?.toString()) ?? null,
    modelName: strapiMoto.modelName,
    fullName: `${strapiMoto.companyName} ${strapiMoto.modelName}`,
    description: strapiMoto.description,
    active: strapiMoto.isActive,
    priece: strapiMoto.priece,
    fichaTecnica: strapiMoto.fichaTecnica,
    images: imageIds.map((id) => id.toString()),
  };
}
