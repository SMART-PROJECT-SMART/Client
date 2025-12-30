import { NgModule } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatInput } from '@angular/material/input';

const MaterialModules = [MatCard, MatCardContent, MatIcon, MatIconButton, MatFormField, MatLabel, MatSelect, MatOption, MatInput];

@NgModule({
  imports: MaterialModules,
  exports: MaterialModules,
})
export class MatModule {}
