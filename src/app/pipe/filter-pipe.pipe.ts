import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterPipe'
})
export class FilterPipePipe implements PipeTransform {

    transform(items: any[], search: string, field: string): any[] {
    if (!items || !search) return items;
    return items.filter(item =>
      item[field].toLowerCase().includes(search.toLowerCase())
    );
  }

}
