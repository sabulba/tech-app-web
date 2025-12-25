# How to Access Robot Status

The status polling happens automatically every 1 second after connection. Here are all the ways to access the status data:

## Method 1: Observable Subscription (Reactive) ✅ RECOMMENDED

The status updates are already flowing through observables. In your component:

```typescript
ngOnInit() {
  // This is already implemented in home.ts
  this.statusSubscription = this.bleService.robotStatus$.subscribe(status => {
    if (status) {
      console.log('New status:', status);
      
      // Access fields
      console.log('Message ID:', status.msgId);
      console.log('Tool Type:', status.tig);
      console.log('Action Requests:', status.ar);
      
      // React to changes
      if (status.msgId !== this.previousMessageId) {
        console.log('Message ID changed!');
      }
    }
  });
}
```

## Method 2: Signal-Based (Template Access)

Status is stored in a signal, so you can access it in your template:

```html
<!-- In home.html -->
<div>
  <p>Message ID: {{ robotStatus()?.msgId }}</p>
  <p>Tool Type: {{ robotStatus()?.tig }}</p>
  <p>Action Requests: {{ robotStatus()?.ar }}</p>
</div>
```

Or in your component TypeScript:

```typescript
// Already available as a signal
const currentStatus = this.robotStatus();
console.log('Current status:', currentStatus);
```

## Method 3: Synchronous Access

Get the current status at any time:

```typescript
// In your component
const status = this.getCurrentStatus();
console.log('Status now:', status);

// Or access from service directly
const status = this.bleService.getCurrentStatus();
```

## Method 4: Access Specific Fields

Use the helper methods:

```typescript
const msgId = this.getMessageId();
const ar = this.getActionRequests();
const toolType = this.getToolType();

console.log(`Status: ID=${msgId}, AR=${ar}, Tool=${toolType}`);
```

## Method 5: Computed Values

Access derived/computed values:

```typescript
// Check flags
const inTestMode = this.isRobotInTestMode();  // Returns boolean
const readyForMapping = this.isRobotReadyForMapping();  // Returns boolean

// Get tool name
const toolName = this.getToolTypeName(this.robotStatus()?.tig);
console.log('Tool:', toolName);  // "Gripper", "Vacuum", or "Unknown"
```

## Real-World Examples

### Example 1: Log Every Status Update

```typescript
this.statusSubscription = this.bleService.robotStatus$.subscribe(status => {
  if (status) {
    console.table({
      'Message ID': status.msgId,
      'Tool Type': this.getToolTypeName(status.tig),
      'Test Mode': this.isRobotInTestMode() ? 'Yes' : 'No',
      'Mapping Ready': this.isRobotReadyForMapping() ? 'Yes' : 'No',
      'Action Requests': `0x${status.ar?.toString(16)}`
    });
  }
});
```

### Example 2: Detect Test Mode Changes

```typescript
private previousTestMode = false;

this.statusSubscription = this.bleService.robotStatus$.subscribe(status => {
  if (status) {
    const currentTestMode = this.isRobotInTestMode();
    
    if (currentTestMode !== this.previousTestMode) {
      if (currentTestMode) {
        console.log('🔧 Robot entered TEST MODE');
        // Do something when entering test mode
      } else {
        console.log('✅ Robot exited TEST MODE');
        // Do something when exiting test mode
      }
      this.previousTestMode = currentTestMode;
    }
  }
});
```

### Example 3: Button Click Handler

```typescript
onTestButtonClick() {
  const status = this.getCurrentStatus();
  
  if (!status) {
    console.error('No status available');
    return;
  }
  
  if (this.isRobotInTestMode()) {
    console.log('Robot is in test mode, proceeding...');
    // Do test operations
  } else {
    console.warn('Robot not in test mode');
  }
}
```

### Example 4: Display Status in Template

```html
<div class="robot-info">
  @if (robotStatus()) {
    <div class="status-card">
      <h3>Live Robot Status</h3>
      
      <div class="status-item">
        <span>Message:</span>
        <strong>{{ getMessageId() }}</strong>
      </div>
      
      <div class="status-item">
        <span>Tool:</span>
        <strong>{{ getToolTypeName(getToolType()) }}</strong>
      </div>
      
      <div class="status-item" [class.active]="isRobotInTestMode()">
        <span>Test Mode:</span>
        <strong>{{ isRobotInTestMode() ? 'ACTIVE' : 'Inactive' }}</strong>
      </div>
      
      <div class="status-item" [class.active]="isRobotReadyForMapping()">
        <span>Mapping Ready:</span>
        <strong>{{ isRobotReadyForMapping() ? 'YES' : 'No' }}</strong>
      </div>
    </div>
  }
</div>
```

### Example 5: Use RxJS Operators

For more advanced scenarios:

```typescript
import { filter, distinctUntilChanged, map } from 'rxjs/operators';

// Only react to test mode changes
this.bleService.robotStatus$.pipe(
  filter(status => status !== null),
  map(status => this.isRobotInTestMode()),
  distinctUntilChanged()  // Only emit when test mode changes
).subscribe(inTestMode => {
  console.log('Test mode changed to:', inTestMode);
});

// Only react to message ID changes
this.bleService.robotStatus$.pipe(
  filter(status => status !== null),
  map(status => status!.msgId),
  distinctUntilChanged()
).subscribe(msgId => {
  console.log('New message received:', msgId);
});
```

## Status Update Frequency

- Updates every **1 second** (1000ms)
- Automatically starts after successful connection
- Stops when disconnected
- Retry limit: 3000 failed attempts before auto-disconnect

## Status Object Structure

```typescript
interface RobotStatus {
  msgId?: number;           // Message ID (increments each update)
  ar?: number;              // Action Requests (bit flags)
  tig?: RobotToolType;      // Tool Type (0=Unknown, 1=Gripper, 2=Vacuum)
  connectionState?: string; // "connected", "disconnected", "connecting"
}
```

## Action Request Flags

```typescript
enum ActionRequests {
  RobotTestsMode = 0x01,    // Bit 0: Test mode active
  RobotMappingMode = 0x02,  // Bit 1: Ready for mapping
  // Add more flags as needed
}
```

Check flags using bitwise AND:
```typescript
const inTestMode = (status.ar & ActionRequests.RobotTestsMode) !== 0;
const readyForMapping = (status.ar & ActionRequests.RobotMappingMode) !== 0;
```

## Browser Console Debugging

Open browser DevTools (F12) and you'll see:
- `Status update received:` - Every second when connected
- `Robot status:` - From the BLE service
- All status fields logged in the console

This makes it easy to verify your robot is sending data correctly!
