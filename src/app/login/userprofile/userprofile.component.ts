import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UsermanagementService } from '../../service/usermanagement.service';
import { User } from '../../interface/User';

@Component({
  selector: 'app-userprofile',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './userprofile.component.html',
  styleUrl: './userprofile.component.css'
})
export class UserprofileComponent {
    profileImage: string | ArrayBuffer | null = null;
    emailStatus: boolean = true;
    errorMsg: string | null = null;
    errorStatus: boolean = false;
    successMsg: string | null = null;
    successStatus: boolean = false;
    userDetails: User | null = null;
    user = {
      fullName: '',
      email: '',
      mobile: '',
      address: '',
      instituteName: ''
    };
    constructor(private umService: UsermanagementService) {
      
    }

    ngOnInit() {
      //Fetch user profile from backend if needed
      this.umService.getUserProfileDetails().subscribe(userData => {
        console.log("User Profile Data:", userData);
        this.userDetails = userData;
        this.user.fullName = userData?.mstr_name || '';
        this.user.email = userData?.email || '';
        this.user.mobile = userData?.mobileNo.toString() || '';
        this.user.address = userData?.address || '';
        this.user.instituteName = userData?.organizationName || '';
        console.log("User Details:", this.user);
      });
      
    }

    // Image upload preview
    onFileSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => this.profileImage = reader.result;
        reader.readAsDataURL(file);
      }
    }

    updateProfile() {
      // Null safety check
      if (!this.user) {
        this.errorMsg = "User details are missing.";
        this.errorStatus = true;
        return;
      }

      const fullName = this.user.fullName?.trim() || '';
      const mobile = this.user.mobile?.toString().trim() || '';
      const institute = this.user.instituteName?.trim() || '';
      const address = this.user.address?.trim() || '';

      // Mandatory fields validation
      if (!fullName || !mobile || !institute || !address) {
        this.errorMsg = "Please fill all mandatory fields.";
        this.errorStatus = true;
        return;
      }

      // Mobile number validation (must be exactly 10 digits)
      if (!/^\d{10}$/.test(mobile)) {
        this.errorMsg = "Please enter a valid 10-digit mobile number.";
        this.errorStatus = true;
        return;
      }

      // Map to userDetails
      this.userDetails = {
        ...this.userDetails,
        mstr_name: fullName,
        username: fullName,
        mobileNo: Number(mobile),
        address: address,
        organizationName: institute,
        createdBy: this.userDetails?.createdBy || 'system', // Fallback to 'system' if createdBy is missing
        userRolesList: this.userDetails?.userRolesList || [], // Preserve existing roles or set to empty array
        status: this.userDetails?.status || 'ACTIVE' // Preserve existing status or set to 'ACTIVE'
      };

      // Call API with success + error handling
      this.umService.updateUserProfileDetails(this.userDetails).subscribe({
        next: (response) => {
          this.successMsg = "Profile updated successfully.";
          this.successStatus = true;
          this.errorStatus = false;
        },
        error: (err) => {
          console.error("❌ Profile Update Error:", err);
          this.errorMsg = "Failed to update profile. Please try again.";
          this.errorStatus = true;
        }
      });
    }
}
