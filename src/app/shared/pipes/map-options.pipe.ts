import { Pipe, PipeTransform } from '@angular/core';
import { SelectOption } from '../select-categoria-marca/select-categoria-marca';

@Pipe({
  name: 'mapOptions',
  standalone: true
})
export class MapOptionsPipe implements PipeTransform {
  transform(items: Array<{ nombre: string }> | null, idField: string): SelectOption[] {
    if (!items || !Array.isArray(items)) return [];
    return items.map(item => {
      const record = item as Record<string, unknown>;
      const id = Number(record[idField] ?? record['id'] ?? 0);
      return { id, nombre: item.nombre };
    });
  }
}
