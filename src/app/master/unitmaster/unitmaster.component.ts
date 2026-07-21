import { Component } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormBuilder, FormControl, FormGroup, FormsModule, NgModel, ReactiveFormsModule, Validators} from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UnitdetailsComponent } from './unitdetails/unitdetails.component';
import { UnitDetails } from '../../interface/UnitDetails';
import { UnitService } from '../../service/unit.service';
import { UserRoleDetails } from '../../interface/UserRoleDetails';
import { UsermanagementService } from '../../service/usermanagement.service';
declare var bootstrap: any;

@Component({
  selector: 'app-unitmaster',
  imports: [ReactiveFormsModule, UnitdetailsComponent, NgbModule, CommonModule, FormsModule],
  templateUrl: './unitmaster.component.html',
  styleUrl: './unitmaster.component.css'
})
export class UnitmasterComponent {
    status = false;
    confirmPasswordError = false;
    unitDetailsForm: FormGroup;
    unitDetails: UnitDetails[] = [];
    btnName = "Submit";
    statusMsg = "";

    casoList: UserRoleDetails[] = [];

    constructor(private fb: FormBuilder, private unitService: UnitService, private umService: UsermanagementService, private modalService: NgbModal) {        
        this.unitDetailsForm = this.fb.group({
          id : new FormControl(''),
          unitName:new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]),
          unitType: new FormControl('', [Validators.required]),
          casoId: ['', Validators.required],
          addDetails:new FormControl(''), zone:new FormControl(''), sector:new FormControl(''),isActive: [1], isAirport:new FormControl('')
        });
    }

    ngOnInit(): void {
        this.unitService.currentUnitData.subscribe(data => {
          if (data) {
            this.unitDetailsForm.patchValue(data); // Assuming you use Reactive Forms
            this.btnName = "Update";
          }
        });
        this.getCASODetails();
    }

    getCASODetails() {
      this.umService.getUserAuditDetailList().subscribe({
        next: (data) => {
          console.log(":::::::::::::::"+data);
          this.casoList = data.filter(user => user.rolename === 'CASO');        
          this.casoList = this.casoList.sort((a, b) => a.name.localeCompare(b.name));
          console.log('Auditors:', this.casoList);
        },
        error: (err) => {
          console.error('Failed to fetch CASO Details', err);
        } 
      });
    }

    addUnitDetails(unitDetails : UnitDetails) {
      console.log("Inside >>>> addUnitDetails");
      console.log(this.unitDetailsForm.value);
      if (this.unitDetailsForm.valid) {
        console.log("Inside >>>> form is valid");
        this.unitService.saveUnitDetails(unitDetails).subscribe((data: UnitDetails) => {
        console.log(this.unitDetails);

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
        this.unitService.clearUnitData();
        this.unitService.triggerRefresh();
        }, error => {
          console.error('Error occurred while submitting form', error);
        })     
      }   
    }
    
    clearFields(): void {
      this.unitDetailsForm.reset(); // This will reset all fields to their initial values    }
    }

    get unitName() {
      return this.unitDetailsForm.get('unitName')!;
    }
    get addDetails() {
      return this.unitDetailsForm.get('addDetails');
    }
   get casoId() {
      return this.unitDetailsForm.get('casoId')!;
   }
}
