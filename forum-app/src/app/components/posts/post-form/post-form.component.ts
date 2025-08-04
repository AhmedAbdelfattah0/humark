import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectionStrategy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ForumService } from '../../../services/forum.service';
import { AuthService } from '../../../services/auth.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './post-form.component.html',
  styleUrls: ['./post-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostFormComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('contentTextarea') contentTextarea!: ElementRef;

  @Input() postId: number | null = null;
  @Input() isPopup: boolean = false;
  @Input() existingFiles: any[] = [];

  @Output() formSubmitted = new EventEmitter<any>();
  @Output() canceled = new EventEmitter<void>();

  postForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  isEditMode = false;

  userAvatar: string | null = null;
  filePreviewUrls: string[] = [];
  uploadedFiles: File[] = [];
  filesToRemove: number[] = [];

  showEmojiPicker = false;
  commonEmojis = ['😀', '😂', '😍', '👍', '🎉', '❤️', '👏', '🙏', '🔥', '✅', '⭐', '💯'];
  tokenDecoded: any;

  // Prevent layout shifts by setting initial height
  textareaMinHeight = 80;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.postForm = this.fb.group({
      content: ['', [Validators.required]]
    });

    this.tokenDecoded = this.authService.decodeToken(this.authService.getToken() || '');
  }

  ngOnInit() {
    // this.loadUserProfile();

    if (this.postId) {
      this.isEditMode = true;
      this.loadPost();
    }

    // Listen for content changes to auto-resize textarea
    this.postForm.get('content')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.autoResizeTextarea();
        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit() {
    // Set initial height for textarea to prevent layout shifts
    setTimeout(() => this.autoResizeTextarea(), 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['postId'] && changes['postId'].currentValue) {
      this.isEditMode = true;
      this.postId = changes['postId'].currentValue;
      this.loadPost();
    }

    // When existingFiles changes, update previews
    if (changes['existingFiles'] && changes['existingFiles'].currentValue) {
      this.updateFilePreviewsFromExisting();
    }
  }

  // Track items in ngFor for better performance
  trackByFn(index: number, item: any): number {
    return index;
  }

  // Auto-resize textarea based on content
  autoResizeTextarea() {
    if (!this.contentTextarea?.nativeElement) return;

    const textarea = this.contentTextarea.nativeElement;
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.max(this.textareaMinHeight, scrollHeight)}px`;
  }

  loadUserProfile() {
    this.forumService.getProfile().subscribe({
      next: (profile) => {
        this.userAvatar = profile.avatar_url;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading profile:', err);
      }
    });
  }

  loadPost() {
    if (this.postId) {
      this.isLoading = true;
      this.cdr.markForCheck();

      this.forumService.getPost(this.postId).subscribe({
        next: (response) => {
          if (!response || !response.post) {
            this.error = 'Failed to load post data';
            this.isLoading = false;
            this.cdr.markForCheck();
            return;
          }

          const post = response.post;
          this.postForm.patchValue({
            content: post.content || ''
          });

          // If existing files were not passed as input, load them from the post
          if (!this.existingFiles.length && post.files && post.files.length > 0) {
            this.existingFiles = post.files;
            this.updateFilePreviewsFromExisting();
          }

          this.isLoading = false;
          this.cdr.markForCheck();

          // Resize textarea after content is loaded
          setTimeout(() => this.autoResizeTextarea(), 0);
        },
        error: (err) => {
          console.error('Error loading post:', err);
          this.error = 'Failed to load post data: ' + (err.error?.message || err.message || 'Unknown error');
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const newFiles = Array.from(input.files);

    // Show loading state
    this.isLoading = true;
    this.cdr.markForCheck();

    // Process files asynchronously to avoid UI blocking
    setTimeout(() => {
      // Validate files before adding them
      const validFiles: File[] = [];
      const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      newFiles.forEach(file => {
        // Check file size
        if (file.size > maxSizeInBytes) {
          this.error = `File ${file.name} exceeds maximum size of 10MB`;
          return;
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
          this.error = `File ${file.name} has unsupported format. Allowed formats: JPG, PNG, GIF, PDF, DOC, DOCX`;
          return;
        }

        validFiles.push(file);
      });

      // Process valid files
      if (validFiles.length > 0) {
        // Save the file objects
        this.uploadedFiles = [...this.uploadedFiles, ...validFiles];

        // Create preview URLs
        const previewPromises = validFiles.map(file => {
          return new Promise<void>((resolve) => {
            if (file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = (e: any) => {
                this.filePreviewUrls.push(e.target.result);
                resolve();
              };
              reader.readAsDataURL(file);
            } else {
              // For non-image files, use appropriate icons based on file type
              if (file.type.includes('pdf')) {
                this.filePreviewUrls.push('assets/pdf-icon.png');
              } else if (file.type.includes('word') || file.type.includes('document')) {
                this.filePreviewUrls.push('assets/doc-icon.png');
              } else {
                this.filePreviewUrls.push('assets/file-icon.png');
              }
              resolve();
            }
          });
        });

        // Wait for all preview promises to resolve
        Promise.all(previewPromises).then(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      } else {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    }, 0);

    // Reset the input so the same file can be selected again
    input.value = '';
  }

  removeFile(index: number) {
    // Check if this is an existing file or a newly uploaded one
    if (this.isEditMode && index < this.existingFiles.length) {
      // This is an existing file, mark it for removal on the server
      const file = this.existingFiles[index];
      if (file.id) {
        this.filesToRemove.push(file.id);
      }
      this.existingFiles.splice(index, 1);
      this.filePreviewUrls.splice(index, 1);
    } else {
      // This is a newly uploaded file, just remove it from the array
      const newFileIndex = index - (this.existingFiles?.length || 0);
      if (newFileIndex >= 0) {
        this.uploadedFiles.splice(newFileIndex, 1);
        this.filePreviewUrls.splice(index, 1);
      }
    }
    this.cdr.markForCheck();
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
    this.cdr.markForCheck();
  }

  addEmoji(emoji: string) {
    const contentControl = this.postForm.get('content');
    const currentContent = contentControl?.value || '';
    contentControl?.setValue(currentContent + emoji);
    this.showEmojiPicker = false;
    this.cdr.markForCheck();

    // Focus back on the textarea after emoji is added
    setTimeout(() => {
      if (this.contentTextarea?.nativeElement) {
        this.contentTextarea.nativeElement.focus();
      }
    }, 0);
  }

  onSubmit() {
    if (this.postForm.valid) {
      this.isLoading = true;
      this.error = null;
      this.cdr.markForCheck();

      // First check if FormData is supported
      if (typeof FormData === 'undefined') {
        this.error = 'Your browser does not support FormData which is required for file uploads.';
        this.isLoading = false;
        this.cdr.markForCheck();
        return;
      }

      const formData = new FormData();
      formData.append('content', this.postForm.get('content')?.value);

      // Add user data if available
      if (this.tokenDecoded) {
        formData.append('user_id', this.tokenDecoded.user_id);
        if (this.tokenDecoded.tenant && this.tokenDecoded.tenant.tenant_id) {
          formData.append('tenant_id', this.tokenDecoded.tenant.tenant_id);
        }
      }

      // Add files to form data
      if (this.uploadedFiles.length > 0) {
        this.uploadedFiles.forEach((file, index) => {
          formData.append(`files[${index}]`, file);
        });
      }

      // Add files to remove if in edit mode
      if (this.filesToRemove.length > 0) {
        formData.append('remove_files', JSON.stringify(this.filesToRemove));
      }

      // If in popup mode, emit data to parent component
      if (this.isPopup) {
        this.formSubmitted.emit({
          formData,
          content: this.postForm.get('content')?.value,
          files: this.uploadedFiles,
          filesToRemove: this.filesToRemove
        });
        this.isLoading = false;
        this.cdr.markForCheck();
        return;
      }

      // Otherwise submit directly
      if (this.isEditMode && this.postId) {
        // Update existing post
        this.forumService.updatePost(this.postId, formData).subscribe({
          next: () => {
            this.isLoading = false;
            this.resetForm();
            // Redirect back to posts list
            this.router.navigate(['/posts']);
          },
          error: (err) => {
            this.isLoading = false;
            this.error = err.error?.message || 'Error updating post';
            console.error('Error updating post:', err);
            this.cdr.markForCheck();
          }
        });
      } else {
        // Create new post
        this.forumService.createPost(formData).subscribe({
          next: () => {
            this.isLoading = false;
            this.resetForm();
            // Redirect to posts list
            this.router.navigate(['/posts']);
          },
          error: (err) => {
            this.isLoading = false;
            this.error = err.error?.message || 'Error creating post';
            console.error('Error creating post:', err);
            this.cdr.markForCheck();
          }
        });
      }
    }
  }

  cancelForm() {
    this.resetForm();
    this.canceled.emit();
  }

  resetForm() {
    this.postForm.reset();
    this.filePreviewUrls = [];
    this.uploadedFiles = [];
    this.filesToRemove = [];
    this.error = null;
    this.cdr.markForCheck();
  }

  // Utility methods for handling files
  isImage(fileType: string): boolean {
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'heic', 'heif', 'hevc', 'avif' ,'jfif'].includes(fileType);
  }

  getFileType(file: any): string {
    debugger
    if (typeof file === 'string') {
      return file.split('.').pop()?.toLowerCase() || '';
    } else if (file instanceof File) {
      return file.name.split('.').pop()?.toLowerCase() || '';
    } else if (file.file_type) {
      return file.file_type.split('/').pop()?.toLowerCase() || '';
    } else if (file.file_name) {
      return file.file_name.split('.').pop()?.toLowerCase() || '';
    }
    return '';
  }

  getFileUrl(file: any): string {
    if (typeof file === 'string') {
      return file;
    } else if (file instanceof File) {
      // For newly selected files that haven't been uploaded yet
      return URL.createObjectURL(file);
    } else if (file.url) {
      return file.url;
    }
    return '';
  }

  getFileName(file: any): string {
    if (typeof file === 'string') {
      return file.split('/').pop() || 'File';
    } else if (file instanceof File) {
      return file.name || 'File';
    } else if (file.file_name) {
      return file.file_name || 'File';
    }
    return 'File';
  }

  updateFilePreviewsFromExisting() {
    if (this.existingFiles && this.existingFiles.length > 0) {
      // Reset file previews
      this.filePreviewUrls = [];

      // Add each existing file to the preview
      this.existingFiles.forEach(file => {
        // Get the file URL or use appropriate icon
        let previewUrl = '';
        const fileType = this.getFileType(file);

        if (this.isImage(fileType)) {
          previewUrl = this.getFileUrl(file);
        } else if (fileType === 'pdf') {
          previewUrl = 'assets/pdf-icon.png';
        } else if (['doc', 'docx'].includes(fileType)) {
          previewUrl = 'assets/doc-icon.png';
        } else {
          previewUrl = 'assets/file-icon.png';
        }

        this.filePreviewUrls.push(previewUrl);
      });

      this.cdr.markForCheck();
    }
  }

  get content() { return this.postForm.get('content'); }

  getFileIconClass(file: any): string {
    const fileType = this.getFileType(file);

    switch (fileType) {
      case 'pdf':
        return 'fa-file-pdf';
      case 'doc':
      case 'docx':
        return 'fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fa-file-excel';
      case 'ppt':
      case 'pptx':
        return 'fa-file-powerpoint';
      case 'zip':
      case 'rar':
        return 'fa-file-archive';
      case 'txt':
        return 'fa-file-alt';
      case 'csv':
        return 'fa-file-csv';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'fa-file-audio';
      case 'mp4':
      case 'avi':
      case 'mov':
        return 'fa-file-video';
      case 'html':
      case 'css':
      case 'js':
        return 'fa-file-code';
      default:
        return 'fa-file';
    }
  }
}
