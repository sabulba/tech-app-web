# BLE Robot Status Monitoring - Setup Guide

This Angular application follows your Dart implementation pattern for robot BLE status monitoring.

## Implementation Summary

### Architecture (Following Dart Pattern)
- **GUID-based service discovery** - Connects to specific service/characteristic UUIDs
- **Status polling** - Polls robot status every 1 second (like Dart's Timer.periodic)
- **RxJS Observables** - For reactive state management (like Dart's Streams)
- **Message ID tracking** - Detects stale status and disconnects after retry limit

### Files Created

1. **`src/app/models/robot-status.model.ts`**
   - RobotStatus interface
   - RobotToolType enum
   - ActionRequests enum

2. **`src/app/services/ble.service.ts`**
   - Connects to robot by device name
   - Polls status every 1 second
   - Exposes observables for connection state and robot status
   - Methods: `isRobotInTestMode()`, `isRobotReadyForMapping()`, `getToolType()`

3. **`src/app/home/*`**
   - Displays connection status
   - Shows real-time robot status (updates every second)
   - Shows: Message ID, Tool Type, Test Mode, Mapping Ready, Action Requests

## IMPORTANT: Update GUIDs Before Using

### Step 1: Find Your Robot's GUIDs

You need to update these constants in `src/app/services/ble.service.ts`:

```typescript
private readonly ROBOT_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb'; // UPDATE THIS
private readonly STATUS_CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb'; // UPDATE THIS
```

**How to find your robot's GUIDs:**
1. Use a BLE scanner app (nRF Connect, LightBlue)
2. Connect to your robot
3. Find the service that provides status data
4. Copy the Service UUID and Characteristic UUID
5. Update the constants in `ble.service.ts`

### Step 2: Update Status Parsing

In `ble.service.ts`, update the `parseRobotStatus()` method to match your robot's protocol:

```typescript
private parseRobotStatus(dataView: DataView): RobotStatus {
  // Adjust byte positions based on your robot's protocol
  const status: RobotStatus = {
    msgId: dataView.getUint16(0, true),        // Bytes 0-1
    ar: dataView.getUint8(2),                   // Byte 2
    tig: dataView.getUint8(3),                  // Byte 3
    connectionState: this.connectionStateSubject.value
  };
  return status;
}
```

## How to Use

### 1. Start Dev Server
```bash
npm start
```

### 2. Open Browser
Navigate to `http://localhost:4200/`

### 3. Connect to Robot
1. Enter your robot's **exact device name** (case-sensitive)
2. Click "Connect to Robot"
3. Select your robot from Chrome's BLE popup
4. Click "Pair"

### 4. Monitor Status
Once connected, you'll see:
- **Connection Status**: connected/disconnected/connecting
- **Message ID**: Auto-increments with each status update
- **Tool Type**: Gripper/Vacuum/Unknown
- **Test Mode**: Active/Inactive
- **Ready for Mapping**: Yes/No
- **Action Requests**: Bit flags value

Status updates **automatically every 1 second** (like your Dart implementation).

## How It Works (Dart → Angular Mapping)

| Dart Concept | Angular Implementation |
|--------------|----------------------|
| `Timer.periodic` | `interval()` from RxJS |
| `StreamController` | `BehaviorSubject` from RxJS |
| `StreamSubscription` | RxJS `Subscription` |
| `_getRobotStatus()` | `getRobotStatus()` private method |
| `_startTimer()` | `startStatusPolling()` |
| `_lastMessageID` | `lastMessageId` |
| `_statusRetryCount` | `statusRetryCount` |
| `notifyListeners()` | `BehaviorSubject.next()` |

## Key Features

✅ **Automatic Status Polling** - Every 1 second, like Dart
✅ **Connection State Tracking** - Reactive state management
✅ **Message ID Validation** - Detects stale data
✅ **Auto-disconnect on Failure** - After 3000 failed retries
✅ **Test Mode Detection** - Bitwise AND operation on `ar` field
✅ **Mapping Ready Detection** - Bitwise AND operation on `ar` field
✅ **Tool Type Display** - Parsed from status response

## Troubleshooting

### "Origin is not allowed to access any service"
**Solution**: Update the `ROBOT_SERVICE_UUID` in `ble.service.ts`

### "No device found"
**Solution**: 
- Make sure robot is powered on and advertising
- Check device name is exactly correct (case-sensitive)
- Make sure robot isn't already connected to another device

### "Status not updating"
**Solution**:
- Check `STATUS_CHARACTERISTIC_UUID` is correct
- Verify `parseRobotStatus()` matches your robot's protocol
- Check browser console for errors

### Status shows all "N/A"
**Solution**:
- Update `parseRobotStatus()` to match your robot's data format
- Check byte offsets and data types (Uint8, Uint16, etc.)

## Next Steps

To add more robot commands (like your Dart service), add methods to `ble.service.ts`:
- `sendMotorPowerCmd()`
- `sendHomingCmd()`
- `sendGripperCmd()`
- etc.

Follow the same pattern: get characteristic → write value → handle response.
