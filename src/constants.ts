export const CONFIG = {
    TJ_MAX: 100,         // Max junction temp
    THROTTLE_POINT: 95,  // Temp where throttling begins
    BASE_CLOCK: 5.0,     // GHz
    MIN_CLOCK: 0.8,      // GHz
    HISTORY_SIZE: 100,   // Graph points
    CRITICAL_HEAT: 115,  // Hardware shutdown
    CRITICAL_COLD: -140, // Cold bug floor
};

export const MATERIALS = {
    ALUMINUM: { name: 'Aluminum', thermalMass: 50, conductivity: 1.0 },
    COPPER: { name: 'Copper', thermalMass: 150, conductivity: 2.5 },
    SILVER: { name: 'Silver', thermalMass: 140, conductivity: 3.0 },
    DIAMOND: { name: 'Diamond', thermalMass: 40, conductivity: 15.0 },
    GRAPHENE: { name: 'Graphene', thermalMass: 20, conductivity: 10.0 },
    AEROGEL: { name: 'Graphene Aerogel', thermalMass: 2, conductivity: 0.1 }, // Insulator? Or super conductor? Assuming high tech heatsink
    NEUTRONIUM: { name: 'Neutronium', thermalMass: 99999, conductivity: 999.0 },
};

export const COOLING_TYPES = {
    AIR: { name: 'Air Cooling', type: 'AIR', power: 0 },
    AIO: { name: 'AIO Liquid', type: 'AIO', power: 5 }, // Pump power
    TEC: { name: 'Active TEC', type: 'TEC', power: 200 }, // Peltier power
    LN2: { name: 'Liquid Nitro', type: 'LN2', power: 0 }, // Open pot
    PHASE: { name: 'Phase Change', type: 'PHASE', power: 300 }, // HVAC
    LHE: { name: 'Liquid Helium', type: 'LHE', power: 500 }, // Super cold
    BEC: { name: 'Bose-Einstein', type: 'BEC', power: 5000 }, // Absolute Zero
};

export const PHYSICS = {
    WATER_SPECIFIC_HEAT: 4.18,
    AIR_SPECIFIC_HEAT: 1.0,
    DUST_ACCUMULATION_RATE: 0.05,
};
