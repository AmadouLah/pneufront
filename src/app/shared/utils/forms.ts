import { FormGroup } from '@angular/forms';

export function markAllTouched(form: FormGroup): void {
  Object.keys(form.controls).forEach(key => form.get(key)?.markAsTouched());
}
