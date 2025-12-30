import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

export const LOGO_PATH = '/img/logoPneuMali.png';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [NgClass],
  template: `
    <img
      [src]="src"
      [alt]="alt"
      decoding="async"
      fetchpriority="high"
      [attr.width]="size"
      [attr.height]="size"
      [style.width.px]="size"
      [style.height.px]="size"
      [ngClass]="roundedClass"
    />
  `,
})
export class LogoComponent {
  @Input() size = 40;
  @Input() src = LOGO_PATH;
  @Input() alt = 'PneuMali';
  @Input() roundedClass = 'rounded-xl';
}


