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

private modalRef: NgbModalRef | null = null;
 constructor(private modalService: NgbModal) {

  }

 openChangePassword(content: any) {
    this.modalRef = this.modalService.open(content);
  }
  closeModel() {
    this.modalRef?.close();
  }
}
