import { NgModule } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardActions } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

const MaterialModules = [
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
  MatCardSubtitle,
  MatCardActions,
  MatIcon,
  MatIconButton,
  MatButton,
  MatFormField,
  MatLabel,
  MatError,
  MatSelect,
  MatOption,
  MatInput,
  MatProgressSpinner,
  MatSnackBarModule,
  MatDialogModule,
  MatStepperModule,
  MatTabsModule,
  MatTooltipModule,
];

@NgModule({
  imports: MaterialModules,
  exports: MaterialModules,
})
export class MatModule {}
