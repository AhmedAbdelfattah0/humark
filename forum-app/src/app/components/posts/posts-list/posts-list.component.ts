import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ForumService } from '../../../services/forum.service';
import { AuthService } from '../../../services/auth.service';
import { PostFormComponent } from '../post-form/post-form.component';
import { EditPostPopupComponent } from '../edit-post-popup/edit-post-popup.component';

// Define interfaces for post data structure
interface PostFile {
  url: string;
  file_name: string;
  file_type: string;
}

interface PostComment {
  id: number;
  content: string;
  author_name: string;
  author_avatar: string;
  created_at: string;
}

interface Post {
  id: number;
  content: string;
  author_name: string;
  author_avatar: string;
  user_id?: number;
  created_at: string;
  likes_count: number;
  comments_count: number;
  files?: PostFile[];
  comments?: PostComment[];
}

@Component({
  selector: 'app-posts-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    PostFormComponent,
    EditPostPopupComponent
  ],
  templateUrl: './posts-list.component.html',
  styleUrls: ['./posts-list.component.scss']
})
export class PostsListComponent implements OnInit {
  posts: Post[] = [];
  isLoading: boolean = false;
  userAvatar: string | null = null;
  currentUserId: number | null = null;
  isDeleting: { [key: number]: boolean } = {};
  error: string | null = null;

  // Comment control for each post
  commentControls: { [key: string]: FormControl } = {};
  showCommentEmojiPicker: number | null = null;
  commonEmojis = ['😀', '😂', '😍', '👍', '🎉', '❤️', '👏', '🙏', '🔥', '✅', '⭐', '💯'];

  // Post actions menu
  showActionsMenu: number | null = null;

  // Edit post
  showEditPostPopup: boolean = false;
  editPostId: number | null = null;

  constructor(
    private forumService: ForumService,
    public authService: AuthService,
    private router: Router
  ) {
    // Get current user ID from auth service
    if (this.authService.isAuthenticated()) {
      const token = this.authService.getToken();
      if (token) {
        const decoded = this.authService.decodeToken(token);
        this.currentUserId = decoded.user_id;
      }
    }
  }

  ngOnInit() {
    this.loadPosts();
    // this.loadUserProfile();
  }

  loadUserProfile() {
    if (this.authService.isAuthenticated()) {
      this.forumService.getProfile().subscribe({
        next: (profile) => {
          this.userAvatar = profile.avatar_url;
        },
        error: (err) => {
          console.error('Error loading profile:', err);
        }
      });
    }
  }

  loadPosts() {
    this.isLoading = true;
    this.forumService.getPosts().subscribe({
      next: (response) => {
        if(response && response.posts && response.posts.length){
          this.posts = response.posts.map((post: any) => {
            // Ensure we have defaults for required fields
            return {
              id: post.id,
              content: post.content || '',
              author_name: post.author_name || 'Anonymous',
              author_avatar: post.author_avatar || 'profile-avatar.png',
              user_id: post.user_id, // Add user_id to identify post ownership
              created_at: post.created_at || new Date().toISOString(),
              likes_count: post.likes_count || 0,
              comments_count: post.comments_count || 0,
              files: post.files || [],
              comments: post.comments || []
            };
          });
        } else {
          this.posts = [];
        }
        this.isLoading = false;

        // Initialize comment controls for each post
        this.posts.forEach(post => {
          this.commentControls[post.id] = new FormControl('');
        });
      },
      error: (err) => {
        console.error('Error loading posts:', err);
        this.isLoading = false;
      }
    });
  }

  // Toggle actions menu for post options
  toggleActionsMenu(postId: number) {
    if (this.showActionsMenu === postId) {
      this.showActionsMenu = null;
    } else {
      this.showActionsMenu = postId;
    }
  }

  // Check if current user is the author of the post
  isPostAuthor(post: Post): boolean {
    return this.currentUserId === post.user_id;
  }

  // Navigate to edit post
  editPost(postId: number) {
    this.editPostId = postId;
    this.showEditPostPopup = true;
    this.showActionsMenu = null;
  }

  // Delete post
  deletePost(postId: number) {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      this.isDeleting[postId] = true;
      this.forumService.deletePost(postId).subscribe({
        next: () => {
          // Remove post from list on success
          this.posts = this.posts.filter(post => post.id !== postId);
          this.isDeleting[postId] = false;
        },
        error: (err) => {
          console.error('Error deleting post:', err);
          this.error = 'Failed to delete post. Please try again.';
          this.isDeleting[postId] = false;
        }
      });
    }
    this.showActionsMenu = null;
  }

  toggleCommentEmojiPicker(postId: number) {
    if (this.showCommentEmojiPicker === postId) {
      this.showCommentEmojiPicker = null;
    } else {
      this.showCommentEmojiPicker = postId;
    }
  }

  addCommentEmoji(postId: number, emoji: string) {
    const control = this.commentControls[postId];
    if (control) {
      control.setValue((control.value || '') + emoji);
    }
    this.showCommentEmojiPicker = null;
  }

  addComment(postId: number) {
    const control = this.commentControls[postId];
    if (control && control.value && control.value.trim()) {
      const commentData = {
        post_id: postId,
        content: control.value.trim()
      };

      this.forumService.createReply(commentData).subscribe({
        next: (response) => {
          // Add the new comment to the post
          const post = this.posts.find(p => p.id === postId);
          if (post) {
            if (!post.comments) {
              post.comments = [];
            }

            post.comments.unshift({
              id: response.id,
              content: commentData.content,
              author_name: 'You',
              author_avatar: this.userAvatar || '',
              created_at: new Date().toISOString()
            });

            // Increment the comment count
            post.comments_count = (post.comments_count || 0) + 1;
          }

          // Clear the comment input
          control.setValue('');
        },
        error: (err) => {
          console.error('Error adding comment:', err);
        }
      });
    }
  }

  checkFileType(file_path: string) {
    const fileExtension = file_path.split('.').pop();
    if(fileExtension === 'png' || fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'gif' || fileExtension === 'webp') {
      return 'image';
    }
    return 'file';
  }

  // Close menus when clicking outside
  closeMenus() {
    this.showActionsMenu = null;
    this.showCommentEmojiPicker = null;
  }

  // Handle post updated event
  onPostUpdated(updatedPost: any) {
    // Refresh the posts list to show the updated content
    this.loadPosts();
  }
}
