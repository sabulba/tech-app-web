import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Commands } from './commands/commands';
import { MapEditor } from './map-editor/map-editor';
import { MotionService } from './motion-service/motion-service';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'commands', component: Commands },
  { path: 'map-editor', component: MapEditor },
  { path: 'motion-service', component: MotionService },
  { path: '**', redirectTo: '/home' }
];
