import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BleService } from '../services/ble.service';
import { RobotCommandService } from '../services/robot-command.service';
import { RobotTaskType, MotorType } from '../models/robot-endpoints';

interface DeviceItem {
  type: RobotTaskType;
  index: number;
}

@Component({
  selector: 'app-commands',
  imports: [CommonModule, FormsModule],
  templateUrl: './commands.html'
})
export class Commands {
  protected readonly deviceTypes: RobotTaskType[] = [
    RobotTaskType.GoingToStall,
    RobotTaskType.GoingToParking,
    RobotTaskType.Attaching,
    RobotTaskType.GoingToBrushStation,
    RobotTaskType.TakeBrusher,
    RobotTaskType.ReturnBrusher,
    RobotTaskType.Brush,
    RobotTaskType.GoingToDipperStation,
    RobotTaskType.TakeDipper,
    RobotTaskType.ReturnDipper,
    RobotTaskType.Dip,
    RobotTaskType.GoingToWashStation,
    RobotTaskType.Wash,
    RobotTaskType.DoHoming,
    RobotTaskType.AssumeBasePosition,
    RobotTaskType.ReleaseTool
  ];

  protected readonly selectedDeviceType = signal<RobotTaskType | ''>('');
  protected readonly selectedIndex = signal<number>(1);
  protected readonly deviceItems = signal<DeviceItem[]>([]);
  protected readonly commandSent = signal(false);
  protected readonly selectedMotorType = signal<MotorType>(MotorType.All);
  protected readonly stopCommandSent = signal(false);

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
    return RobotTaskType[type];
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
}
