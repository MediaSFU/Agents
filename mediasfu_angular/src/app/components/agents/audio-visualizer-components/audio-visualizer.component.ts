import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-audio-visualizer',
  templateUrl: './audio-visualizer.component.html',
  styleUrls: ['./audio-visualizer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AudioVisualizerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() animate = false;

  bars: number[] = [];
  private animationFrameId: number | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const bufferLength = 16; // number of bars
    this.bars = new Array(bufferLength).fill(0);

    if (this.animate) {
      this.startAnimation();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['animate']) {
      if (this.animate) {
        this.startAnimation();
      } else {
        this.resetBars();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private startAnimation(): void {
    const updateBars = () => {
      this.bars = this.bars.map((bar) => {
        // Variation: up or down by random, clamp [10..225]
        const newVal = bar + Math.random() * 10 - 5;
        const clamped = newVal > 225 ? 225 : newVal < 10 ? 10 : newVal;
        return this.animate ? clamped : 0;
      });

      this.cdr.markForCheck(); // Trigger change detection

      this.animationFrameId = requestAnimationFrame(updateBars);
    };

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(updateBars);
  }

  private resetBars(): void {
    this.bars = this.bars.map(() => 0);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.cdr.markForCheck(); // Trigger change detection
  }
}
