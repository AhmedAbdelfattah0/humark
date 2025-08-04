import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ForumService } from '../../services/forum.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EditPostPopupComponent } from '../edit-post-popup/edit-post-popup.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss']
})
export class PostCardComponent implements OnInit {
  @Input() post: any;
  @Input() showReplies: boolean = true;
  @Output() postDeleted = new EventEmitter<number>();
  @Output() postUpdated = new EventEmitter<any>();

  currentUser: any;
  loading: boolean = false;
  repliesVisible: boolean = false;
  repliesLoaded: boolean = false;
  replies: any[] = [];
  replyPage: number = 1;
  hasMoreReplies: boolean = false;

  constructor(
    private dialog: MatDialog,
    private forumService: ForumService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    // If post has replies_count > 0, set hasMoreReplies to true
    this.hasMoreReplies = this.post?.replies_count > 0;
  }

  toggleReplies(): void {
    this.repliesVisible = !this.repliesVisible;

    if (this.repliesVisible && !this.repliesLoaded) {
      this.loadReplies();
    }
  }

  loadReplies(): void {
    this.loading = true;
    this.forumService.getReplies(this.post.id, this.replyPage).subscribe(
      (response: any) => {
        this.replies = [...this.replies, ...response.data];
        this.repliesLoaded = true;
        this.hasMoreReplies = response.meta.current_page < response.meta.last_page;
        this.replyPage++;
        this.loading = false;
      },
      (error) => {
        console.error('Error loading replies:', error);
        this.loading = false;
        this.toastr.error('Failed to load replies');
      }
    );
  }

  openEditDialog(): void {
    const dialogRef = this.dialog.open(EditPostPopupComponent, {
      width: '600px',
      data: { post: this.post, isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.post = result;
        this.postUpdated.emit(this.post);
      }
    });
  }

  deletePost(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { title: 'Delete Post', message: 'Are you sure you want to delete this post?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.forumService.deletePost(this.post.id).subscribe(
          () => {
            this.loading = false;
            this.toastr.success('Post deleted successfully');
            this.postDeleted.emit(this.post.id);
          },
          (error) => {
            this.loading = false;
            this.toastr.error('Failed to delete post');
            console.error('Error deleting post:', error);
          }
        );
      }
    });
  }

  reportPost(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Report Post',
        message: 'Are you sure you want to report this post?',
        inputLabel: 'Reason for reporting'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Send report to backend
        this.toastr.success('Post reported successfully');
      }
    });
  }

  toggleLike(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.post.liked = !this.post.liked;

    if (this.post.liked) {
      this.post.likes_count++;
    } else {
      this.post.likes_count--;
    }

    // Call API to like/unlike post
    this.forumService.likePost(this.post.id).subscribe(
      () => {
        // Success
      },
      (error) => {
        console.error('Error toggling like:', error);
        // Revert the UI changes
        this.post.liked = !this.post.liked;
        if (this.post.liked) {
          this.post.likes_count++;
        } else {
          this.post.likes_count--;
        }
        this.toastr.error('Failed to update like status');
      }
    );
  }

  toggleBookmark(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.post.bookmarked = !this.post.bookmarked;

    // Call API to bookmark/unbookmark post
    this.forumService.bookmarkPost(this.post.id).subscribe(
      () => {
        this.toastr.success(this.post.bookmarked ? 'Post bookmarked' : 'Post removed from bookmarks');
      },
      (error) => {
        console.error('Error toggling bookmark:', error);
        // Revert the UI changes
        this.post.bookmarked = !this.post.bookmarked;
        this.toastr.error('Failed to update bookmark status');
      }
    );
  }

  sharePost(): void {
    const url = `${window.location.origin}/post/${this.post.id}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        this.toastr.success('Post link copied to clipboard');
      })
      .catch((error) => {
        console.error('Error copying to clipboard:', error);
        this.toastr.error('Failed to copy link');
      });
  }

  navigateToPost(): void {
    this.router.navigate(['/post', this.post.id]);
  }

  navigateToUserProfile(userId: number, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/profile', userId]);
  }

  getAttachmentGridClass(attachments: any[]): string {
    const count = attachments?.length || 0;
    if (count === 0) return '';
    return `grid-${Math.min(count, 4)}`;
  }

  isImage(file: any): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const extension = file.name?.split('.').pop().toLowerCase() || '';
    return imageExtensions.includes(extension);
  }

  getFileIcon(file: any): string {
    const extension = file.name?.split('.').pop().toLowerCase() || '';

    switch (extension) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'doc':
      case 'docx':
        return 'description';
      case 'xls':
      case 'xlsx':
        return 'table_chart';
      case 'ppt':
      case 'pptx':
        return 'slideshow';
      case 'zip':
      case 'rar':
        return 'folder_zip';
      case 'txt':
        return 'article';
      default:
        return 'insert_drive_file';
    }
  }

  getFileName(file: any): string {
    if (!file?.name) return 'Unknown file';

    // If name is longer than 15 chars, truncate and add ...
    if (file.name.length > 15) {
      const extension = file.name.split('.').pop();
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      return `${baseName.substring(0, 12)}...${extension ? '.' + extension : ''}`;
    }

    return file.name;
  }

  getFileUrl(file: any): string {
    return file?.url || '';
  }

  openAttachment(file: any, event: Event): void {
    event.stopPropagation();
    window.open(this.getFileUrl(file), '_blank');
  }

  formatDate(date: string): string {
    const postDate = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h`;
    } else if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}d`;
    } else {
      // Format as MM/DD/YYYY
      return `${postDate.getMonth() + 1}/${postDate.getDate()}/${postDate.getFullYear()}`;
    }
  }
}
