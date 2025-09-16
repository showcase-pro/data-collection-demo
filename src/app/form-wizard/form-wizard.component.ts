import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MatStepper } from '@angular/material/stepper';
import { FormResetService } from '../services/form-reset.service';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-form-wizard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatSlideToggleModule
  ],
  templateUrl: './form-wizard.component.html',
  styleUrl: './form-wizard.component.scss'
})
export class FormWizardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper;

  private resetSubscription!: Subscription;

  personalInfoForm: FormGroup;
  preferencesForm: FormGroup;
  securityForm: FormGroup;
  reviewForm: FormGroup;

  hidePassword = true;
  showSubmissionResult = false;
  submissionData: any = null;
  currentStep = 0;
  isDataLoaded = false;

  get step0Completed() {
    return true; // Overview step is always completed
  }

  get step1Completed() {
    return this.personalInfoForm.valid;
  }

  get step2Completed() {
    return this.preferencesForm.valid;
  }

  get step3Completed() {
    return this.securityForm.valid;
  }

  industries = [
    { value: 'tech', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'education', label: 'Education' },
    { value: 'other', label: 'Other' }
  ];

  constructor(private fb: FormBuilder, private snackBar: MatSnackBar, private formResetService: FormResetService, private cdr: ChangeDetectorRef) {
    this.personalInfoForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]{10,}$/)]],
      address: ['']
    });

    this.preferencesForm = this.fb.group({
      accountType: ['personal', Validators.required],
      industry: ['', Validators.required],
      companyName: [''],
      language: ['en', Validators.required],
      emailNotifications: [true],
      smsNotifications: [false],
      marketingEmails: [false]
    });

    this.securityForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
      confirmPassword: ['', Validators.required],
      twoFactorAuth: [false],
      securityQuestion1: ['', Validators.required],
      securityAnswer1: ['', Validators.required],
      securityQuestion2: ['', Validators.required],
      securityAnswer2: ['', Validators.required],
      recoveryEmail: ['', Validators.email]
    }, { validators: this.passwordMatchValidator });

    this.reviewForm = this.fb.group({
      terms: [false, Validators.requiredTrue],
      privacy: [false, Validators.requiredTrue],
      dataProcessing: [false, Validators.requiredTrue],
      newsletter: [false]
    });
  }

  ngOnInit() {
    this.loadSavedData();
    this.setupAutoSave();
    this.checkSubmissionData();
    this.setupBeforeUnloadHandler();

    // Subscribe to reset events from header
    this.resetSubscription = this.formResetService.resetForm$.subscribe(() => {
      this.resetForm();
    });
  }

  ngAfterViewInit() {
    // Restore stepper position after view is initialized and forms are loaded
    setTimeout(() => {
      this.setStepperToCurrentStep();
      // Force stepper to recognize form validity
      this.forceStepperUpdate();
    }, 300);
  }

  setupBeforeUnloadHandler() {
    // Save data before page unload
    window.addEventListener('beforeunload', () => {
      this.saveFormData();
    });

    // Also save on visibility change (tab switch, minimize, etc.)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveFormData();
      }
    });
  }

  loadSavedData() {
    const savedData = localStorage.getItem('form-data');
    if (savedData) {
      try {
        const formData = JSON.parse(savedData);

        if (formData.personalInfo) {
          this.personalInfoForm.patchValue(formData.personalInfo);
          // Mark all controls as touched and dirty, especially required ones
          Object.keys(this.personalInfoForm.controls).forEach(key => {
            const control = this.personalInfoForm.get(key);
            if (control) {
              control.markAsTouched();
              control.markAsDirty();
              // Force validation update
              control.updateValueAndValidity();
            }
          });
          this.personalInfoForm.updateValueAndValidity();
        }

        if (formData.preferences) {
          this.preferencesForm.patchValue(formData.preferences);
          Object.keys(this.preferencesForm.controls).forEach(key => {
            const control = this.preferencesForm.get(key);
            if (control) {
              control.markAsTouched();
              control.markAsDirty();
              control.updateValueAndValidity();
            }
          });
          this.preferencesForm.updateValueAndValidity();
        }

        if (formData.security) {
          this.securityForm.patchValue(formData.security);
          Object.keys(this.securityForm.controls).forEach(key => {
            const control = this.securityForm.get(key);
            if (control) {
              control.markAsTouched();
              control.markAsDirty();
              control.updateValueAndValidity();
            }
          });
          this.securityForm.updateValueAndValidity();
        }

        if (formData.agreements) {
          this.reviewForm.patchValue(formData.agreements);
          Object.keys(this.reviewForm.controls).forEach(key => {
            const control = this.reviewForm.get(key);
            if (control) {
              control.markAsTouched();
              control.markAsDirty();
              control.updateValueAndValidity();
            }
          });
          this.reviewForm.updateValueAndValidity();
        }

        if (formData.currentStep !== undefined) {
          this.currentStep = formData.currentStep;
        }

        // Force all forms to recalculate validity after a delay
        setTimeout(() => {
          this.personalInfoForm.updateValueAndValidity();
          this.preferencesForm.updateValueAndValidity();
          this.securityForm.updateValueAndValidity();
          this.reviewForm.updateValueAndValidity();

          // Mark data as loaded
          this.isDataLoaded = true;

          // Force change detection
          this.cdr.detectChanges();

          // Also update stepper after form validation
          if (this.stepper) {
            this.forceStepperUpdate();
          }

          console.log('Form data loaded from localStorage:', formData);
          console.log('Form validation states after update:', {
            personalInfo: this.personalInfoForm.valid,
            preferences: this.preferencesForm.valid,
            security: this.securityForm.valid,
            review: this.reviewForm.valid
          });
        }, 100);

      } catch (error) {
        console.error('Error loading saved data:', error);
        this.isDataLoaded = true;
      }
    } else {
      this.isDataLoaded = true;
    }
  }

  saveFormData() {
    try {
      const formData = {
        personalInfo: this.personalInfoForm.value,
        preferences: this.preferencesForm.value,
        security: {
          ...this.securityForm.value,
          password: this.securityForm.value.password || '',
          confirmPassword: this.securityForm.value.confirmPassword || ''
        },
        agreements: this.reviewForm.value,
        currentStep: this.currentStep,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      const dataString = JSON.stringify(formData);
      localStorage.setItem('form-data', dataString);

      console.log('Form data saved to localStorage:', {
        size: `${dataString.length} characters`,
        timestamp: formData.timestamp,
        currentStep: formData.currentStep,
        hasPersonalInfo: !!formData.personalInfo.firstName,
        hasPreferences: !!formData.preferences.accountType,
        hasSecurity: !!formData.security.password,
        hasAgreements: Object.keys(formData.agreements).length > 0
      });
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  }

  setupAutoSave() {
    // Auto-save when forms change with debounce to avoid excessive saves
    this.personalInfoForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.saveFormData();
        console.log('Personal info auto-saved');
      });

    this.preferencesForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.saveFormData();
        console.log('Preferences auto-saved');
      });

    this.securityForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.saveFormData();
        console.log('Security form auto-saved');
      });

    this.reviewForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.saveFormData();
        console.log('Review form auto-saved');
      });
  }

  checkSubmissionData() {
    const submissionData = localStorage.getItem('submission-data');
    if (submissionData) {
      try {
        this.submissionData = JSON.parse(submissionData);
        this.showSubmissionResult = true;
      } catch (error) {
        console.error('Error loading submission data:', error);
      }
    }
  }

  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasNumber = /[0-9]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasMinLength = value.length >= 8;

    const passwordValid = hasNumber && hasUpper && hasLower && hasMinLength;

    if (!passwordValid) {
      return { passwordStrength: true };
    }
    return null;
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  isFormValid(): boolean {
    return this.personalInfoForm.valid &&
           this.preferencesForm.valid &&
           this.securityForm.valid &&
           this.reviewForm.valid;
  }

  onSubmit() {
    if (this.isFormValid()) {
      const formData = {
        personalInfo: this.personalInfoForm.value,
        preferences: this.preferencesForm.value,
        security: {
          ...this.securityForm.value,
          password: '***',
          confirmPassword: '***'
        },
        agreements: this.reviewForm.value,
        submissionTime: new Date().toISOString()
      };

      // Save submission data to localStorage
      localStorage.setItem('submission-data', JSON.stringify(formData));
      localStorage.removeItem('form-data'); // Clear draft data

      // Show submission result
      this.submissionData = formData;
      this.showSubmissionResult = true;

      this.snackBar.open('Registration completed successfully! 🎉', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });

      console.log('Form submitted:', formData);
    } else {
      this.snackBar.open('Please complete all required fields in all steps', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  resetForm() {
    this.personalInfoForm.reset();
    this.preferencesForm.reset();
    this.securityForm.reset();
    this.reviewForm.reset();
    this.preferencesForm.patchValue({ accountType: 'personal', language: 'en' });
    this.showSubmissionResult = false;
    this.submissionData = null;
    this.currentStep = 0;
    localStorage.removeItem('form-data');
    localStorage.removeItem('submission-data');

    // Reset stepper to step 0
    if (this.stepper) {
      this.stepper.selectedIndex = 0;
    }

    console.log('Form completely reset');
  }

  ngOnDestroy() {
    if (this.resetSubscription) {
      this.resetSubscription.unsubscribe();
    }
  }

  getErrorMessage(field: string, form: FormGroup) {
    const control = form.get(field);
    if (control?.hasError('required')) {
      return `${field} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email';
    }
    if (control?.hasError('minlength')) {
      return `${field} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    if (control?.hasError('pattern')) {
      return 'Please enter a valid phone number';
    }
    return '';
  }

  getIndustryLabel(value: string): string {
    const industry = this.industries.find(i => i.value === value);
    return industry ? industry.label : '';
  }

  getNotificationStatus(enabled: boolean): string {
    return enabled ? 'Enabled' : 'Disabled';
  }

  getLanguageLabel(value: string): string {
    const languages: {[key: string]: string} = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'zh': 'Chinese'
    };
    return languages[value] || value;
  }

  getNotificationSummary(): string {
    const notifications = [];
    if (this.preferencesForm.value.emailNotifications) notifications.push('Email');
    if (this.preferencesForm.value.smsNotifications) notifications.push('SMS');
    if (this.preferencesForm.value.marketingEmails) notifications.push('Marketing');

    return notifications.length > 0 ? notifications.join(', ') : 'None';
  }

  setStepperToCurrentStep() {
    if (this.stepper) {
      try {
        // Force stepper to sync with currentStep
        this.stepper.selectedIndex = this.currentStep;

        // Also trigger change detection
        setTimeout(() => {
          if (this.stepper.selectedIndex !== this.currentStep) {
            this.stepper.selectedIndex = this.currentStep;
          }
        }, 50);

        console.log('Stepper set to step:', this.currentStep);
      } catch (error) {
        console.error('Error setting stepper position:', error);
      }
    }
  }

  forceStepperUpdate() {
    if (this.stepper) {
      try {
        // Force the stepper to re-evaluate all step states
        this.stepper._stateChanged();
        this.cdr.detectChanges();
        console.log('Stepper state forced to update');
      } catch (error) {
        console.log('Alternative stepper update method...');
        // Alternative method - trigger change detection
        this.stepper.selectedIndex = this.stepper.selectedIndex;
        this.cdr.detectChanges();
      }
    }
  }

  onStepChange(event: any) {
    this.currentStep = event.selectedIndex;
    this.saveFormData();
    console.log('Step changed to:', this.currentStep);
  }
}
