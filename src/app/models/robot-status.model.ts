// Enhanced Robot Status Models - Matches Dart structure

export interface RobotBtCurrentTaskStateStatusResponse {
  currentLocation?: BtRobotCurrentLocation;
  currentTaskState?: BtRobotTaskStatus;
}

export interface BtRobotCurrentLocation {
  isKnown?: boolean;
  location?: BtLocation;
}

export interface BtLocation {
  x?: number;
  y?: number;
  z?: number;
}

export interface BtRobotTaskStatus {
  status?: string;
  progress?: number;
}

export interface RobotStatusBtResponse {
  ip?: string;              // Robot's IP address
  v?: string;               // Firmware version
  
  apa?: PhasingStatus;      // Auto-Phasing Motor A status
  apb?: PhasingStatus;      // Auto-Phasing Motor B status
  apc?: PhasingStatus;      // Auto-Phasing Motor C status
  apall?: PhasingStatus;    // All Auto-Phasing status
  
  ha?: HomingStatus;        // Homing Motor A status
  hb?: HomingStatus;        // Homing Motor B status
  hc?: HomingStatus;        // Homing Motor C status
  hall?: HomingStatus;      // All homing status
  
  pos?: RobotTicks3D;       // Position in ticks
  posm?: RobotPoint3D;      // Robot location in meters
  posmPlat?: RobotPoint3D;  // Platform location in meters
  
  ma?: boolean;             // Motor A power
  mb?: boolean;             // Motor B power
  mc?: boolean;             // Motor C power
  
  ug?: GripperStatus;       // Upper gripper status
  lg?: GripperStatus;       // Lower gripper status
  
  msgId?: number;           // Message ID
  hasMap?: boolean;         // Map status
  al?: number[];            // Alerts
  ar?: number;              // Action Requests (bit flags)
  tig?: RobotToolType;      // Tool Type
  
  connectionState?: string; // Connection state (added for Angular)
}

export interface RobotTicks3D {
  a?: number;
  b?: number;
  c?: number;
}

export interface RobotPoint3D {
  x?: number;
  y?: number;
  z?: number;
}

// Enums

export enum BluetoothRequestType {
  None = 0,
  MoveRelative = 1,
  Status = 2,
  Gripper = 3,
  Homing = 4
}

export enum MoveType {
  Absolute = 0,
  Relative = 1
}

export enum GripperAction {
  None = 0,
  Open = 1,
  Close = 2
}

export enum GripperStatus {
  Open = 0,
  Close = 1
}

export enum HomingStatus {
  NotDone = 0,
  Fail = -2,
  Ok = 100
}

export enum PhasingStatus {
  NotDone = 0,
  InProcess = 1,
  Done = 2
}

export enum MotionServiceStatus {
  NotStarted = 0,
  InProcess = 1,
  Done = 2,
  Failed = 3
}

export enum RobotToolType {
  Unknown = 0,
  Gripper = 1,
  Vacuum = 2,
  BrushSpray = 3,
  CameraSpray = 4
}

export class ActionRequests {
  static readonly None = 0;
  static readonly BrushSpray = 1;
  static readonly CameraSpray = 2;
  static readonly Vacuum = 4;
  static readonly MilkMeterStart = 8;
  static readonly UdderLearningData = 16;
  static readonly StallLocationLearningData = 32;
  static readonly RobotTestsMode = 64;
  static readonly RobotMappingMode = 128;
}

// Helper class for parsing and formatting
export class RobotStatusHelper {
  static parseFromDataView(dataView: DataView): RobotStatusBtResponse {
    const status: RobotStatusBtResponse = {};
    let offset = 0;
    
    try {
      if (dataView.byteLength >= offset + 2) {
        status.msgId = dataView.getUint16(offset, true);
        offset += 2;
      }
      
      if (dataView.byteLength >= offset + 1) {
        status.ar = dataView.getUint8(offset);
        offset += 1;
      }
      
      if (dataView.byteLength >= offset + 1) {
        status.tig = dataView.getUint8(offset) as RobotToolType;
        offset += 1;
      }
      
      if (dataView.byteLength >= offset + 3) {
        status.ma = dataView.getUint8(offset++) !== 0;
        status.mb = dataView.getUint8(offset++) !== 0;
        status.mc = dataView.getUint8(offset++) !== 0;
      }
      
      if (dataView.byteLength >= offset + 4) {
        status.ha = dataView.getInt8(offset++) as HomingStatus;
        status.hb = dataView.getInt8(offset++) as HomingStatus;
        status.hc = dataView.getInt8(offset++) as HomingStatus;
        status.hall = dataView.getInt8(offset++) as HomingStatus;
      }
      
      if (dataView.byteLength >= offset + 4) {
        status.apa = dataView.getUint8(offset++) as PhasingStatus;
        status.apb = dataView.getUint8(offset++) as PhasingStatus;
        status.apc = dataView.getUint8(offset++) as PhasingStatus;
        status.apall = dataView.getUint8(offset++) as PhasingStatus;
      }
      
      if (dataView.byteLength >= offset + 2) {
        status.ug = dataView.getUint8(offset++) as GripperStatus;
        status.lg = dataView.getUint8(offset++) as GripperStatus;
      }
      
      if (dataView.byteLength >= offset + 12) {
        status.pos = {
          a: dataView.getInt32(offset, true),
          b: dataView.getInt32(offset + 4, true),
          c: dataView.getInt32(offset + 8, true)
        };
        offset += 12;
      }
      
      if (dataView.byteLength >= offset + 12) {
        status.posm = {
          x: dataView.getFloat32(offset, true),
          y: dataView.getFloat32(offset + 4, true),
          z: dataView.getFloat32(offset + 8, true)
        };
        offset += 12;
      }
      
      if (dataView.byteLength >= offset + 12) {
        status.posmPlat = {
          x: dataView.getFloat32(offset, true),
          y: dataView.getFloat32(offset + 4, true),
          z: dataView.getFloat32(offset + 8, true)
        };
        offset += 12;
      }
      
      if (dataView.byteLength >= offset + 1) {
        status.hasMap = dataView.getUint8(offset++) !== 0;
      }
    } catch (error) {
      console.error('Error parsing robot status:', error);
    }
    
    return status;
  }
  
  static hasActionRequest(status: RobotStatusBtResponse, flag: number): boolean {
    return ((status.ar ?? 0) & flag) !== 0;
  }
  
  static isInTestMode(status: RobotStatusBtResponse): boolean {
    return this.hasActionRequest(status, ActionRequests.RobotTestsMode);
  }
  
  static isReadyForMapping(status: RobotStatusBtResponse): boolean {
    return this.hasActionRequest(status, ActionRequests.RobotMappingMode);
  }
  
  static getToolTypeName(toolType?: RobotToolType): string {
    switch (toolType) {
      case RobotToolType.Gripper: return 'Gripper';
      case RobotToolType.Vacuum: return 'Vacuum';
      case RobotToolType.BrushSpray: return 'Brush Spray';
      case RobotToolType.CameraSpray: return 'Camera Spray';
      default: return 'Unknown';
    }
  }
  
  static getHomingStatusName(status?: HomingStatus): string {
    switch (status) {
      case HomingStatus.Ok: return 'OK';
      case HomingStatus.Fail: return 'Failed';
      case HomingStatus.NotDone: return 'Not Done';
      default: return 'Unknown';
    }
  }
  
  static getPhasingStatusName(status?: PhasingStatus): string {
    switch (status) {
      case PhasingStatus.Done: return 'Done';
      case PhasingStatus.InProcess: return 'In Progress';
      case PhasingStatus.NotDone: return 'Not Done';
      default: return 'Unknown';
    }
  }
  
  static getGripperStatusName(status?: GripperStatus): string {
    switch (status) {
      case GripperStatus.Open: return 'Open';
      case GripperStatus.Close: return 'Closed';
      default: return 'Unknown';
    }
  }
  
  static formatPosition(pos?: RobotPoint3D): string {
    if (!pos) return 'N/A';
    return `X: ${pos.x?.toFixed(2) ?? 'N/A'}, Y: ${pos.y?.toFixed(2) ?? 'N/A'}, Z: ${pos.z?.toFixed(2) ?? 'N/A'}`;
  }
  
  static formatTicks(ticks?: RobotTicks3D): string {
    if (!ticks) return 'N/A';
    return `A: ${ticks.a ?? 'N/A'}, B: ${ticks.b ?? 'N/A'}, C: ${ticks.c ?? 'N/A'}`;
  }
}

// Type alias for backward compatibility
export type RobotStatus = RobotStatusBtResponse;
