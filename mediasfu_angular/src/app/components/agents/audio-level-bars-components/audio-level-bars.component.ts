import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-audio-level-bars',
  templateUrl: './audio-level-bars.component.html',
  styleUrls: ['./audio-level-bars.component.css'],

  // OPTION B: Keep OnPush but call markForCheck() manually
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [CommonModule, FormsModule]
})
export class AudioLevelBarsComponent implements OnInit, OnDestroy {
  @Input() audioLevel = 0; // range: 0..255

  // internal tracking for smooth animation
  level = 0;
  private intervalId?: number;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Animate the audio level in increments/decrements of 5
    this.intervalId = window.setInterval(() => {
      if (this.level === this.audioLevel) {
        return;
      }
      if (this.level < this.audioLevel) {
        this.level = Math.min(this.level + 5, this.audioLevel);
      } else {
        this.level = Math.max(this.level - 5, this.audioLevel);
      }

      // If using OnPush, force a check so the template updates
      this.cdr.markForCheck();
    }, 50);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Returns a boolean array of length 10. Each index is `true` if that bar
   * should be "filled" based on normalized `level`.
   */
  get bars(): boolean[] {
    // Normalize the audio level to a range of 0..10
    const normalizedLevel = Math.max(0, ((this.level - 127.5) / (275 - 127.5)) * 10);

    return Array.from({ length: 10 }, (_, i) => i < normalizedLevel);
  }
}
