import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Create Password</h2>
        <p class="subtitle">Please create a secure password</p>

        <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <input
              type="password"
              id="password"
              formControlName="password"
              placeholder="Password"
              [class.is-invalid]="password?.invalid && password?.touched"
            />
            <div class="invalid-feedback" *ngIf="password?.invalid && password?.touched">
              <div *ngIf="password?.errors?.['required']">Password is required</div>
              <div *ngIf="password?.errors?.['minlength']">Password must be at least 6 characters</div>
            </div>
          </div>

          <div class="form-group">
            <input
              type="password"
              id="confirmPassword"
              formControlName="confirmPassword"
              placeholder="Confirm Password"
              [class.is-invalid]="confirmPassword?.invalid && confirmPassword?.touched"
            />
            <div class="invalid-feedback" *ngIf="confirmPassword?.invalid && confirmPassword?.touched">
              <div *ngIf="confirmPassword?.errors?.['required']">Please confirm your password</div>
            </div>
            <div class="invalid-feedback" *ngIf="passwordForm.errors?.['mismatch'] && confirmPassword?.touched">
              Passwords do not match
            </div>
          </div>

          <div class="form-group">
            <button type="submit" class="next-btn" [disabled]="passwordForm.invalid || isLoading">
              <span *ngIf="!isLoading">Complete Registration</span>
              <span *ngIf="isLoading">Processing...</span>
              <i class="fas fa-check"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['../register/register.component.scss']
})
export class RegisterPasswordComponent implements OnInit {
  passwordForm: FormGroup;
  isLoading = false;
  registerData: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Get the stored registration data
    const storedData = sessionStorage.getItem('registerData');
    if (!storedData) {
      this.router.navigate(['/auth/register']);
      return;
    }
    this.registerData = JSON.parse(storedData);
  }

  get password() { return this.passwordForm.get('password'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  onSubmit(): void {
    if (this.passwordForm.valid) {
      this.isLoading = true;
      const { name, email, tenant_id } = this.registerData;
      const { password } = this.passwordForm.value;

      this.authService.register(name, email, password, tenant_id).subscribe({
        next: (response) => {
          this.isLoading = false;
          sessionStorage.removeItem('registerData');
          this.toastr.success('Registration successful! Please login.', 'Success');
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error(
            error.error?.message || 'Registration failed. Please try again.',
            'Error'
          );
        }
      });
    } else {
      // Mark all fields as touched to show validation messages
      Object.keys(this.passwordForm.controls).forEach(key => {
        this.passwordForm.get(key)?.markAsTouched();
      });
    }
  }
}