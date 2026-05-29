import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { User } from '../interface/User';
import { UsermanagementService } from '../service/usermanagement.service';
import { CommonModule } from '@angular/common';
import { UnitService } from '../service/unit.service';
import { UnitDetails } from '../interface/UnitDetails';

@Component({
  selector: 'app-register',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
   cisfRanks = [
    { code: 'DG', name: 'Director General' },
    { code: 'ADG', name: 'Additional Director General'},
    { code: 'IG', name: 'Inspector General'},
    { code: 'DIG', name: 'Deputy Inspector General' },
    { code: 'SR CMDT', name: 'Senior Commandant' },
    { code: 'CMDT', name: 'Commandant' },
    { code: 'DC', name: 'Deputy Commandant' },
    { code: 'AC', name: 'Assistant Commandant' },
    { code: 'INSP', name: 'Inspector' },
    { code: 'SI', name: 'Sub Inspector' },
    { code: 'ASI', name: 'Assistant Sub Inspector' },
    { code: 'HC', name: 'Head Constable' },
    { code: 'CONST', name: 'Constable' }
  ];
  scopeLevels = [
  { id: 'ADG', name: 'ADG Level' },
  { id: 'Sector', name: 'Sector Level' },
  { id: 'Zone', name: 'Zone Level' },
  { id: 'Unit' , name: 'Unit Level' }
];
units:UnitDetails[]=[];
sectors:string[]=[];
zones:string[]=[];
    status = false;
    confirmPasswordError = false;
    users: User[] = [];
    userDetailsForm: FormGroup;

    ngOnInit() {
      this.unitService.getUnitDetails().subscribe({
        next: (data) => {
      this.units = data.sort((a, b) =>
        a.unitName?.toLowerCase().localeCompare(
          b.unitName?.toLowerCase()
        )
      );
    
          this.zones = [...new Set(
  this.units
    .map(u => u.zone)
    .filter(z => z)
)];

this.sectors = [...new Set(
  this.units
    .map(u => u.sector)
    .filter(s => s)
)];
this.userDetailsForm.get('userscopelevel')?.valueChanges.subscribe(scope => {
    this.handleScopeChange(scope);
  });
        },
        error: (err) => {
          console.error('Failed to fetch units', err);
        }
      });
    }
  handleScopeChange(scope: any) {
    // Disable all first
    this.userDetailsForm.get('sector')?.disable({ emitEvent: false });
    this.userDetailsForm.get('zone')?.disable({ emitEvent: false });

    // Reset values
    this.userDetailsForm.get('sector')?.reset(null, { emitEvent: false });
    this.userDetailsForm.get('zone')?.reset(null, { emitEvent: false });

    if (!scope) return;

    // Unit enabled in ALL scope cases
    this.userDetailsForm.get('unitmaster.id')?.enable({ emitEvent: false });

    if (scope == 'Sector') {
      this.userDetailsForm.get('sector')?.enable({ emitEvent: false });
    }

    if (scope == 'Zone') {
      this.userDetailsForm.get('zone')?.enable({ emitEvent: false });
    }
    
    // Update form validity after all changes
    this.userDetailsForm.updateValueAndValidity({ emitEvent: false });
  }
    constructor(private fb: FormBuilder, private umService: UsermanagementService, private unitService: UnitService, private cdr: ChangeDetectorRef) {
     this.userDetailsForm = this.fb.group(
    {
      username: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmpassword: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.required, Validators.email]],
      mobileNo: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/)
      ]],
      organizationName: ['CISF'],
      address: [''],
      rank: ['', Validators.required],
      cisfno: ['', [Validators.required, Validators.maxLength(9)]],
      sector: [{ value: '', disabled: true }],
      zone: [{ value: '', disabled: true }],
      userscopelevel: ['', Validators.required],
      additionaldetails: [''],

      // ✅ Nested FormGroup
      unitmaster: this.fb.group({
        id: ['']
      })
    },
    {
      validators: this.passwordMatchValidator
    }
  );
    }
 onRankChange(event: Event): void {
    const selectedCode = (event.target as HTMLSelectElement).value;
    console.log('Selected rank code:', selectedCode);
    // Access full rank object
    const selectedRank = this.cisfRanks.find(r => r.code === selectedCode);
    
    console.log('Selected rank details:', selectedRank);
  }
    passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
      return form.get('password')?.value === form.get('confirmpassword')?.value ? null : { 'mismatch': true };
    }

    getUserDetails(): void {
      
    }

    addUserDetails() {
      this.userDetailsForm.markAllAsTouched();
      this.userDetailsForm.updateValueAndValidity();
      this.cdr.detectChanges(); // 🔥 Force change detection immediately
      
      console.log("add user print", this.userDetailsForm.valid);

      if (this.userDetailsForm.valid) {
        const user = this.userDetailsForm.getRawValue(); // ✅ Use getRawValue() to include disabled fields
        console.log("value:", JSON.stringify(user));
        console.log(user);
       
        this.umService.addRegisterUserDetails(user).subscribe((data: User) => {
          console.log(this.users);
          console.log("User added successfully!", data);
          this.status = true;
          setTimeout(() => {
            this.status = false;
          }, 10000);
          this.clearFields();
        }, error => {
          console.error('Error occurred while submitting form', error);
        })     
      }   
    }

  clearFields(): void {
    this.userDetailsForm.reset(); // This will reset all fields to their initial values    }
  }

  get username() {
    return this.userDetailsForm.get('username');
  }
  get password() {
    return this.userDetailsForm.get('password');
  }
  get confirmpassword() {
    return this.userDetailsForm.get('confirmpassword');
  }
  get email() {
    return this.userDetailsForm.get('email');
  }
  get mobileNo() {
    return this.userDetailsForm.get('mobileNo');
  }
  get userscopelevel() {
    return this.userDetailsForm.get('userscopelevel');
  }
  get rank() {
  return this.userDetailsForm.get('rank');
}


  get organizationName() {
    return this.userDetailsForm.get('organizationName');
  }



}
