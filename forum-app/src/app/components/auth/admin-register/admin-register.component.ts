import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './admin-register.component.html',
  styleUrls: ['./admin-register.component.scss']
})
export class AdminRegisterComponent implements OnInit {

  adminForm: FormGroup;
  tenantForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showPasswordConfirm = false;
  currentStep = 1; // 1 = Admin info, 2 = Tenant info, 3 = Review & Create
  selectedFileName: any;
  logoPreviewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.adminForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });

    this.tenantForm = this.fb.group({
      tenantName: ['', [Validators.required, Validators.minLength(3)]],
      tenantDomain: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/)]],
      logoFile: [null],
      termsAccepted: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    // If user is already logged in, redirect to home
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  // Admin form getters
  get name() { return this.adminForm.get('name'); }
  get email() { return this.adminForm.get('email'); }
  get password() { return this.adminForm.get('password'); }
  get confirmPassword() { return this.adminForm.get('confirmPassword'); }

  // Tenant form getters
  get tenantName() { return this.tenantForm.get('tenantName'); }
  get tenantDomain() { return this.tenantForm.get('tenantDomain'); }
  get termsAccepted() { return this.tenantForm.get('termsAccepted'); }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.adminForm.valid) {
      this.currentStep = 2;
    } else if (this.currentStep === 2 && this.tenantForm.valid) {
      this.currentStep = 3;
    } else {
      // Mark all fields as touched to show validation messages
      if (this.currentStep === 1) {
        Object.keys(this.adminForm.controls).forEach(key => {
          this.adminForm.get(key)?.markAsTouched();
        });
      } else if (this.currentStep === 2) {
        Object.keys(this.tenantForm.controls).forEach(key => {
          this.tenantForm.get(key)?.markAsTouched();
        });
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  submitForms(): void {
    if (this.adminForm.valid && this.tenantForm.valid) {
      this.isLoading = true;

      // Create FormData to handle file upload
      const formData = new FormData();

      // Append all tenant form values
      formData.append('tenantName', this.tenantForm.get('tenantName')?.value);
      formData.append('tenantDomain', this.tenantForm.get('tenantDomain')?.value);

      // Append logo file if available
      const logoFile = this.tenantForm.get('logoFile')?.value;
      if (logoFile) {
        formData.append('logoFile', logoFile, logoFile.name);
      }

      formData.append('termsAccepted', this.tenantForm.get('termsAccepted')?.value);

      this.createTenant(formData);
    } else {
      // Mark all fields as touched to show validation messages
      Object.keys(this.adminForm.controls).forEach(key => {
        this.adminForm.get(key)?.markAsTouched();
      });
      Object.keys(this.tenantForm.controls).forEach(key => {
        this.tenantForm.get(key)?.markAsTouched();
      });
    }
  }

  createTenant(tenantData: FormData): void {
    this.authService.createTenant(tenantData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastr.success('Tenant created successfully! Invitation emails will be sent shortly.', 'Success');
        this.registerAdmin(this.adminForm.value, response.tenant_id);
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error(`Failed to create tenant. Please try again.\r ${error.error.message}`, 'Error');
        console.error('Tenant creation error:', error);
      }
    });
  }

  registerAdmin(adminData: any, tenant_id: number): void {
    this.authService.registerAdmin(adminData.name, adminData.email, adminData.password, tenant_id).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastr.success('Admin registered successfully! Invitation emails will be sent shortly.', 'Success');
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Failed to register admin. Please try again.', 'Error');
        console.error('Admin registration error:', error);
      }
    });
  }

  onFileSelected($event: Event) {
    const input = $event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFileName = file.name;
      this.tenantForm.patchValue({
        logoFile: file
      });
      this.logoPreviewUrl = URL.createObjectURL(file);
    }
    else {
      this.selectedFileName = null;
      this.tenantForm.patchValue({
        logoFile: null
      });
      this.logoPreviewUrl = null;
    }
  }
}
