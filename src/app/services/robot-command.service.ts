import { Injectable } from '@angular/core';
import { BleService } from './ble.service';
import { RobotEndpoints, RobotTaskType, AssignTaskToRobotCmd, MotorType, MotorStopCmd } from '../models/robot-endpoints';
import { PlatformMap, PlatformMapLocation } from '../models/platform-map.model';

@Injectable({
  providedIn: 'root'
})
export class RobotCommandService {
  private cmdService?: BluetoothRemoteGATTService;

  constructor(private bleService: BleService) {}

  /**
   * Send robot go to command
   * @param robotTaskType The type of task (parking, wash station, etc.)
   * @param locationNum The location/index number (1-10)
   * @param onDone Callback function with success status
   */
  async sendRobotGoToCmd(
    robotTaskType: RobotTaskType,
    locationNum: number,
    onDone: (succeed: boolean) => void
  ): Promise<void> {
    try {
      const req: AssignTaskToRobotCmd = {
        LocationId: Number(locationNum), // Ensure it's a number, not string
        TaskType: Number(robotTaskType) // Ensure it's a number, not string
      };

      console.log('Sending robot go to command:', {
        taskType: RobotTaskType[robotTaskType],
        taskTypeValue: Number(robotTaskType),
        locationId: Number(locationNum),
        payload: req
      });

      await this.writeCharacteristicValue(
        RobotEndpoints.CMD_SERVICE_GUID,
        RobotEndpoints.CMD_ASSIGN_TASK_TO_ROBOT_CHARACTERISTIC_GUID,
        JSON.stringify(req)
      );

      onDone(true);
    } catch (error) {
      console.error('Failed to send robot go to command:', error);
      onDone(false);
    }
  }

  /**
   * Write value to a BLE characteristic
   */
  private async writeCharacteristicValue(
    serviceUuid: string,
    characteristicUuid: string,
    value: string
  ): Promise<void> {
    const server = this.getGattServer();
    if (!server || !server.connected) {
      throw new Error('GATT server not connected. Please connect to the robot first.');
    }

    // Get the service
    const service = await server.getPrimaryService(serviceUuid);

    // Get the characteristic
    const characteristic = await service.getCharacteristic(characteristicUuid);

    // Check if the characteristic supports write operations
    console.log('Characteristic properties:', {
      read: characteristic.properties.read,
      write: characteristic.properties.write,
      writeWithoutResponse: characteristic.properties.writeWithoutResponse,
      notify: characteristic.properties.notify,
      indicate: characteristic.properties.indicate
    });

    if (!characteristic.properties.write && !characteristic.properties.writeWithoutResponse) {
      throw new Error(`Characteristic ${characteristicUuid} does not support write operations`);
    }

    // Convert string to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(value);

    console.log('Writing data:', value, 'bytes:', data.length);

    // Use writeValueWithResponse if supported, otherwise writeValueWithoutResponse
    if (characteristic.properties.write) {
      await characteristic.writeValueWithResponse(data);
      console.log(`Written with response to ${characteristicUuid}:`, value);
    } else {
      await characteristic.writeValueWithoutResponse(data);
      console.log(`Written without response to ${characteristicUuid}:`, value);
    }
  }

  /**
   * Get the GATT server from BLE service
   */
  private getGattServer(): BluetoothRemoteGATTServer | null {
    return this.bleService.getGattServer();
  }

  /**
   * Send stop task command
   */
  async sendStopTaskCmd(onDone: (succeed: boolean) => void): Promise<void> {
    try {
      await this.writeCharacteristicValue(
        RobotEndpoints.CMD_SERVICE_GUID,
        RobotEndpoints.CMD_STOP_TASK_CHARACTERISTIC_GUID,
        JSON.stringify({})
      );
      onDone(true);
    } catch (error) {
      console.error('Failed to send stop task command:', error);
      onDone(false);
    }
  }

  /**
   * Send stop move command
   * @param motor Motor type to stop (A, B, C, All, or ArmOnly)
   * @param onDone Callback function with success status
   */
  async sendStopMoveCmd(
    motor: MotorType,
    onDone: (succeed: boolean) => void
  ): Promise<void> {
    try {
      const cmd: MotorStopCmd = {
        motor: Number(motor)
      };

      console.log('Sending stop move command:', {
        motorType: MotorType[motor],
        motorValue: Number(motor),
        payload: cmd
      });

      await this.writeCharacteristicValue(
        RobotEndpoints.CMD_SERVICE_GUID,
        RobotEndpoints.CMD_STOP_MOVE_CHARACTERISTIC_GUID,
        JSON.stringify(cmd)
      );

      onDone(true);
    } catch (error) {
      console.error('Failed to send stop move command:', error);
      onDone(false);
    }
  }

  /**
   * Send homing command
   */
  async sendHomingCmd(onDone: (succeed: boolean) => void): Promise<void> {
    try {
      await this.writeCharacteristicValue(
        RobotEndpoints.CMD_SERVICE_GUID,
        RobotEndpoints.CMD_HOMING_CHARACTERISTIC_GUID,
        JSON.stringify({})
      );
      onDone(true);
    } catch (error) {
      console.error('Failed to send homing command:', error);
      onDone(false);
    }
  }

  /**
   * Send gripper command
   */
  async sendGripperCmd(open: boolean, onDone: (succeed: boolean) => void): Promise<void> {
    try {
      await this.writeCharacteristicValue(
        RobotEndpoints.CMD_SERVICE_GUID,
        RobotEndpoints.CMD_GRIPPER_CHARACTERISTIC_GUID,
        JSON.stringify({ open })
      );
      onDone(true);
    } catch (error) {
      console.error('Failed to send gripper command:', error);
      onDone(false);
    }
  }

  /**
   * Prepare robot for testing
   * @param robotNumber Robot role number (1-7)
   * @param negativePlatform Is negative platform
   * @param onDone Callback function with success status
   */
  async prepareForRobotTestForTesting(
    robotNumber: number,
    negativePlatform: boolean,
    onDone: (succeed: boolean) => void
  ): Promise<boolean> {
    try {
      const params = {
        robotNumber,
        negativePlatform
      };

      await this.writeCharacteristicValue(
        RobotEndpoints.CMD_SERVICE_GUID,
        RobotEndpoints.CMD_PREPARE_FOR_ROBOT_TEST_FOR_TESTING_GUID,
        JSON.stringify(params)
      );

      console.log('Prepare for testing command sent:', params);
      onDone(true);
      return true;
    } catch (error) {
      console.error('Failed to send prepare for testing command:', error);
      onDone(false);
      return false;
    }
  }

  /**
   * Prepare robot for mapping
   * @param role Robot role number (1-7)
   * @param isNegativePlatform Is negative platform
   * @param deviceName Device name
   * @param onDone Callback function with success status
   */
  async prepareForMapping(
    role: number,
    isNegativePlatform: boolean,
    deviceName: string,
    onDone: (succeed: boolean) => void
  ): Promise<boolean> {
    try {
      const command = {
        role,
        isNegativePlatform,
        deviceName,
        timestamp: new Date().toISOString()
      };

      await this.writeCharacteristicValue(
        RobotEndpoints.CMD_SERVICE_GUID,
        RobotEndpoints.CMD_PREPARE_FOR_MAPPING_CHARACTERISTIC_GUID,
        JSON.stringify(command)
      );

      console.log('Prepare for mapping command sent:', command);
      onDone(true);
      return true;
    } catch (error) {
      console.error('Failed to send prepare for mapping command:', error);
      onDone(false);
      return false;
    }
  }

  /**
   * Send platform map part 1 (metadata)
   * @param isNegative Is negative platform
   * @param mapName Map name
   * @param farmId Farm ID
   * @param siteName Site name
   * @param platformNumber Platform number
   * @param onDone Callback function with success status
   */
  async sendPlatformMap1(
    isNegative: boolean,
    mapName: string,
    farmId: number,
    siteName: string,
    platformNumber: number,
    onDone: (succeed: boolean) => void
  ): Promise<void> {
    try {
      const payload = {
        IsNegative: isNegative,
        MapName: mapName,
        FarmId: farmId,
        SiteName: siteName,
        PlatformNumber: platformNumber
      };

      await this.writeCharacteristicValue(
        RobotEndpoints.SET_SERVICE_GUID,
        RobotEndpoints.SET_PLATFORM_MAP1_CHARACTERISTIC_GUID,
        JSON.stringify(payload)
      );

      console.log('Platform map 1 sent:', payload);
      onDone(true);
    } catch (error) {
      console.error('Failed to send platform map 1:', error);
      onDone(false);
    }
  }

  /**
   * Send platform map part 2 (locations)
   * @param locations Array of platform map locations
   * @param onDone Callback function with success status
   */
  async sendPlatformMap2(
    locations: PlatformMapLocation[],
    onDone: (succeed: boolean) => void
  ): Promise<void> {
    try {
      // Format: Type,ID,X,Y,Z|Type,ID,X,Y,Z|...
      const mapLocationsString = locations
        .map(loc =>
          `${loc.Location.Type},${loc.Location.ID},` +
          `${loc.XLocationInMeters.toFixed(3)},` +
          `${loc.YLocationInMeters.toFixed(3)},` +
          `${loc.ZLocationInMeters.toFixed(3)}`
        )
        .join('|');

      const payload = { P: mapLocationsString };

      await this.writeCharacteristicValue(
        RobotEndpoints.SET_SERVICE_GUID,
        RobotEndpoints.SET_PLATFORM_MAP2_CHARACTERISTIC_GUID,
        JSON.stringify(payload)
      );

      console.log('Platform map 2 sent with', locations.length, 'locations');
      onDone(true);
    } catch (error) {
      console.error('Failed to send platform map 2:', error);
      onDone(false);
    }
  }

  /**
   * Send complete platform map to robot (wrapper for both parts)
   * @param map Platform map to send
   * @param onDone Callback function with success status
   */
  async sendMapToRobot(
    map: PlatformMap,
    onDone: (succeed: boolean) => void
  ): Promise<boolean> {
    try {
      let success = false;

      // Send part 1 (metadata)
      await this.sendPlatformMap1(
        map.Map.IsNegative,
        map.MapName,
        map.Map.FarmId,
        map.Map.SiteName,
        map.PlatformNumber,
        (succeed) => { success = succeed; }
      );

      if (!success) {
        onDone(false);
        return false;
      }

      // Send part 2 (locations)
      await this.sendPlatformMap2(
        map.Map.Locations,
        (succeed) => { success = succeed; }
      );

      onDone(success);
      return success;
    } catch (error) {
      console.error('Error sending map to robot:', error);
      onDone(false);
      return false;
    }
  }
}
