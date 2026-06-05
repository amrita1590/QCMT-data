import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UsermanagementService } from '../../service/usermanagement.service';
import { User } from '../../interface/User';
import { UnitService } from '../../service/unit.service';
import { UnitDetails } from '../../interface/UnitDetails';

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

    cisfRanks = [
      { code: 'DG', name: 'Director General' },
      { code: 'ADG', name: 'Additional Director General' },
      { code: 'IG', name: 'Inspector General' },
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

    units: UnitDetails[] = [];
    zones: string[] = [];
    sectors: string[] = [];
    scopeLevels = [
      { id: 'ADG', name: 'ADG Level' },
      { id: 'Sector', name: 'Sector Level' },
      { id: 'Zone', name: 'Zone Level' },
      { id: 'Unit', name: 'Unit Level' }
    ];

    user = {
      fullName: '',
      email: '',
      mobile: '',
      address: '',
      instituteName: '',
      unitid: null as number | null,
      userscopelevel: '',
      zone: '',
      sector: '',
      rank: ''
    };

    constructor(private umService: UsermanagementService, private unitService: UnitService) {}

    ngOnInit() {
      this.unitService.getUnitDetails().subscribe({
        next: (data) => {
          this.units = data.sort((a, b) =>
            a.unitName?.toLowerCase().localeCompare(b.unitName?.toLowerCase())
          );
          this.zones = [...new Set(this.units.map(u => u.zone).filter(z => z))];
          this.sectors = [...new Set(this.units.map(u => u.sector).filter(s => s))];
        },
        error: (err) => console.error('Failed to fetch units', err)
      });

      this.umService.getUserProfileDetails().subscribe(userData => {
        this.userDetails = userData;
        this.user.fullName = userData?.mstr_name || '';
        this.user.email = userData?.email || '';
        this.user.mobile = userData?.mobileNo.toString() || '';
        this.user.address = userData?.address || '';
        this.user.instituteName = userData?.organizationName || '';
        this.user.unitid = userData?.unitid ?? null;
        this.user.userscopelevel = userData?.userscopelevel || '';
        this.user.zone = userData?.zone || '';
        this.user.sector = userData?.sector || '';
        this.user.rank = userData?.rank || '';
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
        unitid: this.user.unitid ?? undefined,
        userscopelevel: this.user.userscopelevel || undefined,
        zone: this.user.zone || undefined,
        sector: this.user.sector || undefined,
        rank: this.user.rank || undefined,
        createdBy: this.userDetails?.createdBy || 'system',
        userRolesList: this.userDetails?.userRolesList || [],
        status: this.userDetails?.status || 'ACTIVE'
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
