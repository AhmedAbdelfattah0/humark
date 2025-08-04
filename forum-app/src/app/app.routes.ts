import { Routes } from '@angular/router';
import { PostFormComponent } from './components/posts/post-form/post-form.component';
 import { PostsListComponent } from './components/posts/posts-list/posts-list.component';
import { AuthGuard } from './services/auth.gard';
import { RegisterComponent } from './components/auth/register/register.component';
import { LoginComponent } from './components/auth/login/login.component';
import { AUTH_ROUTES } from './components/auth/auth.routes';
  // import { CategoriesListComponent } from './components/categories/categories-list/categories-list.component';
// import { CategoryDetailComponent } from './components/categories/category-details/category-details.component';
// import { CategoryFormComponent } from './components/categories/category-form/category-form.component';

export const routes: Routes = [
  { path: '', redirectTo: '/posts', pathMatch: 'full' },
  { path: 'posts', component: PostsListComponent, canActivate: [AuthGuard] },
   { path: 'posts/:id/edit', component: PostFormComponent, canActivate: [AuthGuard] },
  // { path: 'categories', component: CategoriesListComponent, canActivate: [AuthGuard] },
  // { path: 'categories/:id', component: CategoryDetailComponent, canActivate: [AuthGuard] },
  // { path: 'categories/:id/edit', component: CategoryFormComponent, canActivate: [AuthGuard] },
  { path: 'auth', children: AUTH_ROUTES },
  // { path: 'login', component: LoginComponent },
  // { path: 'register', component: RegisterComponent },
];
