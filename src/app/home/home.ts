import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { BleService } from '../services/ble.service';
import { NfcService } from '../services/nfc.service';
import { RobotCommandService } from '../services/robot-command.service';
import {
  RobotStatus,
  RobotToolType,
  HomingStatus,
  PhasingStatus,
  GripperStatus
} from '../models/robot-status.model';

@Component({
  selector: 'app-home',
  imports: [
    FormsModule,
    CommonModule
  ],
  templateUrl: './home.html'
})
export class Home implements OnInit, OnDestroy {
  protected readonly deviceName = signal('');
  protected readonly scanning = signal(false);
  protected readonly connected = signal(false);
  protected readonly attempted = signal(false);
  protected readonly connectionState = signal('disconnected');
  protected readonly robotStatus = signal<RobotStatus | null>(null);
  protected readonly activeTab = signal<'basic' | 'position' | 'motor' | 'gripper' | 'info'>('basic');
  protected readonly menuOpen = signal(false);
  protected readonly nfcError = signal<string | null>(null);
  protected readonly nfcScanning = signal(false);

  // Testing params
  protected readonly robotNumber = signal<number>(1);
  protected readonly negativePlatform = signal<boolean>(false);
  protected readonly testingParamsSaving = signal(false);
  protected readonly testingParamsSaved = signal(false);
  protected readonly robotRoles = [1, 2, 3, 4, 5, 6, 7];

  // Mapping params
  protected readonly mappingPreparing = signal(false);
  protected readonly mappingPrepared = signal(false);

  private statusSubscription?: Subscription;
  private connectionSubscription?: Subscription;
  private nfcTextSubscription?: Subscription;
  private nfcErrorSubscription?: Subscription;

  constructor(
    private bleService: BleService,
    private offcanvasService: NgbOffcanvas,
    private nfcService: NfcService,
    private robotCommandService: RobotCommandService
  ) {}

  ngOnInit() {
    // Subscribe to connection state
    this.connectionSubscription = this.bleService.connectionState$.subscribe(state => {
      this.connectionState.set(state);
      this.connected.set(state === 'connected');
    });

    // Subscribe to robot status updates
    this.statusSubscription = this.bleService.robotStatus$.subscribe(status => {
      this.robotStatus.set(status);

      // React to status changes here
      if (status) {
        console.log('Status update received:', {
          messageId: status.msgId,
          toolType: status.tig,
          actionRequests: status.ar,
          inTestMode: this.isRobotInTestMode(),
          readyForMapping: this.isRobotReadyForMapping()
        });

        // Example: React when test mode changes
        // if (this.isRobotInTestMode()) {
        //   console.log('Robot entered test mode!');
        // }
      }
    });

    // Subscribe to NFC scanned text
    this.nfcTextSubscription = this.nfcService.scannedText$.subscribe(text => {
      if (text) {
        console.log('NFC tag scanned:', text);
        this.deviceName.set(text);
        this.nfcScanning.set(false);
      }
    });

    // Subscribe to NFC errors
    this.nfcErrorSubscription = this.nfcService.error$.subscribe(error => {
      this.nfcError.set(error);
      if (error) {
        console.warn('NFC error:', error);
        this.nfcScanning.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.statusSubscription?.unsubscribe();
    this.connectionSubscription?.unsubscribe();
    this.nfcTextSubscription?.unsubscribe();
    this.nfcErrorSubscription?.unsubscribe();
  }

  async scanDevice() {
    // Must call BLE immediately to preserve user gesture
    const deviceNameValue = this.deviceName();

    // Set state AFTER starting the BLE request to maintain user gesture
    const connectPromise = this.bleService.connectToRobot(deviceNameValue);

    this.scanning.set(true);
    this.attempted.set(true);

    const result = await connectPromise;
    this.connected.set(result);
    this.scanning.set(false);
  }

  async disconnect() {
    await this.bleService.disconnect();
    this.connected.set(false);
    this.robotStatus.set(null);
  }

  isRobotInTestMode(): boolean {
    return this.bleService.isRobotInTestMode();
  }

  isRobotReadyForMapping(): boolean {
    return this.bleService.isRobotReadyForMapping();
  }

  getToolTypeName(toolType?: RobotToolType): string {
    switch (toolType) {
      case RobotToolType.Gripper:
        return 'Gripper';
      case RobotToolType.Vacuum:
        return 'Vacuum';
      case RobotToolType.Unknown:
      default:
        return 'Unknown';
    }
  }

  getHomingStatusName(status?: HomingStatus): string {
    switch (status) {
      case HomingStatus.Ok:
        return 'OK';
      case HomingStatus.Fail:
        return 'Failed';
      case HomingStatus.NotDone:
        return 'Not Done';
      default:
        return 'N/A';
    }
  }

  getPhasingStatusName(status?: PhasingStatus): string {
    switch (status) {
      case PhasingStatus.Done:
        return 'Done';
      case PhasingStatus.InProcess:
        return 'In Progress';
      case PhasingStatus.NotDone:
        return 'Not Done';
      default:
        return 'N/A';
    }
  }

  getGripperStatusName(status?: GripperStatus): string {
    switch (status) {
      case GripperStatus.Open:
        return 'Open';
      case GripperStatus.Close:
        return 'Closed';
      default:
        return 'N/A';
    }
  }

  setActiveTab(tab: 'basic' | 'position' | 'motor' | 'gripper' | 'info') {
    this.activeTab.set(tab);
    this.closeMenu();
  }

  openMenu(content: any) {
    this.offcanvasService.open(content, {
      position: 'bottom',
      panelClass: 'bottom-sheet-menu',
      backdrop: true
    });
    this.menuOpen.set(true);
  }

  closeMenu() {
    this.offcanvasService.dismiss();
    this.menuOpen.set(false);
  }

  // Get current status synchronously
  getCurrentStatus(): RobotStatus | null {
    return this.bleService.getCurrentStatus();
  }

  // Get specific status fields
  getMessageId(): number | undefined {
    return this.robotStatus()?.msgId;
  }

  getActionRequests(): number | undefined {
    return this.robotStatus()?.ar;
  }

  getToolType(): RobotToolType | undefined {
    return this.robotStatus()?.tig;
  }

  async startNfcScan() {
    this.nfcScanning.set(true);
    this.nfcError.set(null);
    await this.nfcService.startScan();
  }

  async saveTestingParams() {
    this.testingParamsSaving.set(true);
    this.testingParamsSaved.set(false);

    await this.robotCommandService.prepareForRobotTestForTesting(
      this.robotNumber(),
      this.negativePlatform(),
      (succeed) => {
        this.testingParamsSaving.set(false);
        if (succeed) {
          this.testingParamsSaved.set(true);
          setTimeout(() => this.testingParamsSaved.set(false), 3000);
        } else {
          alert('Failed to save testing parameters. Make sure you are connected to the robot.');
        }
      }
    );
  }

  async prepareForMapping() {
    this.mappingPreparing.set(true);
    this.mappingPrepared.set(false);

    await this.robotCommandService.prepareForMapping(
      this.robotNumber(),
      this.negativePlatform(),
      this.deviceName(),
      (succeed) => {
        this.mappingPreparing.set(false);
        if (succeed) {
          this.mappingPrepared.set(true);
          setTimeout(
            () => this.mappingPrepared.set(false),
            3000);
        } else {
          alert('Failed to prepare for mapping. Make sure you are connected to the robot.');
        }
      }
    );
  }
}
