// Platform Map Models - Matches JSON structure for robot mapping

export enum LocationType {
  Unknown = 0,
  MilkStall = 1,
  Parking = 2,
  BrusherStation = 3,
  DipperStation = 4,
  WashStation = 5,
  LeftCup = 6,
  RightCup = 7,
  Count = 8
}

export interface Location {
  Type: LocationType;
  ID: number;
}

export interface PlatformMapLocation {
  Index: number;
  Location: Location;
  XLocationInMeters: number;
  YLocationInMeters: number;
  ZLocationInMeters: number;
}

export interface MapData {
  PlatformID: string | null;
  IsNegative: boolean;
  FarmId: number;
  SiteName: string;
  Locations: PlatformMapLocation[];
}

export interface PlatformMap {
  PlatformNumber: number;
  MapTime: string;
  MapName: string;
  IsActive: boolean;
  Map: MapData;
}

// Helper function to get location type display name
export function getLocationTypeName(type: LocationType): string {
  switch (type) {
    case LocationType.Unknown:
      return 'Unknown';
    case LocationType.MilkStall:
      return 'Milk Stall';
    case LocationType.Parking:
      return 'Parking';
    case LocationType.BrusherStation:
      return 'Brusher Station';
    case LocationType.DipperStation:
      return 'Dipper Station';
    case LocationType.WashStation:
      return 'Wash Station';
    case LocationType.LeftCup:
      return 'Left Cup';
    case LocationType.RightCup:
      return 'Right Cup';
    case LocationType.Count:
      return 'Count';
    default:
      return 'Unknown';
  }
}
