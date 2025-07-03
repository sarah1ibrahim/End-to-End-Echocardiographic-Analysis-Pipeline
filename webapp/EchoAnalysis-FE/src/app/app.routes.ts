import { Routes } from '@angular/router';
import { hostname } from 'node:os';
import { HomeComponent } from './home/home.component';
// import path from 'node:path';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { SegmentationAnalysisComponent } from './segmentation-analysis/segmentation-analysis.component';
import { WelcomComponent } from './welcom/welcom.component';
import { PatientListComponent } from './patient-list/patient-list.component';
import { LoginComponent } from './login/login.component';
import { ReportsComponent } from './reports/reports.component';
import { LandingPageComponent } from './landing-page/landing-page.component';

export const routes: Routes = [
    { path: '', component: LandingPageComponent, title: 'Welcome' },
    { path: 'login', component: LoginComponent },
    {path:'home',component:HomeComponent,title:'Home',children:[
        {path:'segmentation',component:SegmentationAnalysisComponent,title:'Segmentation Analysis'},
        {path:'welcome',component:WelcomComponent,title:'welcome'},
        {path:'Patients-list',component:PatientListComponent,title:'Patients'},
        // {path:'segmentation',component:SegmentationAnalysisComponent,title:'Segmentation Analysis'},
    ]},
    {path: 'reports', component:ReportsComponent, title:'Reports'},
    {path:'about',component:AboutComponent,title:'About'},
    {path:'contact',component:ContactComponent,title:'Contact Us'},
    {path:'**',component:NotFoundComponent,title:'Not Found'},
    // {path:'**',component:,title:'home'},
    
];
