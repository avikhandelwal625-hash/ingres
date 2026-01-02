import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Droplets, MapPin, Home, ZoomIn, ZoomOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { loadAssessmentUnits, AssessmentUnit, getCategoryColor } from '@/lib/groundwaterData';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StateData {
  name: string;
  totalUnits: number;
  safe: number;
  semiCritical: number;
  critical: number;
  overExploited: number;
  avgExtraction: number;
  totalRecharge: number;
  totalExtraction: number;
}

// Simplified India state paths (approximate SVG paths for major states)
const INDIA_STATES: { [key: string]: { path: string; center: [number, number] } } = {
  'Karnataka': {
    path: 'M180,340 L200,320 L230,330 L250,350 L240,380 L220,400 L190,390 L170,370 Z',
    center: [210, 360]
  },
  'Maharashtra': {
    path: 'M120,260 L170,250 L220,260 L250,290 L240,330 L200,340 L160,330 L130,300 Z',
    center: [185, 295]
  },
  'Gujarat': {
    path: 'M80,220 L130,200 L160,220 L150,260 L120,280 L80,270 L60,240 Z',
    center: [110, 240]
  },
  'Rajasthan': {
    path: 'M100,120 L160,100 L200,120 L210,170 L180,210 L130,220 L90,190 L80,150 Z',
    center: [145, 165]
  },
  'Uttar Pradesh': {
    path: 'M200,140 L260,120 L320,140 L340,180 L320,220 L270,230 L220,210 L200,170 Z',
    center: [270, 175]
  },
};

// Get color for extraction percentage
function getExtractionColor(percentage: number): string {
  if (percentage < 70) return '#22c55e'; // Safe - Green
  if (percentage < 90) return '#f59e0b'; // Semi-Critical - Orange
  if (percentage <= 100) return '#f97316'; // Critical - Light Red/Orange
  return '#dc2626'; // Over-Exploited - Dark Red
}

export default function MapPage() {
  const navigate = useNavigate();
  const [assessmentUnits, setAssessmentUnits] = useState<AssessmentUnit[]>([]);
  const [stateData, setStateData] = useState<Map<string, StateData>>(new Map());
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Load assessment data
  useEffect(() => {
    const loadData = async () => {
      try {
        const units = await loadAssessmentUnits();
        setAssessmentUnits(units);
        
        // Aggregate data by state
        const stateMap = new Map<string, StateData>();
        units.forEach(unit => {
          const existing = stateMap.get(unit.state) || {
            name: unit.state,
            totalUnits: 0,
            safe: 0,
            semiCritical: 0,
            critical: 0,
            overExploited: 0,
            avgExtraction: 0,
            totalRecharge: 0,
            totalExtraction: 0
          };
          
          existing.totalUnits += 1;
          existing.totalRecharge += unit.annualRechargeMCM;
          existing.totalExtraction += unit.currentExtractionMCM;
          
          switch (unit.category) {
            case 'Safe': existing.safe += 1; break;
            case 'Semi-Critical': existing.semiCritical += 1; break;
            case 'Critical': existing.critical += 1; break;
            case 'Over-Exploited': existing.overExploited += 1; break;
          }
          
          stateMap.set(unit.state, existing);
        });
        
        // Calculate average extraction percentage
        stateMap.forEach((data, key) => {
          data.avgExtraction = (data.totalExtraction / data.totalRecharge) * 100;
          stateMap.set(key, data);
        });
        
        setStateData(stateMap);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleStateClick = (stateName: string) => {
    setSelectedState(stateName);
  };

  const handleResetView = () => {
    setSelectedState(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const selectedStateData = selectedState ? stateData.get(selectedState) : null;
  const filteredUnits = selectedState 
    ? assessmentUnits.filter(u => u.state === selectedState)
    : [];

  // Calculate totals
  const totals = {
    safe: Array.from(stateData.values()).reduce((sum, d) => sum + d.safe, 0),
    semiCritical: Array.from(stateData.values()).reduce((sum, d) => sum + d.semiCritical, 0),
    critical: Array.from(stateData.values()).reduce((sum, d) => sum + d.critical, 0),
    overExploited: Array.from(stateData.values()).reduce((sum, d) => sum + d.overExploited, 0),
    total: Array.from(stateData.values()).reduce((sum, d) => sum + d.totalUnits, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Droplets className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-hero-gradient text-primary-foreground">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Groundwater Assessment Map</h1>
              <p className="text-xs text-muted-foreground">Interactive India Map - 2024-2025</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleResetView}>
            <Home className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-card border-b px-4 py-2 flex items-center gap-4 overflow-x-auto flex-shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Total:</span>
          <Badge variant="outline">{totals.total}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm whitespace-nowrap">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Safe: {totals.safe}</span>
        </div>
        <div className="flex items-center gap-2 text-sm whitespace-nowrap">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span>Semi-Critical: {totals.semiCritical}</span>
        </div>
        <div className="flex items-center gap-2 text-sm whitespace-nowrap">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span>Critical: {totals.critical}</span>
        </div>
        <div className="flex items-center gap-2 text-sm whitespace-nowrap">
          <div className="w-3 h-3 rounded-full bg-red-600"></div>
          <span>Over-Exploited: {totals.overExploited}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative bg-muted/30 overflow-hidden">
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={() => setZoom(z => Math.min(z + 0.2, 2))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>

          {/* SVG Map */}
          <div className="w-full h-full flex items-center justify-center p-4">
            <svg
              viewBox="0 0 400 500"
              className="w-full h-full max-w-xl"
              style={{ transform: `scale(${zoom})` }}
            >
              {/* India outline (simplified) */}
              <path
                d="M50,50 L200,30 L350,80 L380,200 L350,350 L300,450 L200,480 L100,450 L50,350 L30,200 Z"
                fill="hsl(var(--muted))"
                stroke="hsl(var(--border))"
                strokeWidth="2"
              />
              
              {/* State regions */}
              {Object.entries(INDIA_STATES).map(([stateName, stateInfo]) => {
                const data = stateData.get(stateName);
                const fillColor = data ? getExtractionColor(data.avgExtraction) : '#9ca3af';
                const isHovered = hoveredState === stateName;
                const isSelected = selectedState === stateName;
                
                return (
                  <g key={stateName}>
                    <path
                      d={stateInfo.path}
                      fill={fillColor}
                      stroke={isSelected ? '#1e40af' : isHovered ? '#3b82f6' : '#374151'}
                      strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                      opacity={isSelected ? 1 : isHovered ? 0.9 : 0.8}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredState(stateName)}
                      onMouseLeave={() => setHoveredState(null)}
                      onClick={() => handleStateClick(stateName)}
                    />
                    <text
                      x={stateInfo.center[0]}
                      y={stateInfo.center[1]}
                      textAnchor="middle"
                      fontSize="10"
                      fill="white"
                      fontWeight="bold"
                      className="pointer-events-none"
                      style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                    >
                      {stateName.substring(0, 3).toUpperCase()}
                    </text>
                  </g>
                );
              })}

              {/* Data points for selected state */}
              {selectedState && filteredUnits.map((unit, idx) => {
                // Map lat/lng to approximate SVG coordinates
                const x = ((unit.longitude - 68) / 30) * 350 + 25;
                const y = 480 - ((unit.latitude - 8) / 28) * 430;
                
                return (
                  <circle
                    key={unit.id}
                    cx={x}
                    cy={y}
                    r={6}
                    fill={getCategoryColor(unit.category)}
                    stroke="#1e293b"
                    strokeWidth={1}
                    className="cursor-pointer"
                  >
                    <title>{`${unit.blockName}: ${unit.stageOfExtractionPercent.toFixed(0)}%`}</title>
                  </circle>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg border shadow-lg p-3">
            <h4 className="font-semibold text-sm mb-2">Legend (Extraction %)</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span>Safe (&lt;70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500"></div>
                <span>Semi-Critical (70-90%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500"></div>
                <span>Critical (90-100%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-600"></div>
                <span>Over-Exploited (&gt;100%)</span>
              </div>
            </div>
          </div>

          {/* Hover tooltip */}
          {hoveredState && !selectedState && stateData.get(hoveredState) && (
            <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg border shadow-lg p-3">
              <h4 className="font-semibold">{hoveredState}</h4>
              <p className="text-sm text-muted-foreground">
                {stateData.get(hoveredState)?.totalUnits} assessment units
              </p>
              <p className="text-sm">
                Avg extraction: {stateData.get(hoveredState)?.avgExtraction.toFixed(0)}%
              </p>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-card border-l flex flex-col flex-shrink-0">
          <ScrollArea className="flex-1">
            {selectedState && selectedStateData ? (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">{selectedState}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedState(null)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>

                {/* State Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedStateData.totalRecharge.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Recharge (MCM)</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedStateData.totalExtraction.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Extraction (MCM)</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Category Breakdown */}
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        Safe
                      </span>
                      <Badge variant="secondary">{selectedStateData.safe}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        Semi-Critical
                      </span>
                      <Badge variant="secondary">{selectedStateData.semiCritical}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        Critical
                      </span>
                      <Badge variant="secondary">{selectedStateData.critical}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-600"></div>
                        Over-Exploited
                      </span>
                      <Badge variant="secondary">{selectedStateData.overExploited}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Assessment Units List */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Assessment Units ({filteredUnits.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredUnits.map(unit => (
                        <div 
                          key={unit.id}
                          className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium">{unit.blockName}</p>
                              <p className="text-xs text-muted-foreground">{unit.district}</p>
                            </div>
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: getCategoryColor(unit.category),
                                color: getCategoryColor(unit.category)
                              }}
                            >
                              {unit.stageOfExtractionPercent.toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="p-4">
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Select a State</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on any colored region to view detailed groundwater data
                  </p>
                </div>

                {/* States List */}
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Available States</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {Array.from(stateData.entries()).map(([name, data]) => (
                        <button
                          key={name}
                          onClick={() => handleStateClick(name)}
                          className="w-full flex items-center justify-between p-2 rounded hover:bg-muted transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: getExtractionColor(data.avgExtraction) }}
                            ></div>
                            <span className="text-sm">{name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {data.totalUnits} units
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
