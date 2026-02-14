import { NgModule } from '@angular/core';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
  MatCardSubtitle,
  MatCardActions,
} from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatError, MatSuffix } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTab, MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  OwlDateTimeModule,
  OwlNativeDateTimeModule,
  OWL_DATE_TIME_FORMATS,
} from '@danielmoncada/angular-datetime-picker';
import { OWL_TIME_FORMATS } from '../common/constants/owl-datetime.constants';

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
  MatSuffix,
  MatSelect,
  MatOption,
  MatInput,
  MatProgressSpinner,
  MatSnackBarModule,
  MatDialogModule,
  MatStepperModule,
  MatTabsModule,
  MatTooltipModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatTabGroup,
  MatTab,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatChipsModule,
  MatAutocompleteModule,
  MatToolbarModule,
  MatSidenavModule,
  OverlayModule,
  OwlDateTimeModule,
  OwlNativeDateTimeModule,
];

@NgModule({
  imports: MaterialModules,
  exports: MaterialModules,
  providers: [{ provide: OWL_DATE_TIME_FORMATS, useValue: OWL_TIME_FORMATS }],
})
export class MatModule {}
