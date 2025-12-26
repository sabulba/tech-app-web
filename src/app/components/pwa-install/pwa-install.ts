import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pwa-install',
  imports: [CommonModule],
  templateUrl: './pwa-install.html',
  styleUrls: ['./pwa-install.scss']
})
export class PwaInstall implements OnInit {
  showInstallButton = false;
  private deferredPrompt: any = null;

  ngOnInit() {
    // Check if app is already installed
    if (this.isAppInstalled()) {
      this.showInstallButton = false;
      return;
    }

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton = true;
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      this.showInstallButton = false;
      this.deferredPrompt = null;
    });
  }

  async installPwa() {
    if (!this.deferredPrompt) {
      return;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    this.deferredPrompt = null;
    this.showInstallButton = false;
  }

  private isAppInstalled(): boolean {
    // Check if running in standalone mode
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }
}
