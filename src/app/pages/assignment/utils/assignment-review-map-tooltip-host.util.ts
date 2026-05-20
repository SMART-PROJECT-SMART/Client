import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Type,
  createComponent,
} from '@angular/core';

export function createTooltipHostElement<T>(
  appRef: ApplicationRef,
  environmentInjector: EnvironmentInjector,
  componentType: Type<T>,
  setInputs: (componentRef: ComponentRef<T>) => void,
  tooltipComponentRefs: ComponentRef<unknown>[],
): HTMLElement {
  const tooltipComponentRef = createComponent(componentType, {
    environmentInjector,
  });
  setInputs(tooltipComponentRef);
  appRef.attachView(tooltipComponentRef.hostView);
  tooltipComponentRefs.push(tooltipComponentRef);
  return tooltipComponentRef.location.nativeElement as HTMLElement;
}

export function destroyTooltipHostElements(
  appRef: ApplicationRef,
  tooltipComponentRefs: ComponentRef<unknown>[],
): void {
  for (const tooltipComponentRef of tooltipComponentRefs) {
    appRef.detachView(tooltipComponentRef.hostView);
    tooltipComponentRef.destroy();
  }
  tooltipComponentRefs.length = 0;
}

