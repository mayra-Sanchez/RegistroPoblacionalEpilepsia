import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  transform(
    value: string,
    limit: number = 50,
    completeWords: boolean = false,
    ellipsis: string = '...'
  ): string {
    if (!value || value.length <= limit) {
      return value;
    }

    if (completeWords) {
      const lastSpace = value.substring(0, limit).lastIndexOf(' ');
      if (lastSpace > 0) {
        return value.substring(0, lastSpace) + ellipsis;
      }
      // 🔹 Si no hay espacios, truncar normalmente
      return value.substring(0, limit) + ellipsis;
    }

    return value.substring(0, limit) + ellipsis;
  }
}
