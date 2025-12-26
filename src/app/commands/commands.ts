import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { BleService } from '../services/ble.service';
import { RobotCommandService } from '../services/robot-command.service';
import { RobotTaskType, MotorType } from '../models/robot-endpoints';

interface DeviceItem {
  type: RobotTaskType;
  index: number;
}

@Component({
  selector: 'app-commands',
  imports: [CommonModule, FormsModule, NgbPopover],
  templateUrl: './commands.html'
})
export class Commands {
  @ViewChild('devicePopover') devicePopover?: NgbPopover;
  @ViewChild('motorPopover') motorPopover?: NgbPopover;

  // Only 5 device types for the simplified UI
  protected readonly deviceTypes: Array<{ type: RobotTaskType; label: string; icon: string }> = [
    { type: RobotTaskType.GoingToParking, label: 'Parking', icon: 'fa-square-parking' },
    { type: RobotTaskType.GoingToStall, label: 'Stall', icon: 'fa-house' },
    { type: RobotTaskType.GoingToBrushStation, label: 'Brush', icon: 'fa-brush' },
    { type: RobotTaskType.GoingToDipperStation, label: 'Dipp', icon: 'fa-droplet' },
    { type: RobotTaskType.GoingToWashStation, label: 'Wash', icon: 'fa-shower' }
  ];

  protected readonly selectedDeviceType = signal<RobotTaskType | ''>('');
  protected readonly selectedIndex = signal<number>(1);
  protected readonly deviceItems = signal<DeviceItem[]>([]);
  protected readonly commandSent = signal(false);
  protected readonly selectedMotorType = signal<MotorType>(MotorType.All);
  protected readonly stopCommandSent = signal(false);

  // Temporary selections for the popover dialog
  protected readonly tempDeviceType = signal<RobotTaskType | ''>('');
  protected readonly tempIndex = signal<number>(1);
  protected readonly tempMotorType = signal<MotorType>(MotorType.All);

  // Generate indices from 1 to 10
  protected readonly indices = Array.from({ length: 10 }, (_, i) => i + 1);

  constructor(
    private bleService: BleService,
    private robotCommandService: RobotCommandService
  ) {}

  sendCommand() {
    const deviceType = this.selectedDeviceType();
    if (deviceType) {
      const locationNum = this.selectedIndex();
      console.log('Sending BLE command:', deviceType, 'at location', locationNum);

      // Send BLE command
      this.robotCommandService.sendRobotGoToCmd(
        deviceType as RobotTaskType,
        locationNum,
        (succeed) => {
          if (succeed) {
            // Add to device list on success
            const newDevice: DeviceItem = {
              type: deviceType as RobotTaskType,
              index: locationNum
            };
            this.deviceItems.update(items => [...items, newDevice]);

            this.commandSent.set(true);
            setTimeout(() => this.commandSent.set(false), 2000);
          } else {
            console.error('Failed to send command');
            alert('Failed to send command. Make sure you are connected to the robot.');
          }
        }
      );
    }
  }

  removeDevice(index: number) {
    this.deviceItems.update(items => items.filter((_, i) => i !== index));
  }

  clearAll() {
    this.deviceItems.set([]);
  }

  /**
   * Get the name of a RobotTaskType enum value
   */
  getTaskTypeName(type: RobotTaskType): string {
    const device = this.deviceTypes.find(d => d.type === type);
    return device ? device.label : RobotTaskType[type];
  }

  /**
   * Get the display text for the selected device (e.g., "Parking - 5")
   */
  getDisplayText(): string {
    const deviceType = this.selectedDeviceType();
    if (!deviceType) {
      return '';
    }
    const typeName = this.getTaskTypeName(deviceType as RobotTaskType);
    const index = this.selectedIndex();
    return `${typeName} - ${index}`;
  }

  /**
   * Get the display text for temp selections in popover header
   */
  getTempDisplayText(): string {
    const deviceType = this.tempDeviceType();
    if (!deviceType) {
      return 'Select device type and index';
    }
    const typeName = this.getTaskTypeName(deviceType as RobotTaskType);
    const index = this.tempIndex();
    return `${typeName} - ${index}`;
  }

  /**
   * Open the popover and initialize temp values
   */
  openPopover() {
    this.tempDeviceType.set(this.selectedDeviceType());
    this.tempIndex.set(this.selectedIndex());
  }

  /**
   * Select a device type in the dialog
   */
  selectDeviceType(type: RobotTaskType) {
    this.tempDeviceType.set(type);
  }

  /**
   * Check if a device type is currently selected in temp
   */
  isDeviceTypeSelected(type: RobotTaskType): boolean {
    return this.tempDeviceType() === type;
  }

  /**
   * Increment the temporary index
   */
  incrementIndex() {
    const current = this.tempIndex();
    if (current < 10) {
      this.tempIndex.set(current + 1);
    }
  }

  /**
   * Decrement the temporary index
   */
  decrementIndex() {
    const current = this.tempIndex();
    if (current > 1) {
      this.tempIndex.set(current - 1);
    }
  }

  /**
   * Save the temporary selections and close popover
   */
  saveSelection() {
    this.selectedDeviceType.set(this.tempDeviceType());
    this.selectedIndex.set(this.tempIndex());
    this.devicePopover?.close();
  }

  /**
   * Cancel and close popover without saving
   */
  cancelSelection() {
    this.devicePopover?.close();
  }

  /**
   * Get available actions for the selected device type
   */
  getDeviceActions(): Array<{ label: string; taskType: RobotTaskType; icon: string }> {
    const deviceType = this.selectedDeviceType();
    
    switch (deviceType) {
      case RobotTaskType.GoingToBrushStation:
        return [
          { label: 'Take', taskType: RobotTaskType.TakeBrusher, icon: 'fa-hand-holding' },
          { label: 'Return', taskType: RobotTaskType.ReturnBrusher, icon: 'fa-arrow-rotate-left' }
        ];
      case RobotTaskType.GoingToDipperStation:
        return [
          { label: 'Take', taskType: RobotTaskType.TakeDipper, icon: 'fa-hand-holding' },
          { label: 'Return', taskType: RobotTaskType.ReturnDipper, icon: 'fa-arrow-rotate-left' }
        ];
      case RobotTaskType.GoingToStall:
        return [
          { label: 'Take Left Cup', taskType: RobotTaskType.TakeLeftCupsPairForTesting, icon: 'fa-mug-hot' },
          { label: 'Take Right Cup', taskType: RobotTaskType.TakeRightCupsPairForTesting, icon: 'fa-mug-hot' },
          { label: 'Return', taskType: RobotTaskType.ReleaseGrippersForTesting, icon: 'fa-arrow-rotate-left' },
          { label: 'Wash Camera', taskType: RobotTaskType.MoveArmToCameraSprayPositionForTesting, icon: 'fa-camera' }
        ];
      case RobotTaskType.GoingToWashStation:
        return [
          { label: 'Wash', taskType: RobotTaskType.Wash, icon: 'fa-shower' }
        ];
      default:
        return [];
    }
  }

  /**
   * Send action command for selected device
   */
  sendActionCommand(taskType: RobotTaskType) {
    const locationNum = this.selectedIndex();
    console.log('Sending action command:', RobotTaskType[taskType], 'at location', locationNum);

    this.robotCommandService.sendRobotGoToCmd(
      taskType,
      locationNum,
      (succeed) => {
        if (succeed) {
          this.commandSent.set(true);
          setTimeout(() => this.commandSent.set(false), 2000);
        } else {
          console.error('Failed to send action command');
          alert('Failed to send action command. Make sure you are connected to the robot.');
        }
      }
    );
  }

  /**
   * Send stop move command
   */
  async sendStopMoveCommand() {
    const motorType = this.selectedMotorType();
    console.log('Sending stop move command for motor:', MotorType[motorType]);

    await this.robotCommandService.sendStopMoveCmd(
      motorType,
      (succeed) => {
        if (succeed) {
          this.stopCommandSent.set(true);
          setTimeout(() => this.stopCommandSent.set(false), 2000);
        } else {
          console.error('Failed to send stop move command');
          alert('Failed to send stop move command. Make sure you are connected to the robot.');
        }
      }
    );
  }

  /**
   * Get motor types for dropdown
   */
  protected readonly motorTypes = [
    { value: MotorType.A, label: 'Motor A' },
    { value: MotorType.B, label: 'Motor B' },
    { value: MotorType.C, label: 'Motor C' },
    { value: MotorType.All, label: 'All Motors' },
    { value: MotorType.ArmOnly, label: 'Arm Only' }
  ];

  /**
   * Get display text for selected motor type
   */
  getMotorDisplayText(): string {
    const motor = this.motorTypes.find(m => m.value === this.selectedMotorType());
    return motor ? motor.label : 'All Motors';
  }

  /**
   * Open motor type popover
   */
  openMotorPopover() {
    this.tempMotorType.set(this.selectedMotorType());
  }

  /**
   * Select motor type in popover
   */
  selectMotorType(motorType: MotorType) {
    this.tempMotorType.set(motorType);
    this.selectedMotorType.set(motorType);
    this.motorPopover?.close();
  }
}
