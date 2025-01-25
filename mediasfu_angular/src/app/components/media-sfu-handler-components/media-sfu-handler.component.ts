import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  MediasfuGeneric,
  PreJoinPage, Credentials, CreateMediaSFURoomOptions, JoinMediaSFURoomOptions } from 'mediasfu-angular';
import { CommonModule } from '@angular/common';

export interface MediaSFUHandlerOptions {
  action: 'create' | 'join';
  duration?: number | null;
  capacity?: number | null;
  name: string;
  meetingID?: string | null;
  sourceParameters: Record<string, any>;
  updateSourceParameters: (params: Record<string, any>) => void;
}


@Component({
  selector: 'app-media-sfu-handler',
  templateUrl: './media-sfu-handler.component.html',
  imports: [CommonModule, MediasfuGeneric],
})

export class MediaSfuHandlerComponent implements OnInit {
  constructor() { }
  @Input() options!: MediaSFUHandlerOptions; // add this line
  noUIOptions = new BehaviorSubject<Partial<MediaSFUHandlerOptions>>({});
  finalOptions = new BehaviorSubject<CreateMediaSFURoomOptions | JoinMediaSFURoomOptions | null>(null);
  credentials: Credentials  = {
    apiUserName: 'yourDevUser',
    apiKey:
        'yourDevApiKey1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'};

  PreJoinPage = PreJoinPage;

  ngOnInit(): void {
    try {
      if (this.options.action === 'create') {
        this.finalOptions.next({
          action: 'create',
          duration: this.options.duration || 15,
          capacity: this.options.capacity || 5,
          userName: this.options.name,
          eventType: 'webinar',
          recordOnly: false,
          dataBuffer: true,
          bufferType: 'all',
        });
        this.noUIOptions.next(this.options);
      } else if (this.options.action === 'join') {
        if (!this.options.meetingID) {
          throw new Error('Meeting ID is required for joining a room.');
        }
        this.finalOptions.next({
          action: 'join',
          userName: this.options.name,
          meetingID: this.options.meetingID,
        });
        this.noUIOptions.next(this.options);
      } else {
        throw new Error('Invalid action. Must be either "create" or "join".');
      }
    } catch (error) {
      console.error('Error configuring MediaSFU options:', error);
    }
  }
}
