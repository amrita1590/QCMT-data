import { Component } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ChagepasswordchildComponent } from '../childcomponent/chagepasswordchild/chagepasswordchild.component';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-changepasswordpage',
  imports: [ChagepasswordchildComponent, CommonModule],
  templateUrl: './changepasswordpage.component.html',
  styleUrl: './changepasswordpage.component.css'
})
export class ChangepasswordpageComponent {
   toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  showToastFlag: boolean = false;

private modalRef: NgbModalRef | null = null;
 constructor(private modalService: NgbModal) {      
  
  }

 openChangePassword(content: any) {
    this.modalRef = this.modalService.open(content);
  }
  closeModel() {
    this.modalRef?.close();
  }

  showToastMessage(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;

    // Show toast
    this.showToastFlag = true;

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.showToastFlag = false;
    }, 3000);
  }
}
