import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { 
  RobotStatusBtResponse,
  RobotToolType, 
  ActionRequests,
  RobotStatusHelper 
} from '../models/robot-status.model';

@Injectable({
  providedIn: 'root'
})
export class BleService {
  // Service and Characteristic UUIDs - UPDATE THESE WITH YOUR ROBOT'S ACTUAL GUIDs
  private readonly ROBOT_SERVICE_UUID = '5c3b4a45-41a2-4d28-afc6-b593a85a3580';
  private readonly STATUS_CHARACTERISTIC_UUID = '5c3b4a45-41a2-4d28-afc6-b593a85a3583';
  
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private statusCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  
  // Status polling
  private statusPollingSubscription?: Subscription;
  private readonly CHECK_STATUS_INTERVAL_MS = 1000;
  private readonly STATUS_RETRY_MAX = 3000;
  private statusRetryCount = 0;
  private lastMessageId?: number;
  private isReading = false; // Lock to prevent overlapping GATT operations
  
  // Observables for state management
  private connectionStateSubject = new BehaviorSubject<string>('disconnected');
  public connectionState$ = this.connectionStateSubject.asObservable();
  
  private robotStatusSubject = new BehaviorSubject<RobotStatusBtResponse | null>(null);
  public robotStatus$ = this.robotStatusSubject.asObservable();
  
  constructor() {}

  async connectToRobot(deviceName: string): Promise<boolean> {
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: deviceName ? [{ name: deviceName }] : [],
        optionalServices: [this.ROBOT_SERVICE_UUID]
      });
      
      this.connectionStateSubject.next('connecting');

      if (!this.device || !this.device.gatt) {
        console.error('Device does not support GATT');
        this.connectionStateSubject.next('disconnected');
        return false;
      }

      console.log('Device found:', this.device.name);

      this.device.addEventListener('gattserverdisconnected', () => {
        console.log('Device disconnected');
        this.handleDisconnection();
      });

      // Connect to GATT server with retry
      if (!this.device.gatt.connected) {
        this.server = await this.device.gatt.connect();
      } else {
        this.server = this.device.gatt;
      }
      console.log('Connected to GATT server');
      this.connectionStateSubject.next('connected');

      // Verify connection before getting services
      if (!this.server.connected) {
        throw new Error('GATT server disconnected immediately after connect');
      }

      console.log('Getting service:', this.ROBOT_SERVICE_UUID);
      const service = await this.server.getPrimaryService(this.ROBOT_SERVICE_UUID);
      console.log('Got robot service:', service.uuid);

      console.log('Getting characteristic:', this.STATUS_CHARACTERISTIC_UUID);
      this.statusCharacteristic = await service.getCharacteristic(this.STATUS_CHARACTERISTIC_UUID);
      console.log('Got status characteristic:', this.statusCharacteristic.uuid);

      this.startStatusPolling();

      return true;
    } catch (error: any) {
      console.error('Connection error:', error);
      this.connectionStateSubject.next('disconnected');
      
      if (error.message?.includes('User cancelled')) {
        console.log('User cancelled device selection');
      } else if (error.message?.includes('GATT Server is disconnected')) {
        console.error('Device disconnected immediately. Possible causes:');
        console.error('1. Wrong service UUID - Update ROBOT_SERVICE_UUID in ble.service.ts');
        console.error('2. Device does not support this service');
        console.error('3. Device firmware issue');
        console.error('Current service UUID:', this.ROBOT_SERVICE_UUID);
      } else if (error.name === 'NotFoundError') {
        console.error('Service or characteristic not found on device');
        console.error('Service UUID:', this.ROBOT_SERVICE_UUID);
        console.error('Characteristic UUID:', this.STATUS_CHARACTERISTIC_UUID);
      }
      return false;
    }
  }

  private startStatusPolling() {
    this.stopStatusPolling();
    
    this.statusPollingSubscription = interval(this.CHECK_STATUS_INTERVAL_MS).subscribe(async () => {
      await this.getRobotStatus();
    });
  }

  private stopStatusPolling() {
    this.statusPollingSubscription?.unsubscribe();
    this.statusPollingSubscription = undefined;
  }

  private async getRobotStatus(): Promise<RobotStatusBtResponse | null> {
    try {
      if (this.isReading) {
        console.debug('Skipping read - operation already in progress');
        return null;
      }

      if (!this.statusCharacteristic) {
        console.warn('Status characteristic not available');
        return null;
      }

      this.isReading = true;

      const value = await this.statusCharacteristic.readValue();
      const status = this.parseRobotStatus(value);
      
      if (status.msgId === this.lastMessageId) {
        this.statusRetryCount++;
        if (this.statusRetryCount >= this.STATUS_RETRY_MAX) {
          console.error('Status retry limit reached, disconnecting');
          this.isReading = false;
          await this.disconnect();
        }
        this.isReading = false;
        return status;
      }

      this.lastMessageId = status.msgId;
      this.statusRetryCount = 0;

      console.log('Robot status:', status);
      this.robotStatusSubject.next(status);
      
      this.isReading = false;
      
      return status;
    } catch (error) {
      console.error('Failed to read robot status:', error);
      this.isReading = false;
      return null;
    }
  }

  private parseRobotStatus(dataView: DataView): RobotStatusBtResponse {
    // Use the comprehensive parser from RobotStatusHelper
    const status = RobotStatusHelper.parseFromDataView(dataView);
    status.connectionState = this.connectionStateSubject.value;
    return status;
  }

  isRobotInTestMode(): boolean {
    const status = this.robotStatusSubject.value;
    return RobotStatusHelper.isInTestMode(status!);
  }

  isRobotReadyForMapping(): boolean {
    const status = this.robotStatusSubject.value;
    return RobotStatusHelper.isReadyForMapping(status!);
  }

  getToolType(): RobotToolType {
    return this.robotStatusSubject.value?.tig ?? RobotToolType.Unknown;
  }

  private handleDisconnection() {
    this.stopStatusPolling();
    this.connectionStateSubject.next('disconnected');
    this.robotStatusSubject.next(null);
    this.lastMessageId = undefined;
    this.statusRetryCount = 0;
    this.isReading = false;
  }

  async disconnect() {
    this.stopStatusPolling();
    
    if (this.server && this.server.connected) {
      this.server.disconnect();
      console.log('Disconnected from robot');
    }
    
    this.device = null;
    this.server = null;
    this.statusCharacteristic = null;
    this.connectionStateSubject.next('disconnected');
    this.robotStatusSubject.next(null);
    this.lastMessageId = undefined;
    this.statusRetryCount = 0;
    this.isReading = false;
  }

  getConnectionState(): string {
    return this.connectionStateSubject.value;
  }

  getCurrentStatus(): RobotStatusBtResponse | null {
    return this.robotStatusSubject.value;
  }
}
