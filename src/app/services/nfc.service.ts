import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NfcService {
  // Web NFC API service for scanning NFC tags
  private scannedTextSubject = new BehaviorSubject<string>('');
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  public scannedText$: Observable<string> = this.scannedTextSubject.asObservable();
  public error$: Observable<string | null> = this.errorSubject.asObservable();
  
  private ndef: any = null; // Will be NDEFReader when types are available
  
  constructor() {
    // Don't auto-start scanning - requires user gesture
    this.checkNfcSupport();
  }
  
  private checkNfcSupport(): void {
    if (!('NDEFReader' in window)) {
      this.errorSubject.next('NFC is not supported on this device. Please use Chrome on Android.');
      console.warn('Web NFC is not supported on this device');
    }
  }
  
  /**
   * Start NFC scanning - must be called from a user gesture (button click)
   */
  public async startScan(): Promise<void> {
    if (!('NDEFReader' in window)) {
      this.errorSubject.next('NFC is not supported on this device. Please use Chrome on Android.');
      return;
    }
    
    try {
      // Create NDEFReader instance if not already created
      if (!this.ndef) {
        this.ndef = new (window as any).NDEFReader();
      }
      
      // Start scanning
      await this.startScanning();
    } catch (error: any) {
      console.error('NFC initialization error:', error);
      this.handleNfcError(error);
    }
  }
  
  private async startScanning(): Promise<void> {
    if (!this.ndef) {
      return;
    }
    
    try {
      // Request permission and start scanning
      await this.ndef.scan();
      console.log('NFC scan started');
      
      // Set up event listener for NFC tag reads
      this.ndef.onreading = (event: any) => {
        console.log('NFC tag detected:', event.serialNumber);
        this.handleNfcReading(event);
      };
      
      // Handle reading errors
      this.ndef.onreadingerror = (error: any) => {
        console.error('NFC reading error:', error);
        this.errorSubject.next('NFC scan failed. Please try again.');
      };
      
    } catch (error: any) {
      console.error('NFC scan error:', error);
      this.handleNfcError(error);
    }
  }
  
  private handleNfcReading(event: any): void {
    try {
      const message = event.message;
      
      // Find the first text record
      for (const record of message.records) {
        if (record.recordType === 'text') {
          // Decode the text data
          const textDecoder = new TextDecoder(record.encoding || 'utf-8');
          const text = textDecoder.decode(record.data);
          
          console.log('NFC text read:', text);
          
          // Emit the scanned text in uppercase
          this.scannedTextSubject.next(text.toUpperCase());
          
          // Clear any previous errors
          this.errorSubject.next(null);
          
          // Use only the first text record
          return;
        }
      }
      
      // No text record found
      console.warn('No text record found in NFC tag');
      this.errorSubject.next('No text data found on NFC tag.');
      
    } catch (error: any) {
      console.error('Error processing NFC data:', error);
      this.errorSubject.next('Failed to read NFC tag data.');
    }
  }
  
  private handleNfcError(error: any): void {
    if (error.name === 'NotAllowedError') {
      this.errorSubject.next('NFC permission denied. Please allow NFC access in browser settings.');
    } else if (error.name === 'NotSupportedError') {
      this.errorSubject.next('NFC is not supported on this device. Please use Chrome on Android.');
    } else if (error.name === 'NotReadableError') {
      this.errorSubject.next('NFC scan failed. Please try again.');
    } else {
      this.errorSubject.next(`NFC error: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Check if Web NFC is supported
   */
  public isSupported(): boolean {
    return 'NDEFReader' in window;
  }
  
}
