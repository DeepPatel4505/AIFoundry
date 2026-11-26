import { Route } from '@angular/router';
import { SharedLayout } from '@web/shared-layout';
import { HomeComponent } from './pages/home/home';
import { FeatureListComponent } from '@web/agent';
import { McpFeatureListComponent } from '@web/mcp';
import { SkillsFeatureListComponent } from '@web/skills';
import { PromptsFeatureListComponent } from '@web/prompts';
import { authGuard } from '@web/auth';

export const appRoutes: Route[] = [
  {
    path: '',
    component: SharedLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'agents', component: FeatureListComponent },
      { path: 'agents/:id', loadComponent: () => import('@web/agent').then(m => m.AgentFeatureDetailComponent) },
      { path: 'mcp', component: McpFeatureListComponent },
      { path: 'mcp/:id', loadComponent: () => import('@web/mcp').then(m => m.McpFeatureDetailComponent) },
      { path: 'skills', component: SkillsFeatureListComponent },
      { path: 'skills/:id', loadComponent: () => import('@web/skills').then(m => m.SkillsFeatureDetailComponent) },
      { path: 'prompts', component: PromptsFeatureListComponent },
      { path: 'prompts/:id', loadComponent: () => import('@web/prompts').then(m => m.PromptsFeatureDetailComponent) },
      { path: 'profile', loadComponent: () => import('@web/auth').then(m => m.ProfileComponent) },
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('@web/auth').then(m => m.LoginComponent),
  }
];


