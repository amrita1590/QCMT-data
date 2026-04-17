import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, NgModel, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { StudentDetails } from '../interface/StudentDetails';
import { StudentService } from '../service/student.service';
import { StudentdetailsComponent } from "./studentdetails/studentdetails.component";
import { NgbDatepickerModule, NgbDateStruct, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { ClassdetailsService } from '../service/classdetails.service';
import { ClassDetails } from '../interface/ClassDetails';

@Component({
  selector: 'app-student',
  imports: [ReactiveFormsModule, StudentdetailsComponent, NgbModule, CommonModule, NgbDatepickerModule, FormsModule],
  templateUrl: './student.component.html',
  styleUrl: './student.component.css'
})
export class StudentComponent {
    status = false;
    studentDetailsForm: FormGroup;
    studentDetails: StudentDetails[] = [];
    btnName = "Submit";
    statusMsg = "";
    classList: ClassDetails[] = [];
   
    constructor(private fb: FormBuilder, private studentService: StudentService, private classService: ClassdetailsService) {        
        this.studentDetailsForm = this.fb.group({
          id : new FormControl(''),
          firstName:new FormControl('', [Validators.required, Validators.minLength(2)]),
          lastName:new FormControl(''),
          email:new FormControl('', [Validators.required, Validators.email]),
          mobileNo:new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]),
          addDetails:new FormControl(''),
          dateOfBirth:new FormControl('',Validators.required),
          admissionDate:new FormControl('',Validators.required), 
          admissionNo: new FormControl(''), 
          classId: new FormControl('',Validators.required)
        });
    }

    ngOnInit(): void {
        this.studentService.currentStudentData.subscribe(data => {
          if (data) {            
            this.studentDetailsForm.patchValue(data); // Assuming you use Reactive Forms
            if(data.dateOfBirth) {
              const parsedDate = this.parseDateString(data.dateOfBirth);
              this.studentDetailsForm.get('dateOfBirth')?.setValue(parsedDate);
            }
            if(data.admissionDate) {
              const parsedDate = this.parseDateString(data.admissionDate);
              this.studentDetailsForm.get('admissionDate')?.setValue(parsedDate);
            }
            this.btnName = "Update";
          }
        });   
        this.classService.getClassDetails().subscribe({
          next: (data) => {
            this.classList = data;
          },
          error: (err) => {
            console.error('Failed to fetch classes', err);
          }
        });
     }    
        
    addStudentDetails(studentDetails : StudentDetails) {
      console.log("Inside >>>> addStudentDetails");
      console.log(this.studentDetailsForm.value);
      if (this.studentDetailsForm.valid) {

        studentDetails.dateOfBirth = this.dateOfBirth;
        studentDetails.admissionDate = this.admissionDate;
        console.log("Inside >>>> form is valid");
        this.studentService.saveStudentDetails(studentDetails).subscribe((data: StudentDetails) => {
        console.log(this.studentDetails);
    
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
        this.studentService.clearStudentData();
        this.studentService.triggerRefresh();
        }, error => {
          console.error('Error occurred while submitting form', error);
        })     
      }   
    }
    
    clearFields(): void {
      this.studentDetailsForm.reset(); // This will reset all fields to their initial values    }
    }
    get firstName() {
      return this.studentDetailsForm.get('firstName');
    }  
    get lastName() {
      return this.studentDetailsForm.get('lastName');
    }  
    get email() {
      return this.studentDetailsForm.get('email');
    } 
    get mobileNo() {
      return this.studentDetailsForm.get('mobileNo');
    }  
    get admissionNo() {
      return this.studentDetailsForm.get('admissionNo');
    }  

    get classId() {
      return this.studentDetailsForm.get('classId');
    } 
    
    get dateOfBirth() {      
      const date = this.studentDetailsForm.get('dateOfBirth')?.value;
      if (date) {
        return `${date.year}-${this.pad(date.month)}-${this.pad(date.day)}`;
      }
      return null;
    }

    get admissionDate() {      
      const date = this.studentDetailsForm.get('admissionDate')?.value;
      if (date) {
        return `${date.year}-${this.pad(date.month)}-${this.pad(date.day)}`;
      }
      return null;
    }
    
    private pad(n: number): string {
      return n < 10 ? '0' + n : n.toString();
    }
    parseDateString(dateStr: string): NgbDateStruct {
      const [year, month, day] = dateStr.split('-').map(Number);
      return { year, month, day };
    }
 
}
