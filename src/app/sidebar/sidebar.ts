import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { BleService } from '../services/ble.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html'
})
export class Sidebar implements OnInit, OnDestroy {
  protected readonly isOpen = signal(false);
  protected readonly connectionState = signal('disconnected');
  protected readonly pageTitle = signal('Robot BLE Monitor');
  private connectionSubscription?: Subscription;
  private routerSubscription?: Subscription;

  protected readonly navItems = [
    {
      path: '/home',
      icon: 'fa-robot',
      label: 'Connect To Device'
    },
    {
      path: '/commands',
      icon: 'fa-terminal',
      label: 'Commands'
    },
    {
      path: '/map-editor',
      icon: 'fa-map',
      label: 'Map Editor'
    },
    {
      path: '/motion-service',
      icon: 'fa-cog',
      label: 'Motion Service'
    }
  ];

  constructor(
    private router: Router,
    private location: Location,
    private bleService: BleService
  ) {}

  ngOnInit() {
    // Subscribe to BLE connection state
    this.connectionSubscription = this.bleService.connectionState$.subscribe(state => {
      this.connectionState.set(state);
    });

    // Set initial page title
    this.updatePageTitle(this.router.url);

    // Subscribe to router events using RxJS operators
    this.routerSubscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        this.updatePageTitle(event.urlAfterRedirects);
      });
  }

  ngOnDestroy() {
    this.connectionSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  private updatePageTitle(url: string): void {
    if (url.includes('/home')) {
      this.pageTitle.set('Connect To Device');
    } else if (url.includes('/commands')) {
      this.pageTitle.set('Commands');
    } else if (url.includes('/map-editor')) {
      this.pageTitle.set('Map Editor');
    } else if (url.includes('/motion-service')) {
      this.pageTitle.set('Motion Service');
    } else {
      this.pageTitle.set('Robot BLE Monitor');
    }
  }

  toggleSidebar() {
    this.isOpen.update(value => !value);
  }

  closeSidebar() {
    this.isOpen.set(false);
  }

  goBack() {
    this.location.back();
  }
}
