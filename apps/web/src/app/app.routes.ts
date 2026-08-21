import { Route } from '@angular/router';
import { SharedLayout } from '@web/shared-layout';
import { HomeComponent } from './pages/home/home';
import { FeatureListComponent } from '@web/agent';
import { McpPageComponent } from '@web/mcp';
import { SkillsFeatureListComponent } from '@web/skills';
import { PromptsFeatureListComponent } from '@web/prompts';

export const appRoutes: Route[] = [
  {
    path: '',
    component: SharedLayout,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'agents', component: FeatureListComponent },
      { path: 'mcp', component: McpPageComponent },
      { path: 'skills', component: SkillsFeatureListComponent },
      { path: 'prompts', component: PromptsFeatureListComponent },
    ]
  }
];


