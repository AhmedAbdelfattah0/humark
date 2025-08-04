import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private apiUrl = 'https://humarksa.com/api';

  constructor(private http: HttpClient) {}

  // Posts
  getPosts(categoryId?: number): Observable<any> {
    const url = categoryId
      ? `${this.apiUrl}/posts.php?action=getPosts&category_id=${categoryId}`
      : `${this.apiUrl}/posts.php?action=getPosts`;
    return this.http.get(url);
  }

  getPost(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/posts.php?action=getPostById&id=${id}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching post:', error);
          return throwError(() => ({
            error: error,
            message: 'Failed to load post. Please try again.'
          }));
        })
      );
  }

  createPost(post: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/posts.php?action=createPost`, post);
  }

  updatePost(id: number, post: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/posts.php?action=updatePost&id=${id}`, post);
  }

  deletePost(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/posts.php?action=deletePost&id=${id}`);
  }

  // Categories
  getCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories.php?action=getCategories`);
  }

  createCategory(category: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories.php?action=createCategory`, category);
  }

  // Replies
  getReplies(postId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/replies.php?action=getReplies&post_id=${postId}`);
  }

  createReply(reply: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/replies.php?action=createReply`, reply);
  }

  // Files
  uploadFiles(files: File[]): Observable<any> {
    console.log(`Uploading ${files.length} files`);

    const formData = new FormData();

    // Use a consistent approach regardless of file count
    // Always use files[] parameter to handle both single and multiple files
    for (let i = 0; i < files.length; i++) {
      formData.append('files[]', files[i], files[i].name);
      console.log(`Added file ${i+1}/${files.length}: ${files[i].name}`);
    }

    return this.http.post(`${this.apiUrl}/files.php?action=upload`, formData);
  }

  // Legacy methods for backward compatibility
  uploadFile(file: File): Observable<any> {
    return this.uploadFiles([file]);
  }

  uploadMultipleFiles(files: File[]): Observable<any> {
    return this.uploadFiles(files);
  }

  // Notifications
  getNotifications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/notifications.php?action=getNotifications`);
  }

  markNotificationAsRead(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications.php?action=markNotificationAsRead&id=${id}`, {});
  }

  // Search
  search(query: string, type: string = 'all'): Observable<any> {
    return this.http.get(`${this.apiUrl}/search.php?action=search&q=${query}&type=${type}`);
  }

  // Statistics
  getStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistics.php?action=getStatistics`);
  }

  // Profile
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile.php?action=getProfile`);
  }

  updateProfile(profile: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile.php?action=updateProfile`, profile);
  }

  // Users (Admin only)
  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users.php?action=getUsers`);
  }

  updateUser(user: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users.php?action=updateUser`, user);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users.php?action=deleteUser&id=${id}`);
  }
}
