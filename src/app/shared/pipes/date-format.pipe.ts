import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  private datePipe: DatePipe;

  constructor() {
    this.datePipe = new DatePipe('fr-FR');
  }

  transform(value: string | Date | null, format: string = 'dd/MM/yyyy HH:mm'): string | null {
    if (!value) return null;
    
    // Si la valeur est une chaîne, la convertir en Date
    const dateValue = typeof value === 'string' ? new Date(value) : value;
    
    // Vérifier si la date est valide
    if (isNaN(dateValue.getTime())) return value.toString();
    
    return this.datePipe.transform(dateValue, format);
  }
}