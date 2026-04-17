import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuditScheduleComponent } from '../audit-schedule/audit-schedule.component';
import { UnitDetails } from '../../interface/UnitDetails';
import { AuditorsService } from '../../service/auditors.service';
import { AuditorDetails } from '../../interface/auditor-details';
import { off } from 'process';
import { EventEmitter } from 'stream';
import { AuditorsDetailComponent } from './auditors-detail/auditors-detail.component';
import { UnitService } from '../../service/unit.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auditors',
  imports: [CommonModule, ReactiveFormsModule, AuditorsDetailComponent],
  templateUrl: './auditors.component.html',
  styleUrl: './auditors.component.css'
})
export class AuditorsComponent {
  units:UnitDetails[]=[];
   status = false;
    auditorsDetailsForm: FormGroup;
    auditorsDetails: AuditorDetails[] = [];
    btnName = "Submit";
    statusMsg = "";
    
    constructor(private fb: FormBuilder, private auditorService: AuditorsService, private modalService: NgbModal, private unitService: UnitService) {        
        this.auditorsDetailsForm = this.fb.group({
          officerId : new FormControl('',[Validators.required, Validators.minLength(9), Validators.maxLength(9)]),
          name:new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]),
          rank:new FormControl(''), unit:new FormControl(''), email:new FormControl(''),isActive: [1], mobileno:new FormControl('',[Validators.required, Validators.minLength(10), Validators.maxLength(10)]),
           unitmaster: this.fb.group({
      id: ['']   // ✅ nested object
    })
        });
    }

     ngOnInit() {
this.unitService.getUnitDetails().subscribe({
        next: (data) => {
          this.units = data;
        },
        error: (err) => {
          console.error('Failed to fetch units', err);
        }
      });}

      openAddAuditorModal(content: any) {
    this.auditorsDetailsForm.reset({ isActive: 1 });
    this.modalService.open(content, {
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });
  }

addAuditorDetails(auditorDetails : AuditorDetails, modal: any) {
    if (this.auditorsDetailsForm.invalid) {
      return;
    }
      console.log("Inside >>>> addAuditorDetails");
      console.log(this.auditorsDetailsForm.value);
      if (this.auditorsDetailsForm.valid) {
        console.log("Inside >>>> form is valid");
        this.auditorService.saveAuditorDetails(auditorDetails).subscribe((data: AuditorDetails) => {
        console.log(this.auditorsDetails);
         modal.close();  
        this.status = true;
        if(this.btnName == "Update") {
          this.statusMsg = "Data updated successfully!";
          this.btnName = "Submit";
        } else {
          this.statusMsg = "Data save successfully!";
        }
        setTimeout(() => {
          this.status = false; // Hide the div after 10 seconds
        }, 10000); // 10000 milliseconds = 10 seconds
        this.clearFields();
        this.auditorService.clearAuditorData();
        this.auditorService.triggerRefresh();
        }, (error: any) => {
          console.error('Error occurred while submitting form', error);
        })     
      }   
    }
    clearFields(): void {
      this.auditorsDetailsForm.reset(); // This will reset all fields to their initial values    }
    }
    get name() {
      return this.auditorsDetailsForm.get('name');
    }
    get rank() {
      return this.auditorsDetailsForm.get('rank');
    }
    get unit() {
      return this.auditorsDetailsForm.get('unit');
    }
    get email() {
      return this.auditorsDetailsForm.get('email');
    }
    get mobileno() {
      return this.auditorsDetailsForm.get('mobileno');
    }
    get officerId() {
      return this.auditorsDetailsForm.get('officerId');
    }
submit(formname:string){
console.log('Error occurred while submitting form', formname);
}
}     