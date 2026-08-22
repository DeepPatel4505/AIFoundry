import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class PaginationComponent implements OnChanges {
  @Input() currentPage = 1;
  @Input() pageSize = 9;
  @Input() totalItems = 0;
  @Input() pageSizeOptions = [6, 9, 12, 18];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  totalPages = 0;
  pages: (number | string)[] = [];
  dropdownOpen = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalItems'] || changes['pageSize'] || changes['currentPage']) {
      this.calculatePages();
    }
  }

  calculatePages(): void {
    this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
    
    // Ensure currentPage is within bounds
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    this.pages = this.generatePageList();
  }

  generatePageList(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    // Always show first and last pages
    // Show 3 pages around current page
    const list: (number | string)[] = [];

    if (current <= 4) {
      list.push(1, 2, 3, 4, 5, '...', total);
    } else if (current >= total - 3) {
      list.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
    } else {
      list.push(1, '...', current - 1, current, current + 1, '...', total);
    }

    return list;
  }

  selectPage(page: number | string): void {
    if (typeof page === 'string' || page === this.currentPage) {
      return;
    }
    this.pageChange.emit(page);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  firstPage(): void {
    if (this.currentPage !== 1) {
      this.pageChange.emit(1);
    }
  }

  lastPage(): void {
    if (this.currentPage !== this.totalPages) {
      this.pageChange.emit(this.totalPages);
    }
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectPageSize(size: number): void {
    this.dropdownOpen = false;
    if (size !== this.pageSize) {
      this.pageSizeChange.emit(size);
    }
  }

  get startRange(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRange(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.totalItems ? this.totalItems : end;
  }
}
