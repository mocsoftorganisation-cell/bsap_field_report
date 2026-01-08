import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-settings',
    imports: [CommonModule],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  settings = {
    notifications: true,
    darkMode: false,
    language: 'en',
    autoSave: true
  };

  updateSetting(key: string, value: any) {
    (this.settings as any)[key] = value;
  }
}