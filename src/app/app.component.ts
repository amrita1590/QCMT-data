import { Component, HostListener, signal, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeftSidebarComponent } from './left-sidebar/left-sidebar.component';
import { MainComponent } from './main/main.component';
import { isPlatformBrowser } from '@angular/common';
import { ToastComponent } from "./toast/toast.component";

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    ReactiveFormsModule,
    LeftSidebarComponent,
    MainComponent,
    ToastComponent
],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']  // Corrected from styleUrl to styleUrls
})
export class AppComponent implements OnInit {
  title = 'qcmt-app';
  curURL = 'dummy';
  
  isLeftSidebarCollapsed = signal<boolean>(false);
  screenWidth = signal<number>(0); // Initialize to 0

  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  shouldShowHeader(): boolean {
    this.curURL = this.router.url;

    if(this.curURL == '/' || this.curURL == '/about' ||    this.curURL == '/contact' ||  this.curURL == '/login' 
      ||  this.curURL == '/updatepassword' ||  this.curURL == '/privacy' || this.curURL == '/terms') {
      return true;
    } // Adjust the path as necessary
    return false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    if (isPlatformBrowser(this.platformId)) {
      this.screenWidth.set(window.innerWidth);
      if (this.screenWidth() < 768) {
        this.isLeftSidebarCollapsed.set(true);
      } else {
        this.isLeftSidebarCollapsed.set(false);
      }
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.screenWidth.set(window.innerWidth);
      this.isLeftSidebarCollapsed.set(this.screenWidth() < 768);
    }
  }

  changeIsLeftSidebarCollapsed(isLeftSidebarCollapsed: boolean): void {
    this.isLeftSidebarCollapsed.set(isLeftSidebarCollapsed);
  }
}
