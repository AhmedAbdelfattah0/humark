import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForumService } from '../../../services/forum.service';
import { Subscription } from 'rxjs';
import { PostFormComponent } from '../post-form/post-form.component';

@Component({
  selector: 'app-edit-post-popup',
  standalone: true,
  imports: [CommonModule, PostFormComponent],
  templateUrl: './edit-post-popup.component.html',
  styleUrls: ['./edit-post-popup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditPostPopupComponent implements OnInit, OnDestroy {
  @Input() postId: number | null = null;
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() postUpdated = new EventEmitter<any>();

  isLoading: boolean = false;
  error: string | null = null;
  existingFiles: any[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private forumService: ForumService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.visible && this.postId) {
      this.loadPostFiles();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only load post details when both conditions are met:
    // 1. The popup is visible
    // 2. We have a valid postId
    if (changes['visible'] && changes['visible'].currentValue === true &&
        this.postId !== null && this.postId !== undefined) {
      this.loadPostFiles();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadPostFiles(): void {
    if (!this.postId) return;

    this.isLoading = true;
    this.error = null;
    this.cdr.markForCheck();

    const sub = this.forumService.getPost(this.postId).subscribe({
      next: (response) => {
        if (!response || !response.post) {
          this.error = 'Failed to load post details: Invalid response format';
          this.isLoading = false;
          this.cdr.markForCheck();
          return;
        }

        const post = response.post;

        // Set existing files
        this.existingFiles = post.files || [];

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading post:', err);
        this.error = 'Failed to load post details: ' + (err.error?.message || err.message || 'Network error');
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });

    this.subscriptions.add(sub);
  }

  onFormSubmitted(formData: any): void {
    if (!this.postId) {
      this.error = 'Post ID is missing';
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.cdr.markForCheck();

    const sub = this.forumService.updatePost(this.postId, formData.formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.postUpdated.emit(response.data);
        this.closePopup();
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Error updating post';
        console.error('Error updating post:', err);
        this.cdr.markForCheck();
      }
    });

    this.subscriptions.add(sub);
  }

  onCanceled(): void {
    this.closePopup();
  }

  closePopup(): void {
    this.visible = false;
    this.visibleChange.emit(this.visible);
    this.existingFiles = [];
    this.error = null;
    this.cdr.markForCheck();
  }

  // Utility method for trackBy in ngFor
  trackByFn(index: number): number {
    return index;
  }
}
