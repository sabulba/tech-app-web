import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RobotCommandService } from '../services/robot-command.service';
import { MotorType } from '../models/robot-endpoints';
import { Subscription, interval } from 'rxjs';

enum MotionServiceStatus {
  notStarted = 'notStarted',
  done = 'done',
  failed = 'failed'
}

enum GripperType {
  Upper = 0,
  Lower = 1,
  Both = 2,
  None = 3
}

interface RobotStatus {
  // Phasing status
  apa?: boolean;
  apb?: boolean;
  apc?: boolean;
  apall?: boolean;
  
  // Homing status
  hb?: boolean;
  hc?: boolean;
  hall?: boolean;
  
  // Motor power status
  ma?: boolean;
  mb?: boolean;
  mc?: boolean;
  
  // Gripper status
  ug?: boolean; // upper gripper
  lg?: boolean; // lower gripper
  
  // Position
  pos?: {
    a?: number;
    b?: number;
    c?: number;
  };
}

@Component({
  selector: 'app-motion-service',
  imports: [CommonModule, FormsModule],
  templateUrl: './motion-service.html',
  styles: [`
    .motion-button {
      min-width: 80px;
      height: 50px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .motion-button.done {
      border: 2px solid #28a745;
      position: relative;
    }
    
    .motion-button.done::after {
      content: '✓';
      position: absolute;
      top: -10px;
      right: -10px;
      background: #28a745;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    
    .stepper-control {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .stepper-control input {
      width: 100px;
      text-align: center;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      margin: 16px 0;
    }
    
    .pwm-control {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 8px 0;
    }
    
    .pwm-control input {
      width: 100px;
      text-align: center;
      font-size: 18px;
    }
    
    .pwm-control.invalid input {
      color: red;
      border-color: red;
    }
    
    .motor-position {
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      margin: 8px 0;
    }
    
    .motor-position.saturation {
      color: red;
    }
    
    /* Active tab check mark */
    .nav-link {
      position: relative;
    }
    
    .nav-link.active::after {
      content: '✓';
      position: absolute;
      top: 50%;
      right: 10px;
      transform: translateY(-50%);
      color: #28a745;
      font-size: 1.5rem;
      font-weight: bold;
      pointer-events: none;
    }
    
    /* Tab content adjustments */
    .tab-content {
      margin-left: 3px;
    }
    
    .tab-pane .p-3 {
      padding: 0 !important;
    }
    
    #motor-z-panel, #motor-y-panel, #gripper-upper-panel, #gripper-lower-panel, #gripper-both-panel {
      position: relative;
      left: -1rem;
    }
    
    /* Footer button done state */
    .footer-btn.done {
      border: 2px solid #28a745;
      position: relative;
    }
    
    .footer-btn.done::after {
      content: '✓';
      position: absolute;
      top: -10px;
      right: -10px;
      background: #28a745;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
  `]
})
export class MotionService implements OnInit, OnDestroy {
  protected readonly MotionServiceStatus = MotionServiceStatus;
  protected readonly MotorType = MotorType;
  protected readonly GripperType = GripperType;
  
  // Robot status
  protected readonly robotStatus = signal<RobotStatus | null>(null);
  
  // Motor Z targets
  protected target1MotorZ = signal<number>(0.1);
  protected target2MotorZ = signal<number>(0.2);
  protected repeatDurationMotorZ = signal<number>(2);
  
  // Motor Y targets
  protected target3MotorY = signal<number>(0.1);
  protected target4MotorY = signal<number>(0.2);
  protected repeatDurationMotorY = signal<number>(2);
  
  // Gripper PWM values
  protected upperGripperOpenPWM = signal<number>(1050);
  protected upperGripperClosePWM = signal<number>(1500);
  protected lowerGripperOpenPWM = signal<number>(1050);
  protected lowerGripperClosePWM = signal<number>(1500);
  
  // Gripper repeat durations
  protected repeatGripperUpperDuration = signal<number>(2);
  protected repeatGripperLowerDuration = signal<number>(2);
  protected repeatGripperBothDuration = signal<number>(2);
  
  // Validation flags
  protected isUpperRangeValid = signal<boolean>(true);
  protected isLowerRangeValid = signal<boolean>(true);
  protected upperGripperSaved = signal<boolean>(false);
  protected lowerGripperSaved = signal<boolean>(false);
  
  // Selected action tracking
  protected selectedMotorType = signal<MotorType | null>(null);
  protected selectedMotorAction = signal<string>('');
  protected selectedGripperAction = signal<string>('');
  
  // Status messages
  protected statusMessage = signal<string>('');
  protected statusType = signal<'success' | 'error' | ''>('');
  
  private statusSubscription?: Subscription;
  
  constructor(private robotCommandService: RobotCommandService) {}
  
  ngOnInit() {
    // Poll robot status periodically (every 500ms)
    this.statusSubscription = interval(500).subscribe(() => {
      this.updateRobotStatus();
    });
  }
  
  ngOnDestroy() {
    this.statusSubscription?.unsubscribe();
  }
  
  private updateRobotStatus() {
    // This would normally get status from the BLE service
    // For now, it's a placeholder
  }
  
  // Auto Phasing Commands
  sendAutoPhasingCmd(motor: MotorType) {
    console.log('Sending auto phasing command for motor:', MotorType[motor]);
    this.selectedMotorAction.set(`phasing_${MotorType[motor]}`);
    this.showSuccessMessage(`Phasing ${MotorType[motor]} initiated`);
    // TODO: Implement actual BLE command
  }
  
  // Homing Commands
  sendAutoHomingCmd(motor: MotorType) {
    console.log('Sending auto homing command for motor:', MotorType[motor]);
    this.selectedMotorAction.set(`homing_${MotorType[motor]}`);
    this.showSuccessMessage(`Homing ${MotorType[motor]} initiated`);
    // TODO: Implement actual BLE command
  }
  
  // Motor Power Commands
  setMotorPower(motor: MotorType, powerOn: boolean) {
    console.log(`Setting motor ${MotorType[motor]} power:`, powerOn);
    this.selectedMotorAction.set(`power_${MotorType[motor]}_${powerOn}`);
    this.showSuccessMessage(`Motor ${MotorType[motor]} ${powerOn ? 'enabled' : 'disabled'}`);
    // TODO: Implement actual BLE command
  }
  
  // Motor Movement Commands
  sendMotorMove(target: number, motorType: 'Z' | 'Y', targetNum: number) {
    console.log(`Moving motor ${motorType} to target ${targetNum}:`, target);
    this.selectedMotorAction.set(`move_${motorType}_${targetNum}`);
    this.showSuccessMessage(`Motor ${motorType} moving to ${target.toFixed(3)}m`);
    // TODO: Implement actual BLE command
  }
  
  sendMotorRepeat(motorType: 'Z' | 'Y', duration: number, target1: number, target2: number) {
    console.log(`Repeating motor ${motorType} between ${target1} and ${target2}, duration: ${duration}s`);
    this.selectedMotorAction.set(`repeat_${motorType}`);
    this.showSuccessMessage(`Motor ${motorType} repeat started`);
    // TODO: Implement actual BLE command
  }
  
  stopMotorRepeat(motorType: 'Z' | 'Y') {
    console.log(`Stopping motor ${motorType} repeat`);
    this.selectedMotorAction.set(`stop_repeat_${motorType}`);
    this.robotCommandService.sendStopTaskCmd((succeed) => {
      if (succeed) {
        this.showSuccessMessage(`Motor ${motorType} repeat stopped`);
      } else {
        this.showErrorMessage('Failed to stop motor repeat');
      }
    });
  }
  
  // Gripper Commands
  sendGripperAction(open: boolean, gripperType: GripperType) {
    console.log(`${open ? 'Opening' : 'Closing'} gripper:`, GripperType[gripperType]);
    this.selectedGripperAction.set(`gripper_${GripperType[gripperType]}_${open ? 'open' : 'close'}`);
    this.robotCommandService.sendGripperCmd(open, (succeed) => {
      if (succeed) {
        this.showSuccessMessage(`Gripper ${open ? 'opened' : 'closed'}`);
      } else {
        this.showErrorMessage('Failed to send gripper command');
      }
    });
  }
  
  sendGripperRepeat(gripperType: GripperType, duration: number) {
    console.log(`Repeating gripper ${GripperType[gripperType]}, duration: ${duration}s`);
    this.selectedGripperAction.set(`gripper_${GripperType[gripperType]}_repeat`);
    this.showSuccessMessage(`Gripper repeat started`);
    // TODO: Implement actual BLE command
  }
  
  stopGripperRepeat(gripperType: GripperType) {
    console.log(`Stopping gripper ${GripperType[gripperType]} repeat`);
    this.selectedGripperAction.set(`gripper_${GripperType[gripperType]}_stop`);
    this.showSuccessMessage(`Gripper repeat stopped`);
    // TODO: Implement actual BLE command
  }
  
  // PWM Calibration
  updateUpperGripperPWM(value: number, isClose: boolean) {
    if (isClose) {
      this.upperGripperClosePWM.set(value);
      this.upperGripperOpenPWM.set(value - 450);
    }
    this.validateUpperPWM();
  }
  
  updateLowerGripperPWM(value: number, isClose: boolean) {
    if (isClose) {
      this.lowerGripperClosePWM.set(value);
      this.lowerGripperOpenPWM.set(value - 450);
    }
    this.validateLowerPWM();
  }
  
  private validateUpperPWM() {
    const closePWM = this.upperGripperClosePWM();
    const openPWM = this.upperGripperOpenPWM();
    const delta = closePWM - openPWM;
    this.isUpperRangeValid.set(delta === 450 && closePWM >= 1050 && closePWM <= 2000);
  }
  
  private validateLowerPWM() {
    const closePWM = this.lowerGripperClosePWM();
    const openPWM = this.lowerGripperOpenPWM();
    const delta = closePWM - openPWM;
    this.isLowerRangeValid.set(delta === 450 && closePWM >= 1050 && closePWM <= 2000);
  }
  
  saveGripperPWM(gripperType: GripperType) {
    const openPWM = gripperType === GripperType.Upper 
      ? this.upperGripperOpenPWM() 
      : this.lowerGripperOpenPWM();
    const closePWM = gripperType === GripperType.Upper 
      ? this.upperGripperClosePWM() 
      : this.lowerGripperClosePWM();
    
    console.log(`Saving gripper PWM - Open: ${openPWM}, Close: ${closePWM}`);
    
    if (gripperType === GripperType.Upper) {
      this.upperGripperSaved.set(true);
      this.selectedGripperAction.set('gripper_upper_save_pwm');
    } else {
      this.lowerGripperSaved.set(true);
      this.selectedGripperAction.set('gripper_lower_save_pwm');
    }
    
    this.showSuccessMessage('PWM values saved');
    // TODO: Implement actual BLE command to save PWM
  }
  
  getGripperPWM(gripperType: GripperType) {
    console.log(`Getting gripper PWM for:`, GripperType[gripperType]);
    this.selectedGripperAction.set(`get_${GripperType[gripperType]}_pwm`);
    // TODO: Implement actual BLE command to get PWM
    this.showSuccessMessage('PWM values retrieved');
  }
  
  // Preset Commands
  sendLimitZ() {
    console.log('Sending Limit Z command');
    this.selectedMotorAction.set('limit_z');
    this.showSuccessMessage('Limit Z command sent');
    // TODO: Implement actual BLE command
  }
  
  sendFoldArm() {
    console.log('Sending Fold Arm command');
    this.selectedMotorAction.set('fold_arm');
    this.showSuccessMessage('Fold Arm command sent');
    // TODO: Implement actual BLE command
  }
  
  sendOpenArm() {
    console.log('Sending Open Arm command');
    this.selectedMotorAction.set('open_arm');
    this.showSuccessMessage('Open Arm command sent');
    // TODO: Implement actual BLE command
  }
  
  resetToDefaults() {
    console.log('Resetting to default values');
    this.target1MotorZ.set(0.1);
    this.target2MotorZ.set(0.2);
    this.target3MotorY.set(0.1);
    this.target4MotorY.set(0.2);
    this.selectedMotorAction.set('defaults');
    this.showSuccessMessage('Reset to default values');
  }
  
  // Helper methods for incrementing/decrementing values
  incrementValue(signal: any, step: number = 0.001, min: number = 0, max: number = 1) {
    const current = signal();
    const newValue = Math.min(max, current + step);
    signal.set(Number(newValue.toFixed(3)));
  }
  
  decrementValue(signal: any, step: number = 0.001, min: number = 0, max: number = 1) {
    const current = signal();
    const newValue = Math.max(min, current - step);
    signal.set(Number(newValue.toFixed(3)));
  }
  
  incrementPWM(signal: any, min: number = 1050, max: number = 2000) {
    const current = signal();
    signal.set(Math.min(max, current + 1));
  }
  
  decrementPWM(signal: any, min: number = 1050, max: number = 2000) {
    const current = signal();
    signal.set(Math.max(min, current - 1));
  }
  
  // Status message helpers
  private showSuccessMessage(message: string) {
    this.statusMessage.set(message);
    this.statusType.set('success');
    setTimeout(() => {
      this.statusMessage.set('');
      this.statusType.set('');
    }, 3000);
  }
  
  private showErrorMessage(message: string) {
    this.statusMessage.set(message);
    this.statusType.set('error');
    setTimeout(() => {
      this.statusMessage.set('');
      this.statusType.set('');
    }, 3000);
  }
  
  // Check if action is active
  isActionActive(action: string): boolean {
    return this.selectedMotorAction() === action || this.selectedGripperAction() === action;
  }
}
