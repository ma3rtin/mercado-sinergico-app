import { Pipe, PipeTransform } from '@angular/core';
import { SelectOption } from '../select-categoria-marca/select-categoria-marca';

@Pipe({
  name: 'mapOptions',
  standalone: true
})
export class MapOptionsPipe implements PipeTransform {
  /**
   * Transforma un array de objetos (Marcas o Categorías) al formato SelectOption
   */
  transform(items: any[] | null, idField: string): SelectOption[] {
    if (!items || !Array.isArray(items)) return [];
    return items.map(item => ({
      id: item[idField] ?? item['id'] ?? 0,
      nombre: item['nombre'] ?? '',
    }));
  }
}