import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  SimpleChanges
} from '@angular/core';
import { AudioLevelBarsComponent } from '../audio-level-bars-components/audio-level-bars.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-custom-modal',
  templateUrl: './custom-modal.component.html',
  styleUrls: ['./custom-modal.component.css'],
  imports: [AudioLevelBarsComponent, CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() videoStream?: MediaStream;
  @Input() audioLevel: number = 0;
  @Input() hasVideoFeed: boolean = false;
  @Output() onClose = new EventEmitter<void>();

  @ViewChild('modal', { static: false }) modal!: ElementRef;
  @ViewChild('videoElement', { static: true })
  videoElement!: ElementRef<HTMLVideoElement>;

  private isDragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private initialLeft: number = 0;
  private initialTop: number = 0;

  // Track last known position
  private lastLeft: number | null = null;
  private lastTop: number | null = null;

  constructor(private el: ElementRef, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.updateVideoStream();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      // Delay to ensure modal is rendered
      setTimeout(() => {
        this.setInitialPosition();
      }, 0);
    }
    this.updateVideoStream();
  }

  ngAfterViewInit(): void {
    if (this.isOpen) {
      // Delay to ensure modal is rendered
      setTimeout(() => {
        this.setInitialPosition();
      }, 0);
    }
  }

  ngOnDestroy(): void {
    this.removeEventListeners();
  }

  // Close modal
  closeModal(): void {
    this.onClose.emit();
    this.resetPosition();
  }

  private resetPosition(): void {
    this.lastLeft = null;
    this.lastTop = null;
  }

  private updateVideoStream(): void {
    if (this.videoElement && this.videoStream) {
      const videoEl = this.videoElement.nativeElement;

      if (videoEl.srcObject !== this.videoStream) {
        videoEl.srcObject = this.videoStream;
      }
    }
  }

  private setInitialPosition(): void {
    const modalElement = this.modal.nativeElement as HTMLElement;
    const { innerWidth, innerHeight } = window;

    // Get modal size
    const modalWidth = modalElement.offsetWidth;
    const modalHeight = modalElement.offsetHeight;

    // Calculate left and top for centering
    const left =
      this.lastLeft !== null ? this.lastLeft : (innerWidth - modalWidth) / 2;
    const top =
      this.lastTop !== null ? this.lastTop : (innerHeight - modalHeight) / 2;

    // Apply calculated positions
    modalElement.style.left = `${Math.max(left, 0)}px`;
    modalElement.style.top = `${Math.max(top, 0)}px`;
    modalElement.style.position = 'fixed';

    // Trigger change detection
    this.cdr.markForCheck();
  }

  onPointerDown(event: PointerEvent): void {
    const modalElement = this.modal.nativeElement as HTMLElement;
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;

    const rect = modalElement.getBoundingClientRect();
    this.initialLeft = rect.left;
    this.initialTop = rect.top;

    modalElement.setPointerCapture(event.pointerId);

    modalElement.addEventListener('pointermove', this.onPointerMove);
    modalElement.addEventListener('pointerup', this.onPointerUp);
    modalElement.addEventListener('pointercancel', this.onPointerUp);
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;

    const modalElement = this.modal.nativeElement as HTMLElement;
    modalElement.style.left = `${this.initialLeft + deltaX}px`;
    modalElement.style.top = `${this.initialTop + deltaY}px`;
  };

  private onPointerUp = (event: PointerEvent): void => {
    this.isDragging = false;

    const modalElement = this.modal.nativeElement as HTMLElement;
    modalElement.releasePointerCapture(event.pointerId);

    modalElement.removeEventListener('pointermove', this.onPointerMove);
    modalElement.removeEventListener('pointerup', this.onPointerUp);
    modalElement.removeEventListener('pointercancel', this.onPointerUp);
  };

  private removeEventListeners(): void {
    if (this.modal) {
      const modalElement = this.modal.nativeElement as HTMLElement;
      modalElement.removeEventListener('pointermove', this.onPointerMove);
      modalElement.removeEventListener('pointerup', this.onPointerUp);
      modalElement.removeEventListener('pointercancel', this.onPointerUp);
    }
  }
}
