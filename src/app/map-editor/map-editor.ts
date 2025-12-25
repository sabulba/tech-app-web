import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RobotCommandService } from '../services/robot-command.service';
import {
  PlatformMap,
  PlatformMapLocation,
  LocationType,
  Location
} from '../models/platform-map.model';

@Component({
  selector: 'app-map-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './map-editor.html',
  styles: [`
    @media (max-width: 768px) {
      .table-responsive {
        font-size: 0.875rem;
      }
      
      .form-control-sm,
      .form-select-sm {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
      }
      
      .btn-toolbar {
        flex-wrap: wrap;
      }
      
      .btn-toolbar .btn-group {
        margin-bottom: 0.5rem;
      }
    }

    .table td input,
    .table td select {
      min-width: 80px;
    }

    input[type="file"] {
      display: none;
    }

    /* Footer button styles */
    .footer-btn {
      width: 120px;
      height: 120px;
      border: 2px solid #ccc;
      border-radius: 8px;
      background: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      font-size: 14px;
      font-weight: 500;
    }

    .footer-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

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

    /* Card header height consistency */
    .card-header {
      min-height: 60px;
      display: flex;
      align-items: center;
    }

    .card-header h5 {
      margin: 0;
      display: flex;
      align-items: center;
      font-size: 18px;
      font-weight: 600;
    }

    .card-header .btn-link {
      padding: 0.5rem;
    }

    .card-header .btn-link i {
      font-size: 20px;
    }

    .card-header .btn-link i.fa-info-circle,
    .card-header .btn-link i.fa-location-dot {
      color: black;
    }

    .card-header button.rounded-circle:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .card-header button.rounded-circle.saved {
      box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.5);
      animation: pulse 0.5s;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    /* Remove Location button increased height */
    .remove-location-btn {
      height: 4.05rem !important;
      font-size: 16px !important;
    }

    .remove-location-btn i,
    .arrow-btn i {
      font-size: 16px !important;
    }

    /* Arrow buttons with chevrons and active state */
    .arrow-btn {
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .arrow-btn:active:not(:disabled) {
      background-color: #28a745 !important;
      border-color: #28a745 !important;
      color: white !important;
      transform: scale(0.95);
    }

    .arrow-btn.active {
      background-color: #28a745 !important;
      border-color: #28a745 !important;
      color: white !important;
    }

    .arrow-btn:disabled {
      opacity: 0.4;
    }

    /* Accordion header single row layout */
    .accordion-button {
      display: flex !important;
      justify-content: flex-start !important;
      align-items: center !important;
    }

    /* Accordion form controls */
    .accordion-body .form-select {
      font-size: 16px !important;
      padding: 7px 7px !important;
    }

    .accordion-body .form-control {
      font-size: 16px !important;
      padding: 7px 7px !important;
    }

    /* All inputs in map editor */
    .card-body .form-control {
      font-size: 16px !important;
      padding: 7px 7px !important;
    }
  `]
})
export class MapEditor implements OnInit {
  private readonly STORAGE_KEY = 'platform-map-editor';
  
  protected readonly currentMap = signal<PlatformMap | null>(null);
  protected readonly locations = signal<PlatformMapLocation[]>([]);
  protected readonly sendingStatus = signal<'idle' | 'sending' | 'success' | 'error'>('idle');
  protected readonly errorMessage = signal<string>('');
  protected readonly uploadingFile = signal<boolean>(false);
  protected readonly selectedAction = signal<string>('');

  constructor(private robotCommandService: RobotCommandService) {}

  ngOnInit(): void {
    this.loadMapFromStorage();
  }

  /**
   * Initialize a new empty map with default values
   */
  initializeNewMap(): void {
    const newMap: PlatformMap = {
      PlatformNumber: 1,
      MapTime: new Date().toISOString(),
      MapName: 'New Map',
      IsActive: false,
      Map: {
        PlatformID: null,
        IsNegative: false,
        FarmId: 0,
        SiteName: '',
        Locations: []
      }
    };

    this.currentMap.set(newMap);
    this.locations.set([]);
    this.sendingStatus.set('idle');
    this.errorMessage.set('');
    this.selectedAction.set('new_map');
  }

  /**
   * Handle file upload and parse JSON
   */
  async onFileUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.uploadingFile.set(true);
    this.errorMessage.set('');

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      // Validate required fields
      if (!this.validateMapJson(json)) {
        this.errorMessage.set('Invalid JSON structure. Please check the file format.');
        this.uploadingFile.set(false);
        return;
      }

      // Convert zero XLocationInMeters values to 0.001
      if (json.Map.Locations) {
        json.Map.Locations.forEach((location: PlatformMapLocation) => {
          if (location.XLocationInMeters === 0) {
            location.XLocationInMeters = 0.001;
          }
        });
      }

      // Set the map
      this.currentMap.set(json);
      this.locations.set(json.Map.Locations || []);
      this.sendingStatus.set('idle');
      this.selectedAction.set('upload');
      console.log('Map loaded successfully:', json);
    } catch (error) {
      console.error('Error parsing JSON file:', error);
      this.errorMessage.set(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.uploadingFile.set(false);
      // Reset file input
      input.value = '';
    }
  }

  /**
   * Validate the uploaded JSON structure
   */
  private validateMapJson(json: any): boolean {
    if (!json) return false;

    // Check required top-level fields
    if (typeof json.PlatformNumber !== 'number') return false;
    if (typeof json.MapName !== 'string') return false;
    if (!json.Map) return false;

    // Check Map fields
    if (typeof json.Map.IsNegative !== 'boolean') return false;
    if (typeof json.Map.FarmId !== 'number') return false;
    if (typeof json.Map.SiteName !== 'string') return false;
    if (!Array.isArray(json.Map.Locations)) return false;

    // Validate each location
    for (const loc of json.Map.Locations) {
      if (typeof loc.Index !== 'number') return false;
      if (!loc.Location || typeof loc.Location.Type !== 'number' || typeof loc.Location.ID !== 'number') return false;
      if (typeof loc.XLocationInMeters !== 'number') return false;
      if (typeof loc.YLocationInMeters !== 'number') return false;
      if (typeof loc.ZLocationInMeters !== 'number') return false;
    }

    return true;
  }

  /**
   * Export current map as JSON file
   */
  exportMapAsJson(): void {
    const map = this.currentMap();
    if (!map) return;

    // Update MapTime before export
    map.MapTime = new Date().toISOString();

    const jsonString = JSON.stringify(map, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${map.MapName}-${map.PlatformNumber}.json`;
    link.click();

    URL.revokeObjectURL(url);
    this.selectedAction.set('export');
  }

  /**
   * Add a new location to the map
   */
  addLocation(): void {
    const map = this.currentMap();
    if (!map) return;

    const currentLocations = this.locations();
    const newIndex = currentLocations.length + 1;

    const newLocation: PlatformMapLocation = {
      Index: newIndex,
      Location: {
        Type: LocationType.Unknown,
        ID: 0
      },
      XLocationInMeters: 0.001,
      YLocationInMeters: 0.0,
      ZLocationInMeters: 0.0
    };

    const updatedLocations = [...currentLocations, newLocation];
    this.locations.set(updatedLocations);
    map.Map.Locations = updatedLocations;
  }

  /**
   * Remove a location from the map and re-index
   */
  removeLocation(arrayIndex: number): void {
    if (!confirm('Are you sure you want to remove this location?')) {
      return;
    }

    const map = this.currentMap();
    if (!map) return;

    const currentLocations = this.locations();
    const updatedLocations = currentLocations.filter((_, i) => i !== arrayIndex);

    // Re-index locations sequentially
    updatedLocations.forEach((loc, index) => {
      loc.Index = index + 1;
    });

    this.locations.set(updatedLocations);
    map.Map.Locations = updatedLocations;
  }

  /**
   * Move a location up in the list
   */
  moveLocationUp(arrayIndex: number): void {
    if (arrayIndex <= 0) return;

    const map = this.currentMap();
    if (!map) return;

    const currentLocations = [...this.locations()];
    
    // Swap with previous location
    [currentLocations[arrayIndex - 1], currentLocations[arrayIndex]] = 
      [currentLocations[arrayIndex], currentLocations[arrayIndex - 1]];

    // Re-index locations sequentially
    currentLocations.forEach((loc, index) => {
      loc.Index = index + 1;
    });

    this.locations.set(currentLocations);
    map.Map.Locations = currentLocations;
  }

  /**
   * Move a location down in the list
   */
  moveLocationDown(arrayIndex: number): void {
    const currentLocations = this.locations();
    if (arrayIndex >= currentLocations.length - 1) return;

    const map = this.currentMap();
    if (!map) return;

    const updatedLocations = [...currentLocations];
    
    // Swap with next location
    [updatedLocations[arrayIndex], updatedLocations[arrayIndex + 1]] = 
      [updatedLocations[arrayIndex + 1], updatedLocations[arrayIndex]];

    // Re-index locations sequentially
    updatedLocations.forEach((loc, index) => {
      loc.Index = index + 1;
    });

    this.locations.set(updatedLocations);
    map.Map.Locations = updatedLocations;
  }

  /**
   * Send map to robot via BLE
   */
  async sendMapToRobot(): Promise<void> {
    const map = this.currentMap();
    if (!map) return;

    // Validate required fields
    if (!map.MapName || map.MapName.trim() === '') {
      this.errorMessage.set('Map name is required');
      return;
    }

    if (!map.Map.SiteName || map.Map.SiteName.trim() === '') {
      this.errorMessage.set('Site name is required');
      return;
    }

    if (map.Map.Locations.length === 0) {
      this.errorMessage.set('At least one location is required');
      return;
    }

    this.sendingStatus.set('sending');
    this.errorMessage.set('');

    try {
      // Convert zero XLocationInMeters values to 0.001 before sending
      map.Map.Locations.forEach(location => {
        if (location.XLocationInMeters === 0) {
          location.XLocationInMeters = 0.001;
        }
      });

      // Update MapTime to current time
      map.MapTime = new Date().toISOString();

      const success = await this.robotCommandService.sendMapToRobot(
        map,
        (succeed) => {
          if (succeed) {
            this.sendingStatus.set('success');
            this.selectedAction.set('send');
            setTimeout(() => this.sendingStatus.set('idle'), 3000);
          } else {
            this.sendingStatus.set('error');
            this.errorMessage.set('Failed to send map to robot');
          }
        }
      );

      if (!success) {
        this.sendingStatus.set('error');
        this.errorMessage.set('Failed to send map to robot');
      }
    } catch (error) {
      this.sendingStatus.set('error');
      this.errorMessage.set(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Error sending map to robot:', error);
    }
  }

  /**
   * Get location type enum values for template
   */
  protected readonly LocationType = LocationType;

  /**
   * Check if action is active
   */
  protected isActionActive(action: string): boolean {
    return this.selectedAction() === action;
  }

  /**
   * Get human-readable location type name
   */
  protected getLocationTypeName(type: LocationType): string {
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
      default:
        return 'Unknown';
    }
  }

  /**
   * Format coordinate values to 3 decimal places
   */
  protected formatToThreeDecimals(location: PlatformMapLocation, field: keyof PlatformMapLocation): void {
    const value = location[field] as number;
    if (typeof value === 'number' && !isNaN(value)) {
      (location[field] as number) = Number(value.toFixed(3));
    }
  }

  /**
   * Save current map to localStorage
   */
  saveMap(): void {
    const map = this.currentMap();
    if (!map) return;

    try {
      // Update MapTime before saving
      map.MapTime = new Date().toISOString();
      
      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(map));
      
      // Show success feedback
      this.selectedAction.set('save_local');
      console.log('Map saved to localStorage');
      
      // Reset action after delay
      setTimeout(() => {
        if (this.selectedAction() === 'save_local') {
          this.selectedAction.set('');
        }
      }, 2000);
    } catch (error) {
      console.error('Error saving map to localStorage:', error);
      this.errorMessage.set('Failed to save map locally');
    }
  }

  /**
   * Load map from localStorage on component initialization
   */
  private loadMapFromStorage(): void {
    try {
      const savedMap = localStorage.getItem(this.STORAGE_KEY);
      if (savedMap) {
        const map = JSON.parse(savedMap) as PlatformMap;
        
        // Basic validation - just check if essential properties exist
        if (map && map.Map && typeof map.PlatformNumber === 'number' && typeof map.MapName === 'string') {
          // Ensure all required properties exist with defaults
          if (typeof map.IsActive === 'undefined') {
            map.IsActive = false;
          }
          if (!map.MapTime) {
            map.MapTime = new Date().toISOString();
          }
          if (!Array.isArray(map.Map.Locations)) {
            map.Map.Locations = [];
          }
          
          this.currentMap.set(map);
          this.locations.set(map.Map.Locations);
          console.log('Map loaded from localStorage:', map);
        } else {
          console.warn('Invalid map data in localStorage. Expected structure not found.');
          console.log('Saved map:', map);
        }
      }
    } catch (error) {
      console.error('Error loading map from localStorage:', error);
    }
  }
}
