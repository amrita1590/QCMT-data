import { Component } from '@angular/core';
import { ToastService } from '../service/toast.service';
import { NgIf, NgClass, CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-toast',
  imports: [NgIf, NgClass, CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent {
    
  constructor(public toastService: ToastService) {}
  
}
