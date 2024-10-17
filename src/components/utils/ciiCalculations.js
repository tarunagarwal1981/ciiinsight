// src/utils/ciiCalculations.js

const VESSEL_TYPE_MAPPING = {
  'ASPHALT/BITUMEN TANKER': 'tanker',
  'BULK CARRIER': 'bulk_carrier',
  'CEMENT CARRIER': 'bulk_carrier',
  'CHEM/PROD TANKER': 'tanker',
  'CHEMICAL TANKER': 'tanker',
  'Chemical/Products Tanker': 'tanker',
  'Combination Carrier': 'combination_carrier',
  'CONTAINER': 'container_ship',
  'Container Ship': 'container_ship',
  'Container/Ro-Ro Ship': 'ro_ro_cargo_ship',
  'Crude Oil Tanker': 'tanker',
  'Diving support vessel': null,
  'Gas Carrier': 'gas_carrier',
  'General Cargo Ship': 'general_cargo_ship',
  'LNG CARRIER': 'lng_carrier',
  'LPG CARRIER': 'gas_carrier',
  'LPG Tanker': 'gas_carrier',
  'Offshore Support Vessel': null,
  'OIL TANKER': 'tanker',
  'Other Ship Type': null,
  'Passenger Ship': 'cruise_passenger_ship',
  'Products Tanker': 'tanker',
  'Refrigerated Cargo Ship': 'refrigerated_cargo_carrier',
  'Ro-ro passenger ship': 'ro_ro_passenger_ship',
  'Ro-Ro Ship': 'ro_ro_cargo_ship',
  'Vehicle Carrier': 'ro_ro_cargo_ship_vc'
};

function calculateReferenceCII(capacity, shipType) {
  const params = {
    'bulk_carrier': [
      {capacityThreshold: 279000, a: 4745, c: 0.622, useDWT: true},
      {capacityThreshold: Infinity, a: 4745, c: 0.622, useDWT: false}
    ],
    'gas_carrier': [
      {capacityThreshold: 65000, a: 144050000000, c: 2.071, useDWT: true},
      {capacityThreshold: Infinity, a: 8104, c: 0.639, useDWT: true}
    ],
    'tanker': [{capacityThreshold: Infinity, a: 5247, c: 0.61, useDWT: true}],
    'container_ship': [{capacityThreshold: Infinity, a: 1984, c: 0.489, useDWT: true}],
    'general_cargo_ship': [
      {capacityThreshold: 20000, a: 31948, c: 0.792, useDWT: true},
      {capacityThreshold: Infinity, a: 588, c: 0.3885, useDWT: true}
    ],
    'refrigerated_cargo_carrier': [{capacityThreshold: Infinity, a: 4600, c: 0.557, useDWT: true}],
    'combination_carrier': [{capacityThreshold: Infinity, a: 40853, c: 0.812, useDWT: true}],
    'lng_carrier': [
      {capacityThreshold: 100000, a: 144790000000000, c: 2.673, useDWT: true},
      {capacityThreshold: 65000, a: 144790000000000, c: 2.673, useDWT: true},
      {capacityThreshold: Infinity, a: 9.827, c: 0, useDWT: true}
    ],
    'ro_ro_cargo_ship_vc': [{capacityThreshold: Infinity, a: 5739, c: 0.631, useDWT: false}],
    'ro_ro_cargo_ship': [{capacityThreshold: Infinity, a: 10952, c: 0.637, useDWT: true}],
    'ro_ro_passenger_ship': [{capacityThreshold: Infinity, a: 7540, c: 0.587, useDWT: false}],
    'cruise_passenger_ship': [{capacityThreshold: Infinity, a: 930, c: 0.383, useDWT: false}]
  };

  const shipParams = params[shipType.toLowerCase()];
  if (!shipParams) {
    throw new Error(`Unknown ship type: ${shipType}`);
  }

  for (const param of shipParams) {
    if (capacity <= param.capacityThreshold) {
      const { a, c } = param;
      const usedCapacity = param.useDWT ? capacity : param.capacityThreshold;
      return a * Math.pow(usedCapacity, -c);
    }
  }

  throw new Error(`Capacity ${capacity} is out of range for ship type ${shipType}`);
}

function calculateRequiredCII(referenceCII, year) {
  const reductionFactors = {2023: 0.95, 2024: 0.93, 2025: 0.91, 2026: 0.89};
  return referenceCII * (reductionFactors[year] || 1.0);
}

function calculateCIIRating(attainedCII, requiredCII, shipType, capacity) {
  const ddVectors = {
    'bulk_carrier': [
      {capacityThreshold: 297000, d: [0.86, 0.94, 1.06, 1.18]},
      {capacityThreshold: Infinity, d: [0.86, 0.94, 1.06, 1.18]}
    ],
    'tanker': [{capacityThreshold: Infinity, d: [0.82, 0.93, 1.08, 1.28]}],
    'container_ship': [{capacityThreshold: Infinity, d: [0.83, 0.94, 1.07, 1.19]}],
    'gas_carrier': [
      {capacityThreshold: 65000, d: [0.85, 0.95, 1.06, 1.25]},
      {capacityThreshold: Infinity, d: [0.81, 0.91, 1.12, 1.44]}
    ],
    'lng_carrier': [
      {capacityThreshold: 65000, d: [0.78, 0.92, 1.10, 1.37]},
      {capacityThreshold: 100000, d: [0.78, 0.92, 1.10, 1.37]},
      {capacityThreshold: Infinity, d: [0.89, 0.98, 1.06, 1.13]}
    ],
    'ro_ro_cargo_ship': [{capacityThreshold: Infinity, d: [0.66, 0.90, 1.11, 1.37]}],
    'general_cargo_ship': [
      {capacityThreshold: 20000, d: [0.83, 0.94, 1.06, 1.19]},
      {capacityThreshold: Infinity, d: [0.83, 0.94, 1.06, 1.19]}
    ],
    'refrigerated_cargo_carrier': [{capacityThreshold: Infinity, d: [0.78, 0.91, 1.07, 1.20]}],
    'combination_carrier': [{capacityThreshold: Infinity, d: [0.87, 0.96, 1.06, 1.14]}],
    'cruise_passenger_ship': [{capacityThreshold: Infinity, d: [0.87, 0.95, 1.06, 1.16]}],
    'ro_ro_cargo_ship_vc': [{capacityThreshold: Infinity, d: [0.86, 0.94, 1.06, 1.16]}],
    'ro_ro_passenger_ship': [{capacityThreshold: Infinity, d: [0.72, 0.90, 1.12, 1.41]}]
  };

  if (!shipType) {
    throw new Error("Ship type is null, cannot proceed with CII rating calculation.");
  }

  const shipParams = ddVectors[shipType.toLowerCase()];
  if (!shipParams) {
    throw new Error(`Unknown ship type: ${shipType}`);
  }

  let d1, d2, d3, d4;
  for (const param of shipParams) {
    if (capacity <= param.capacityThreshold) {
      [d1, d2, d3, d4] = param.d;
      break;
    }
  }

  if (!d1) {
    throw new Error(`Capacity ${capacity} is out of range for ship type ${shipType}`);
  }

  const superior = Math.exp(d1) * requiredCII;
  const lower = Math.exp(d2) * requiredCII;
  const upper = Math.exp(d3) * requiredCII;
  const inferior = Math.exp(d4) * requiredCII;

  if (attainedCII <= superior) return 'A';
  if (attainedCII <= lower) return 'B';
  if (attainedCII <= upper) return 'C';
  if (attainedCII <= inferior) return 'D';
  return 'E';
}

export function calculateCII(vesselData) {
  const {
    Vessel: vesselName,
    vessel_type: vesselType,
    capacity,
    Attained_AER: attainedAER,
    CO2Emission: co2Emission,
    Transportwork: transportWork
  } = vesselData;

  const imoShipType = VESSEL_TYPE_MAPPING[vesselType];
  if (!imoShipType) {
    throw new Error(`Unsupported vessel type: ${vesselType}`);
  }

  const referenceCII = calculateReferenceCII(capacity, imoShipType);
  const requiredCII = calculateRequiredCII(referenceCII, new Date().getFullYear());
  const ciiRating = calculateCIIRating(attainedAER, requiredCII, imoShipType, capacity);

  return {
    vesselName,
    vesselType,
    capacity,
    attainedAER,
    referenceCII,
    requiredCII,
    ciiRating,
    co2Emission,
    transportWork
  };
}

export function projectCII(currentCII, yearsAhead = 5) {
  const projectedCII = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < yearsAhead; i++) {
    const year = currentYear + i;
    const reductionFactor = 1 - (0.02 * i);  // 2% reduction per year
    projectedCII.push({
      year,
      projectedCII: currentCII * reductionFactor
    });
  }
  return projectedCII;
}
