import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ViewerComponent } from './viewer/viewer.component';
import { ThumbsComponent } from './thumbs/thumbs.component';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ViewerComponent, ThumbsComponent],
  template: `
    <div class="catalog-container">
      <!-- 大图展示区域 -->
      <app-viewer 
        [image]="images[currentIndex]" 
        data-test-id="catalog-view">
      </app-viewer>

      <!-- 缩略图组件 -->
      <app-thumbs 
        [images]="images"
        [currentIndex]="currentIndex"
        (thumbnailClick)="onThumbnailClick($event)"
        (previous)="onPrevious()"
        (next)="onNext()">
      </app-thumbs>

      <!-- 灰色 2px 分割线 -->
      <div class="divider"></div>

      <!-- 轮播开关 -->
      <div class="slideshow-toggle">
        <label>
          <input type="checkbox" 
                 [checked]="autoSlideShow" 
                 (change)="toggleSlideShow($event)" 
                 data-test-id="toggle-slide-show-button">
          Start Slide Show
        </label>
      </div>
    </div>
  `,
  styles: [`
    .catalog-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 16px;
    }
    .divider {
      width: 100%;
      height: 2px;
      background-color: #ccc;
    }
    .slideshow-toggle {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `]
})
export class AppComponent implements OnDestroy {
  // 通过 ViewChild 获取 ThumbsComponent 实例
  @ViewChild(ThumbsComponent) thumbsComponent!: ThumbsComponent;
  
  // 使用 Unsplash 上的真实图片链接
  images: string[] = [
    'https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&w=1350&q=80',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1350&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1350&q=80',
    'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=1350&q=80',
    'https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=1350&q=80',
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1350&q=80',
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1350&q=80',
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1350&q=80',
  ];

  currentIndex: number = 0;
  autoSlideShow: boolean = false;
  slideShowSubscription?: Subscription;

  onThumbnailClick(index: number): void {
    this.currentIndex = index;
  }

  onPrevious(): void {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  onNext(): void {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  toggleSlideShow(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.autoSlideShow = checked;
    if (this.autoSlideShow) {
      this.startSlideShow();
    } else {
      this.stopSlideShow();
    }
  }

  startSlideShow(): void {
    this.stopSlideShow(); // 避免重复订阅
    this.slideShowSubscription = interval(3000).subscribe(() => {
      // 自动播放时调用 ThumbsComponent 的 handleNext() 方法，
      // 模拟用户点击右箭头，从而保证自动播放和手动点击的滑动逻辑一致
      if (this.thumbsComponent) {
        this.thumbsComponent.handleNext();
      } else {
        this.onNext();
      }
    });
  }

  stopSlideShow(): void {
    if (this.slideShowSubscription) {
      this.slideShowSubscription.unsubscribe();
      this.slideShowSubscription = undefined;
    }
  }

  ngOnDestroy(): void {
    this.stopSlideShow();
  }
}
