import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { PwaInstall } from './components/pwa-install/pwa-install';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar, PwaInstall],
  templateUrl: './app.html'
})
export class App {
  protected readonly title = signal('ble-app');
}
