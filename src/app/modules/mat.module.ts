import { NgModule } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

const MaterialModules = [
  MatCard,
  MatCardContent,
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
];

@NgModule({
  imports: MaterialModules,
  exports: MaterialModules,
})
export class MatModule {}
