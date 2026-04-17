import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
private config: any = {};

  constructor(private http: HttpClient) {}

  // Load config file
  loadConfig(): Promise<void> {
    return this.http.get('/assets/app-config.json')
      .toPromise()
      .then(data => {
        this.config = data;
      })
      .catch(err => {
        console.error('Config load failed', err);
      });
  }

  // Get value like properties file
  get(key: string): any {
    return this.config[key];
  }
}
