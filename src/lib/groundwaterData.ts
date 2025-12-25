export interface AssessmentUnit {
  id: string;
  state: string;
  district: string;
  blockName: string;
  year: number;
  areaSqKm: number;
  annualRechargeMCM: number;
  extractableResourceMCM: number;
  currentExtractionMCM: number;
  stageOfExtractionPercent: number;
  category: 'Safe' | 'Semi-Critical' | 'Critical' | 'Over-Exploited';
  latitude: number;
  longitude: number;
  rainfallMM: number;
  population: number;
}

export interface WaterQualitySample {
  id: string;
  state: string;
  district: string;
  location: string;
  latitude: number;
  longitude: number;
  sampleDate: string;
  wellDepthM: number;
  wellType: string;
  ph: number;
  phExceedsLimit: boolean;
  ec: number;
  tds: number;
  tdsExceedsLimit: boolean;
  hardness: number;
  chloride: number;
  chlorideExceedsLimit: boolean;
  nitrate: number;
  nitrateExceedsLimit: boolean;
  fluoride: number;
  fluorideExceedsLimit: boolean;
  iron: number;
  ironExceedsLimit: boolean;
  arsenic: number;
  arsenicExceedsLimit: boolean;
}

export interface DWLRReading {
  stationId: string;
  state: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  waterLevelMBGL: number;
  temperatureC: number;
  batteryVoltage: number;
  signalStrength: number;
  dataQuality: string;
}

export async function loadAssessmentUnits(): Promise<AssessmentUnit[]> {
  const response = await fetch('/data/assessment_units.csv');
  const text = await response.text();
  const lines = text.trim().split('\n');
  const data: AssessmentUnit[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length >= 15) {
      data.push({
        id: cols[0],
        state: cols[1],
        district: cols[2],
        blockName: cols[3],
        year: parseInt(cols[4]),
        areaSqKm: parseFloat(cols[5]),
        annualRechargeMCM: parseFloat(cols[6]),
        extractableResourceMCM: parseFloat(cols[7]),
        currentExtractionMCM: parseFloat(cols[8]),
        stageOfExtractionPercent: parseFloat(cols[9]),
        category: cols[10] as AssessmentUnit['category'],
        latitude: parseFloat(cols[11]),
        longitude: parseFloat(cols[12]),
        rainfallMM: parseFloat(cols[13]),
        population: parseInt(cols[14]),
      });
    }
  }

  return data;
}

export async function loadWaterQuality(): Promise<WaterQualitySample[]> {
  const response = await fetch('/data/groundwater_quality_data.csv');
  const text = await response.text();
  const lines = text.trim().split('\n');
  const data: WaterQualitySample[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length >= 27) {
      data.push({
        id: cols[0],
        state: cols[1],
        district: cols[2],
        location: cols[3],
        latitude: parseFloat(cols[4]),
        longitude: parseFloat(cols[5]),
        sampleDate: cols[6],
        wellDepthM: parseFloat(cols[7]),
        wellType: cols[8],
        ph: parseFloat(cols[9]),
        phExceedsLimit: cols[10] === 'Yes',
        ec: parseFloat(cols[11]),
        tds: parseFloat(cols[13]),
        tdsExceedsLimit: cols[14] === 'Yes',
        hardness: parseFloat(cols[15]),
        chloride: parseFloat(cols[17]),
        chlorideExceedsLimit: cols[18] === 'Yes',
        nitrate: parseFloat(cols[19]),
        nitrateExceedsLimit: cols[20] === 'Yes',
        fluoride: parseFloat(cols[21]),
        fluorideExceedsLimit: cols[22] === 'Yes',
        iron: parseFloat(cols[23]),
        ironExceedsLimit: cols[24] === 'Yes',
        arsenic: parseFloat(cols[25]),
        arsenicExceedsLimit: cols[26] === 'Yes',
      });
    }
  }

  return data;
}

export async function loadDWLRData(): Promise<DWLRReading[]> {
  const response = await fetch('/data/dwlr_realtime_data.csv');
  const text = await response.text();
  const lines = text.trim().split('\n');
  const data: DWLRReading[] = [];

  // Only load unique stations (first reading per station)
  const seenStations = new Set<string>();

  for (let i = 1; i < Math.min(lines.length, 500); i++) {
    const cols = lines[i].split(',');
    if (cols.length >= 10 && !seenStations.has(cols[0])) {
      seenStations.add(cols[0]);
      data.push({
        stationId: cols[0],
        state: cols[1],
        latitude: parseFloat(cols[2]),
        longitude: parseFloat(cols[3]),
        timestamp: cols[4],
        waterLevelMBGL: parseFloat(cols[5]),
        temperatureC: parseFloat(cols[6]),
        batteryVoltage: parseFloat(cols[7]),
        signalStrength: parseInt(cols[8]),
        dataQuality: cols[9],
      });
    }
  }

  return data;
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'Safe':
      return '#22c55e';
    case 'Semi-Critical':
      return '#f59e0b';
    case 'Critical':
      return '#f97316';
    case 'Over-Exploited':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}
