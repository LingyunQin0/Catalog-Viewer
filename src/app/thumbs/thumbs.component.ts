import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DisplayedImage {
  image: string;
  origIndex: number;
}

@Component({
  selector: 'app-thumbs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="thumbs-container">
      <!-- 左箭头按钮 -->
      <button class="nav-button" (click)="handlePrevious()" data-test-id="prev-slide-btn">
        &#9664;
      </button>

      <!-- 缩略图显示区域 -->
      <div class="thumbs-wrapper">
        <div class="thumbs-list"
             [style.transform]="getTransform()"
             [style.transition]="transitionStyle"
             (transitionend)="onTransitionEnd()">
          <button *ngFor="let thumb of displayedImages"
                  class="thumb-button"
                  [class.active]="thumb.origIndex === currentIndex"
                  (click)="onThumbnailClick(thumb.origIndex)"
                  [attr.data-test-id]="'thumb-button-' + thumb.origIndex">
            <img [src]="thumb.image" alt="Thumbnail {{ thumb.origIndex + 1 }}">
          </button>
        </div>
      </div>

      <!-- 右箭头按钮 -->
      <button class="nav-button" (click)="handleNext()" data-test-id="next-slide-btn">
        &#9654;
      </button>
    </div>
  `,
  styles: [`
    .thumbs-container {
      display: flex;
      align-items: center;
    }
    .nav-button {
      background: transparent;
      border: none;
      color: blue;
      font-size: 24px;
      cursor: pointer;
      padding: 8px;
    }
    .thumbs-wrapper {
      overflow: hidden;
      width: 272px; /* 4 缩略图，每个占 68px */
    }
    .thumbs-list {
      display: flex;
    }
    .thumb-button {
      border: 2px solid transparent;
      border-radius: 8px;
      padding: 2px;
      cursor: pointer;
      background: transparent;
      transition: border 0.3s;
      width: 60px;
      height: 60px;
      margin-right: 8px;
      flex-shrink: 0;
    }
    .thumb-button:last-child {
      margin-right: 0;
    }
    .thumb-button.active {
      border-color: blue;
      backdrop-filter: blur(2px);
    }
    .thumb-button img {
      width: 100%;
      height: 100%;
      border-radius: 8px;
      object-fit: cover;
    }
  `]
})
export class ThumbsComponent implements OnChanges {
  @Input() images: string[] = [];
  @Input() currentIndex: number = 0; // 当前选中的原始图片索引（0～images.length-1）
  @Output() thumbnailClick = new EventEmitter<number>();

  /** 同时显示的缩略图数量（最多 4 张） */
  visibleCount: number = 4;
  /** 每项的占用宽度（60px 图片宽 + 8px 间隙） */
  itemFullWidth: number = 68;

  /**
   * 定义当前可见区域的起始图片在原始数组中的索引  
   * 初始时 windowStart = 0，对应显示原始图片 0～3
   */
  windowStart: number = 0;
  /**
   * 用于控制滑动动画的索引，计算公式为：slideIndex = visibleCount + windowStart  
   * 这样初始时 slideIndex = 4，显示 displayedImages[4]～[7]，正好对应原始数组的 0～3（在构造无限轮播数组时）
   */
  slideIndex: number = this.visibleCount;
  /** CSS transition 属性，用于平滑滑动 */
  transitionStyle: string = 'transform 0.3s ease';

  /** 构造用于无限轮播的图片数组（在原始数组前后各克隆 visibleCount 张） */
  displayedImages: DisplayedImage[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images']) {
      this.setupDisplayedImages();
    }
    // 如果外部更新了 currentIndex，且新选中项不在当前窗口内，则调整窗口
    if (changes['currentIndex'] && this.images.length > this.visibleCount) {
      if (!this.isInWindow(this.currentIndex)) {
        // 简单起见：将窗口起始位置直接调整为当前选中项
        this.windowStart = this.currentIndex;
        this.slideIndex = this.visibleCount + this.windowStart;
      }
    }
  }

  /** 根据 images 构造无限轮播所需的 displayedImages 数组 */
  private setupDisplayedImages(): void {
    const n = this.images.length;
    if (n > this.visibleCount) {
      const prefix = this.images.slice(-this.visibleCount).map((img, idx) => ({
        image: img,
        origIndex: (n - this.visibleCount + idx) % n
      }));
      const main = this.images.map((img, idx) => ({ image: img, origIndex: idx }));
      const suffix = this.images.slice(0, this.visibleCount).map((img, idx) => ({
        image: img,
        origIndex: idx
      }));
      this.displayedImages = [...prefix, ...main, ...suffix];
      // 初始化：窗口起始位置为 0，slideIndex = visibleCount + 0
      this.windowStart = 0;
      this.slideIndex = this.visibleCount;
      this.transitionStyle = 'transform 0.3s ease';
    } else {
      // 图片数不足时，无需滑动，也无需克隆
      this.displayedImages = this.images.map((img, idx) => ({ image: img, origIndex: idx }));
      this.windowStart = 0;
      this.slideIndex = 0;
      this.transitionStyle = 'none';
    }
  }

  /** 判断给定的原始索引是否在当前窗口内（循环判断） */
  private isInWindow(index: number): boolean {
    const n = this.images.length;
    if (n <= this.visibleCount) return true;
    for (let i = 0; i < this.visibleCount; i++) {
      if ((this.windowStart + i) % n === index) {
        return true;
      }
    }
    return false;
  }

  /** 根据当前 slideIndex 计算 CSS transform 属性值 */
  getTransform(): string {
    return `translateX(-${this.slideIndex * this.itemFullWidth}px)`;
  }

  /**
   * 右箭头点击处理  
   * 1. 如果当前选中项不在窗口最右侧（窗口末尾），则仅更新选中项。  
   * 2. 如果当前选中项正好在窗口最右侧：
   *    - 若该图片不是整个列表的最后一张，则窗口右移一格（windowStart+1），选中下一张。
   *    - 若当前已选中最后一张，则将窗口切换至起始（windowStart=0），选中第一张。
   */
  handleNext(): void {
    const n = this.images.length;
    if (n <= this.visibleCount) {
      // 图片总数不足时，直接循环更新选中项
      this.currentIndex = (this.currentIndex + 1) % n;
      this.thumbnailClick.emit(this.currentIndex);
      return;
    }
    const offset = this.getOffset(this.windowStart, this.currentIndex, n);
    if (offset < this.visibleCount - 1) {
      // 当前选中项不在窗口最右侧：仅更新选中项
      this.currentIndex = (this.currentIndex + 1) % n;
    } else {
      // 选中项处于窗口最右侧
      if (this.currentIndex < n - 1) {
        // 未到最后一张：窗口右移一格，同时更新选中项
        this.windowStart = (this.windowStart + 1) % n;
        this.slideIndex = this.visibleCount + this.windowStart;
        this.currentIndex = (this.currentIndex + 1) % n;
      } else {
        // 当前已选中最后一张：切换至起始窗口，并选中第一张
        this.windowStart = 0;
        this.slideIndex = this.visibleCount + this.windowStart;
        this.currentIndex = 0;
      }
    }
    this.thumbnailClick.emit(this.currentIndex);
  }

  /**
   * 左箭头点击处理  
   * 1. 如果当前选中项不在窗口最左侧，则仅更新选中项。  
   * 2. 如果当前选中项正好在窗口最左侧：
   *    - 若该图片不是整个列表的第一张，则窗口左移一格（windowStart-1），选中前一张。
   *    - 若当前已选中第一张，则将窗口切换至末尾（windowStart = 总数 - visibleCount），选中最后一张。
   */
  handlePrevious(): void {
    const n = this.images.length;
    if (n <= this.visibleCount) {
      this.currentIndex = (this.currentIndex - 1 + n) % n;
      this.thumbnailClick.emit(this.currentIndex);
      return;
    }
    const offset = this.getOffset(this.windowStart, this.currentIndex, n);
    if (offset > 0) {
      // 当前选中项不在窗口最左侧：仅更新选中项
      this.currentIndex = (this.currentIndex - 1 + n) % n;
    } else {
      // 选中项处于窗口最左侧
      if (this.currentIndex > 0) {
        // 非第一张：窗口左移一格，同时更新选中项
        this.windowStart = (this.windowStart - 1 + n) % n;
        this.slideIndex = this.visibleCount + this.windowStart;
        this.currentIndex = (this.currentIndex - 1 + n) % n;
      } else {
        // 当前已选中第一张：切换至末尾窗口，并选中最后一张
        this.windowStart = (n - this.visibleCount) % n; // 注意：当 n>=visibleCount 时，n - visibleCount 即为末尾起始位置
        this.slideIndex = this.visibleCount + this.windowStart;
        this.currentIndex = n - 1;
      }
    }
    this.thumbnailClick.emit(this.currentIndex);
  }

  /** 辅助函数：计算从 start 到 index 的循环偏移量 */
  private getOffset(start: number, index: number, n: number): number {
    if (index >= start) {
      return index - start;
    } else {
      return index + n - start;
    }
  }

  /** 点击缩略图时：若点击项不在当前窗口，则调整窗口；同时更新选中项 */
  onThumbnailClick(origIndex: number): void {
    if (!this.isInWindow(origIndex)) {
      // 简单起见，调整窗口起始为点击项
      this.windowStart = origIndex;
      this.slideIndex = this.visibleCount + this.windowStart;
    }
    this.currentIndex = origIndex;
    this.thumbnailClick.emit(origIndex);
  }

  /**
   * 当 CSS transition 完成后，检测是否处于克隆区域  
   * 如果是，则临时关闭动画（transition: none），并重置 slideIndex 到主区域对应位置，再恢复动画效果。
   */
  onTransitionEnd(): void {
    const n = this.images.length;
    if (n <= this.visibleCount) return;
    if (this.slideIndex >= n + this.visibleCount) {
      this.transitionStyle = 'none';
      this.slideIndex = this.visibleCount + this.windowStart;
      void (document.querySelector('.thumbs-list') as HTMLElement).offsetWidth;
      this.transitionStyle = 'transform 0.3s ease';
    }
    if (this.slideIndex < this.visibleCount) {
      this.transitionStyle = 'none';
      this.slideIndex = this.visibleCount + this.windowStart;
      void (document.querySelector('.thumbs-list') as HTMLElement).offsetWidth;
      this.transitionStyle = 'transform 0.3s ease';
    }
  }
}
