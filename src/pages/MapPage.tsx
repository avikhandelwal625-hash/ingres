import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, useMap, CircleMarker, Popup } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Droplets, MapPin, Info, ZoomIn, ZoomOut, Home } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { loadAssessmentUnits, AssessmentUnit, getCategoryColor } from '@/lib/groundwaterData';
import 'leaflet/dist/leaflet.css';
import type { Layer, LeafletMouseEvent } from 'leaflet';

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

interface GeoJSONFeature {
  type: string;
  properties: {
    name: string;
    code: string;
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

// Map controller component for zoom reset
function MapController({ resetTrigger }: { resetTrigger: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (resetTrigger > 0) {
      map.setView([22.5, 82], 5);
    }
  }, [resetTrigger, map]);
  
  return null;
}

// Zoom to state component
function ZoomToState({ stateName, geoData }: { stateName: string | null; geoData: GeoJSON.FeatureCollection | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (stateName && geoData) {
      const feature = geoData.features.find(
        (f) => f.properties?.name === stateName
      );
      if (feature && feature.geometry.type === 'Polygon') {
        const coords = (feature.geometry as GeoJSON.Polygon).coordinates[0];
        const lats = coords.map((c) => c[1]);
        const lngs = coords.map((c) => c[0]);
        const bounds: [[number, number], [number, number]] = [
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)]
        ];
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [stateName, geoData, map]);
  
  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [assessmentUnits, setAssessmentUnits] = useState<AssessmentUnit[]>([]);
  const [stateData, setStateData] = useState<Map<string, StateData>>(new Map());
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [showMarkers, setShowMarkers] = useState(false);

  // Load GeoJSON and assessment data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [geoResponse, units] = await Promise.all([
          fetch('/data/india-states.geojson'),
          loadAssessmentUnits()
        ]);
        
        const geo = await geoResponse.json();
        setGeoData(geo);
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
        console.error('Error loading map data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Get color for state based on average extraction
  const getStateColor = useCallback((stateName: string): string => {
    const data = stateData.get(stateName);
    if (!data) return '#9ca3af'; // Gray for no data
    
    const extraction = data.avgExtraction;
    if (extraction < 70) return '#22c55e'; // Safe - Green
    if (extraction < 90) return '#f59e0b'; // Semi-Critical - Orange
    if (extraction <= 100) return '#f97316'; // Critical - Light Red
    return '#dc2626'; // Over-Exploited - Dark Red
  }, [stateData]);

  // Style for GeoJSON features
  const getFeatureStyle = useCallback((feature: GeoJSONFeature | undefined) => {
    if (!feature) return {};
    const isHovered = hoveredState === feature.properties.name;
    const isSelected = selectedState === feature.properties.name;
    
    return {
      fillColor: getStateColor(feature.properties.name),
      weight: isSelected ? 3 : isHovered ? 2 : 1,
      opacity: 1,
      color: isSelected ? '#1e40af' : isHovered ? '#3b82f6' : '#374151',
      fillOpacity: isSelected ? 0.9 : isHovered ? 0.8 : 0.7
    };
  }, [hoveredState, selectedState, getStateColor]);

  // Event handlers for GeoJSON
  const onEachFeature = useCallback((feature: GeoJSONFeature, layer: Layer) => {
    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        setHoveredState(feature.properties.name);
        e.target.bringToFront();
      },
      mouseout: () => {
        setHoveredState(null);
      },
      click: () => {
        setSelectedState(feature.properties.name);
        setShowMarkers(true);
      }
    });
  }, []);

  const handleResetView = () => {
    setSelectedState(null);
    setShowMarkers(false);
    setResetTrigger(prev => prev + 1);
  };

  const selectedStateData = selectedState ? stateData.get(selectedState) : null;
  const filteredUnits = selectedState 
    ? assessmentUnits.filter(u => u.state === selectedState)
    : [];

  // Calculate totals for summary
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
      <header className="bg-card border-b px-4 py-3 flex items-center justify-between">
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
      <div className="bg-card border-b px-4 py-2 flex items-center gap-4 overflow-x-auto">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Total:</span>
          <Badge variant="outline">{totals.total}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Safe: {totals.safe}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span>Semi-Critical: {totals.semiCritical}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span>Critical: {totals.critical}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-red-600"></div>
          <span>Over-Exploited: {totals.overExploited}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer
            center={[22.5, 82]}
            zoom={5}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController resetTrigger={resetTrigger} />
            
            {selectedState && geoData && (
              <ZoomToState stateName={selectedState} geoData={geoData} />
            )}
            
            {geoData && (
              <GeoJSON
                key={`${hoveredState}-${selectedState}`}
                data={geoData}
                style={getFeatureStyle as any}
                onEachFeature={onEachFeature as any}
              />
            )}
            
            {/* Show markers when state is selected */}
            {showMarkers && filteredUnits.map(unit => (
              <CircleMarker
                key={unit.id}
                center={[unit.latitude, unit.longitude]}
                radius={8}
                pathOptions={{
                  color: '#1e293b',
                  weight: 1,
                  fillColor: getCategoryColor(unit.category),
                  fillOpacity: 0.9
                }}
              >
                <Popup>
                  <div className="p-1">
                    <h4 className="font-bold text-sm">{unit.blockName}</h4>
                    <p className="text-xs text-gray-600">{unit.district}, {unit.state}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <p>Category: <span className="font-medium" style={{ color: getCategoryColor(unit.category) }}>{unit.category}</span></p>
                      <p>Extraction: {unit.stageOfExtractionPercent.toFixed(1)}%</p>
                      <p>Recharge: {unit.annualRechargeMCM.toFixed(1)} MCM</p>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg border shadow-lg p-3 z-[1000]">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Legend
            </h4>
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
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-400"></div>
                <span>No Data</span>
              </div>
            </div>
          </div>

          {/* Hover tooltip */}
          {hoveredState && !selectedState && (
            <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg border shadow-lg p-3 z-[1000]">
              <h4 className="font-semibold">{hoveredState}</h4>
              {stateData.get(hoveredState) ? (
                <p className="text-sm text-muted-foreground">
                  Click to view details
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-card border-l overflow-y-auto">
          {selectedState && selectedStateData ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{selectedState}</h3>
                <Button variant="ghost" size="sm" onClick={handleResetView}>
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

              {/* District/Block List */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Assessment Units ({filteredUnits.length})</CardTitle>
                </CardHeader>
                <CardContent className="max-h-64 overflow-y-auto">
                  <div className="space-y-2">
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
                  Click on any state to view detailed groundwater assessment data
                </p>
              </div>

              {/* Quick Stats */}
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">States with Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {Array.from(stateData.entries()).map(([name, data]) => (
                      <button
                        key={name}
                        onClick={() => {
                          setSelectedState(name);
                          setShowMarkers(true);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded hover:bg-muted transition-colors text-left"
                      >
                        <span className="text-sm">{name}</span>
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
        </div>
      </div>
    </div>
  );
}
