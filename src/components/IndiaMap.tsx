import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Droplets, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  AssessmentUnit,
  WaterQualitySample,
  loadAssessmentUnits,
  loadWaterQuality,
  getCategoryColor,
} from '@/lib/groundwaterData';

interface IndiaMapProps {
  className?: string;
}

const IndiaMap: React.FC<IndiaMapProps> = ({ className }) => {
  const [assessmentUnits, setAssessmentUnits] = useState<AssessmentUnit[]>([]);
  const [waterQuality, setWaterQuality] = useState<WaterQualitySample[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<AssessmentUnit | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<WaterQualitySample | null>(null);
  const [activeTab, setActiveTab] = useState('assessment');
  const [filterState, setFilterState] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [units, quality] = await Promise.all([
          loadAssessmentUnits(),
          loadWaterQuality(),
        ]);
        setAssessmentUnits(units);
        setWaterQuality(quality);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const states = [...new Set(assessmentUnits.map(u => u.state))];
  const categories = ['Safe', 'Semi-Critical', 'Critical', 'Over-Exploited'];

  const filteredUnits = assessmentUnits.filter(unit => {
    if (filterState !== 'all' && unit.state !== filterState) return false;
    if (filterCategory !== 'all' && unit.category !== filterCategory) return false;
    return true;
  });

  const filteredQuality = waterQuality.filter(sample => {
    if (filterState !== 'all' && sample.state !== filterState) return false;
    return true;
  });

  // Convert lat/lng to SVG coordinates (approximate India bounds)
  const toSVG = (lat: number, lng: number) => {
    const minLat = 8, maxLat = 35;
    const minLng = 68, maxLng = 97;
    const x = ((lng - minLng) / (maxLng - minLng)) * 600 + 50;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 500 + 50;
    return { x, y };
  };

  const getCategoryStats = () => {
    const stats = { Safe: 0, 'Semi-Critical': 0, Critical: 0, 'Over-Exploited': 0 };
    filteredUnits.forEach(unit => {
      stats[unit.category]++;
    });
    return stats;
  };

  const stats = getCategoryStats();

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-[600px]">
          <div className="animate-pulse text-muted-foreground">Loading groundwater data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          India Groundwater Map
        </CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger value="assessment" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Assessment Units
            </TabsTrigger>
            <TabsTrigger value="quality" className="text-xs">
              <Droplets className="h-3 w-3 mr-1" />
              Water Quality
            </TabsTrigger>
          </TabsList>

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/50 rounded-lg">
            {Object.entries(stats).map(([category, count]) => (
              <Badge
                key={category}
                variant="outline"
                className="text-xs"
                style={{ borderColor: getCategoryColor(category), color: getCategoryColor(category) }}
              >
                {category}: {count}
              </Badge>
            ))}
          </div>

          <TabsContent value="assessment" className="mt-0">
            <div className="relative bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg overflow-hidden">
              <svg viewBox="0 0 700 600" className="w-full h-[400px]">
                {/* India outline (simplified) */}
                <path
                  d="M200,100 Q350,50 500,100 L550,200 Q580,300 550,400 L500,500 Q400,550 300,500 L200,400 Q150,300 150,200 Z"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  opacity="0.3"
                />
                
                {/* Assessment unit markers */}
                {filteredUnits.map(unit => {
                  const { x, y } = toSVG(unit.latitude, unit.longitude);
                  const isSelected = selectedUnit?.id === unit.id;
                  return (
                    <g key={unit.id} className="cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 12 : 8}
                        fill={getCategoryColor(unit.category)}
                        opacity={isSelected ? 1 : 0.8}
                        stroke={isSelected ? 'hsl(var(--foreground))' : 'white'}
                        strokeWidth={isSelected ? 3 : 1.5}
                        onClick={() => setSelectedUnit(unit)}
                        className="transition-all duration-200 hover:opacity-100"
                      >
                        <title>{unit.blockName} - {unit.category}</title>
                      </circle>
                      {isSelected && (
                        <circle
                          cx={x}
                          cy={y}
                          r={18}
                          fill="none"
                          stroke={getCategoryColor(unit.category)}
                          strokeWidth="2"
                          opacity="0.5"
                          className="animate-pulse"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 text-xs">
                <div className="font-medium mb-1">Extraction Status</div>
                {categories.map(cat => (
                  <div key={cat} className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(cat) }}
                    />
                    <span>{cat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Unit Info */}
            {selectedUnit && (
              <Card className="mt-2 border-l-4" style={{ borderLeftColor: getCategoryColor(selectedUnit.category) }}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{selectedUnit.blockName}</h4>
                      <p className="text-xs text-muted-foreground">{selectedUnit.district}, {selectedUnit.state}</p>
                    </div>
                    <Badge style={{ backgroundColor: getCategoryColor(selectedUnit.category) }}>
                      {selectedUnit.category}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Extraction:</span>
                      <span className="ml-1 font-medium">{selectedUnit.stageOfExtractionPercent.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recharge:</span>
                      <span className="ml-1 font-medium">{selectedUnit.annualRechargeMCM.toFixed(1)} MCM</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Use:</span>
                      <span className="ml-1 font-medium">{selectedUnit.currentExtractionMCM.toFixed(1)} MCM</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rainfall:</span>
                      <span className="ml-1 font-medium">{selectedUnit.rainfallMM.toFixed(0)} mm</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="quality" className="mt-0">
            <div className="relative bg-gradient-to-b from-teal-50 to-teal-100 dark:from-teal-950/20 dark:to-teal-900/20 rounded-lg overflow-hidden">
              <svg viewBox="0 0 700 600" className="w-full h-[400px]">
                {/* India outline */}
                <path
                  d="M200,100 Q350,50 500,100 L550,200 Q580,300 550,400 L500,500 Q400,550 300,500 L200,400 Q150,300 150,200 Z"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  opacity="0.3"
                />
                
                {/* Water quality markers */}
                {filteredQuality.map(sample => {
                  const { x, y } = toSVG(sample.latitude, sample.longitude);
                  const hasIssues = sample.arsenicExceedsLimit || sample.fluorideExceedsLimit || sample.nitrateExceedsLimit;
                  const isSelected = selectedQuality?.id === sample.id;
                  return (
                    <g key={sample.id} className="cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 12 : 7}
                        fill={hasIssues ? '#ef4444' : '#22c55e'}
                        opacity={isSelected ? 1 : 0.7}
                        stroke={isSelected ? 'hsl(var(--foreground))' : 'white'}
                        strokeWidth={isSelected ? 3 : 1.5}
                        onClick={() => setSelectedQuality(sample)}
                        className="transition-all duration-200 hover:opacity-100"
                      >
                        <title>{sample.location} - {hasIssues ? 'Issues Detected' : 'Good Quality'}</title>
                      </circle>
                    </g>
                  );
                })}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 text-xs">
                <div className="font-medium mb-1">Water Quality</div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Good Quality</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  <span>Issues Detected</span>
                </div>
              </div>
            </div>

            {/* Selected Quality Info */}
            {selectedQuality && (
              <Card className="mt-2">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{selectedQuality.location}</h4>
                      <p className="text-xs text-muted-foreground">{selectedQuality.district}, {selectedQuality.state}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{selectedQuality.wellType}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                    <div className={selectedQuality.phExceedsLimit ? 'text-red-500' : ''}>
                      <span className="text-muted-foreground">pH:</span>
                      <span className="ml-1 font-medium">{selectedQuality.ph.toFixed(2)}</span>
                    </div>
                    <div className={selectedQuality.tdsExceedsLimit ? 'text-red-500' : ''}>
                      <span className="text-muted-foreground">TDS:</span>
                      <span className="ml-1 font-medium">{selectedQuality.tds.toFixed(0)}</span>
                    </div>
                    <div className={selectedQuality.fluorideExceedsLimit ? 'text-red-500' : ''}>
                      <span className="text-muted-foreground">Fluoride:</span>
                      <span className="ml-1 font-medium">{selectedQuality.fluoride.toFixed(2)}</span>
                    </div>
                    <div className={selectedQuality.arsenicExceedsLimit ? 'text-red-500' : ''}>
                      <span className="text-muted-foreground">Arsenic:</span>
                      <span className="ml-1 font-medium">{selectedQuality.arsenic.toFixed(4)}</span>
                    </div>
                    <div className={selectedQuality.nitrateExceedsLimit ? 'text-red-500' : ''}>
                      <span className="text-muted-foreground">Nitrate:</span>
                      <span className="ml-1 font-medium">{selectedQuality.nitrate.toFixed(2)}</span>
                    </div>
                    <div className={selectedQuality.ironExceedsLimit ? 'text-red-500' : ''}>
                      <span className="text-muted-foreground">Iron:</span>
                      <span className="ml-1 font-medium">{selectedQuality.iron.toFixed(3)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default IndiaMap;
