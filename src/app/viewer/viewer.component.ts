import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-viewer',
  standalone: true,
  template: `
    <div class="viewer-container">
      <img [src]="image" alt="Full Size Image">
    </div>
  `,
  styles: [`
    .viewer-container {
      width: 400px; /* 可根据需求调整大小 */
      height: 400px;
      border: 2px solid gray;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f9f9f9;
      overflow: hidden;
    }
    .viewer-container img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  `]
})
export class ViewerComponent {
  @Input() image!: string;
}
