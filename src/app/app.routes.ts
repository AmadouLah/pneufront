import { Routes } from '@angular/router';
import { authGuard } from './guard/auth-guard-guard';
import { loginGuard } from './guard/login-guard';
import { adminGuard } from './guard/admin-guard';
import { livreurGuard } from './guard/livreur-guard';

export const routes: Routes = [
  // Home - Page d'accueil publique
  {
    path: '',
    loadComponent: () => import('./frontoffice/home/home').then(m => m.HomeComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./frontoffice/about/about').then(m => m.AboutComponent)
  },
  {
    path: 'shop',
    loadComponent: () => import('./frontoffice/shop/shop').then(m => m.ShopComponent)
  },
  {
    path: 'blog',
    loadComponent: () => import('./frontoffice/blog/blog').then(m => m.BlogComponent)
  },
  
  // Auth Routes
  {
    path: 'auth/login',
    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./auth/register/register').then(m => m.RegisterComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'auth/verify',
    loadComponent: () => import('./auth/verify/verify').then(m => m.VerifyComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'auth/set-password',
    loadComponent: () => import('./auth/set-password/set-password').then(m => m.SetPasswordComponent)
  },
  
  // Frontoffice Routes
  {
    path: 'frontoffice/contact',
    loadComponent: () => import('./frontoffice/contact/contact').then(m => m.ContactComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./frontoffice/cart/cart').then(m => m.CartComponent)
  },
  {
    path: 'frontoffice/profil',
    loadComponent: () => import('./frontoffice/profil/profil').then(m => m.ProfilComponent),
    canActivate: [authGuard]
  },
  {
    path: 'orders',
    loadComponent: () => import('./frontoffice/orders/orders').then(m => m.OrdersComponent),
    canActivate: [authGuard]
  },
  {
    path: 'mon-compte/devis',
    loadComponent: () => import('./frontoffice/account/quotes/quotes').then(m => m.AccountQuotesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'demande-devis',
    loadComponent: () => import('./frontoffice/quote-request/quote-request').then(m => m.QuoteRequestComponent),
    canActivate: [authGuard]
  },
  {
    path: 'frontoffice/favoris',
    loadComponent: () => import('./frontoffice/favoris/mes-favoris').then(m => m.MesFavorisComponent),
    canActivate: [authGuard]
  },
  {
    path: 'frontoffice/legal/terms',
    loadComponent: () => import('./frontoffice/legal/terms/terms').then(m => m.TermsComponent)
  },
  {
    path: 'frontoffice/legal/privacy',
    loadComponent: () => import('./frontoffice/legal/privacy/privacy').then(m => m.PrivacyComponent)
  },
  {
    path: 'frontoffice/legal/mentions',
    loadComponent: () => import('./frontoffice/legal/mentions/mentions').then(m => m.MentionsComponent)
  },
  {
    path: 'frontoffice/legal/delivery',
    loadComponent: () => import('./frontoffice/legal/delivery/delivery').then(m => m.DeliveryComponent)
  },
  
  // Backoffice Routes (Admin/Developer only)
  {
    path: 'dashboard',
    loadComponent: () => import('./backoffice/layout/backoffice-layout').then(m => m.BackofficeLayoutComponent),
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./backoffice/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./backoffice/products/products').then(m => m.ProductsComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./backoffice/categories/categories').then(m => m.CategoriesComponent)
      },
      {
        path: 'vehicle-types',
        loadComponent: () => import('./backoffice/vehicle-types/vehicle-types').then(m => m.VehicleTypesComponent)
      },
      {
        path: 'brands',
        loadComponent: () => import('./backoffice/brands/brands').then(m => m.BrandsComponent)
      },
      {
        path: 'tire-conditions',
        loadComponent: () => import('./backoffice/tire-conditions/tire-conditions').then(m => m.TireConditionsComponent)
      },
      {
        path: 'influenceurs',
        loadComponent: () => import('./backoffice/influenceurs/influenceurs').then(m => m.InfluenceursComponent)
      },
      {
        path: 'influenceurs/archive',
        loadComponent: () => import('./backoffice/influenceurs/archive-influenceurs').then(m => m.ArchiveInfluenceursComponent)
      },
      {
        path: 'livreurs',
        loadComponent: () => import('./backoffice/livreurs/livreurs').then(m => m.LivreursComponent)
      },
      {
        path: 'promotions',
        loadComponent: () => import('./backoffice/promotions/promotions').then(m => m.PromotionsComponent)
      },
      {
        path: 'quotes',
        loadComponent: () => import('./backoffice/quotes/quotes').then(m => m.QuotesComponent)
      },
      {
        path: 'livreur',
        loadComponent: () => import('./backoffice/livreur/livreur-dashboard').then(m => m.LivreurDashboardComponent),
        canActivate: [livreurGuard]
      }
    ]
  },
  
  // Redirections
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
