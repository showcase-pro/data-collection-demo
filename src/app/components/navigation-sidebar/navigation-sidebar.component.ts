import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-navigation-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './navigation-sidebar.component.html',
  styleUrl: './navigation-sidebar.component.scss'
})
export class NavigationSidebarComponent implements OnInit {
  @Input() currentStep: number = 1;
  @Input() completedSteps: number[] = [];
  @Output() stepChange = new EventEmitter<number>();

  isMobile = false;

  constructor(
    private snackBar: MatSnackBar,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }

  navigateToStep(step: number) {
    this.stepChange.emit(step);
  }

  saveDraft() {
    this.snackBar.open('Draft saved successfully!', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  loadDraft() {
    this.snackBar.open('Load draft functionality coming soon!', 'Close', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }
}
