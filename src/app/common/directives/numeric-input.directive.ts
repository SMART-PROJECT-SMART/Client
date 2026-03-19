import { Directive, input } from '@angular/core';

@Directive({
  selector: 'input[appNumericInput]',
  host: {
    '(keydown)': 'onKeyDown($event)',
    '(paste)': 'onPaste($event)',
  },
})
export class NumericInputDirective {
  readonly allowDecimal = input(true);
  readonly allowNegative = input(true);

  private readonly navigationKeys = new Set([
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ]);

  onKeyDown(event: KeyboardEvent): void {
    if (this.navigationKeys.has(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.key === '-' && this.allowNegative()) {
      return;
    }

    if (event.key === '.' && this.allowDecimal()) {
      return;
    }

    if (event.key < '0' || event.key > '9') {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    const pattern = this.allowDecimal() && this.allowNegative()
      ? /^-?\d*\.?\d*$/
      : this.allowDecimal()
        ? /^\d*\.?\d*$/
        : this.allowNegative()
          ? /^-?\d*$/
          : /^\d*$/;

    if (!pattern.test(pasted)) {
      event.preventDefault();
    }
  }
}
