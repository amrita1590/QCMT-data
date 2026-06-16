import { Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { RegisterComponent } from './register/register.component';
import { ContactComponent } from './contact/contact.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { StudentComponent } from './student/student.component';
import { AuthGuard } from './service/authguard.service';
import { SettingsComponent } from './settings/settings.component';
import { UpdatepasswordComponent } from './login/updatepassword/updatepassword.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { TermsConditionsComponent } from './terms-conditions/terms-conditions.component';
import { UnitmasterComponent } from './master/unitmaster/unitmaster.component';
import { CategoryComponent } from './master/category/category.component';
import { QuestionnairetemplatesComponent } from './questionnairetemplates/questionnairetemplates.component';
import { AuditscheduleComponent } from './auditschedule/auditschedule.component';
import { AuditboardComponent } from './auditboard/auditboard.component';
import { AuditBoardCasoComponent } from './audit-board-caso/audit-board-caso.component';
import { PageNotFoundComponentComponent } from './404/page-not-found-component/page-not-found-component.component';
import { IcaoComponent } from './icao/icao.component';
import { BcasComponent } from './bcas/bcas.component';
import { InternalAuditComponent } from './internal-audit/internal-audit.component';
import { IqcuAuditComponent } from './iqcu-audit/iqcu-audit.component';
import { ChangepasswordComponent } from './register/changepassword/changepassword.component';
import { ChangepasswordpageComponent } from './changepassword/changepasswordpage/changepasswordpage.component';
import { IqcuauditlistComponent } from './iqcuaudit/iqcuauditlist/iqcuauditlist.component';
import { OtherauditapshqrsdeskComponent } from './otherauditapshqrsdesk/otherauditapshqrsdesk.component';


export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'about', component: AboutComponent},
    {path: 'contact', component: ContactComponent},
    {path: 'login', component: LoginComponent},
    {path: 'updatepassword', component: UpdatepasswordComponent},
    {path: 'privacy', component: PrivacyPolicyComponent},
    {path: 'terms', component: TermsConditionsComponent},  
    {path: 'register', component: RegisterComponent, canActivate: [AuthGuard]},
    {path: 'changepassword', component: ChangepasswordpageComponent, canActivate: [AuthGuard]},
    {path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]},
    {path: 'student', component: StudentComponent, canActivate: [AuthGuard]},
    {path: 'settings', component: SettingsComponent, canActivate: [AuthGuard]},
    {path: 'unitmaster', component: UnitmasterComponent, canActivate: [AuthGuard]},
    {path: 'categorymaster', component: CategoryComponent, canActivate: [AuthGuard]},
    {path: 'questionnairetemplate', component: QuestionnairetemplatesComponent, canActivate: [AuthGuard]},
    {path: 'auditschedule', component: AuditscheduleComponent, canActivate: [AuthGuard]},
    {path: 'auditboard', component: AuditboardComponent, canActivate: [AuthGuard]},
    {path: 'auditboardcaso', component: AuditBoardCasoComponent, canActivate: [AuthGuard]},
    {path: 'iqcu', component: IqcuAuditComponent, canActivate: [AuthGuard]},
    {path: 'internalaudit', component: InternalAuditComponent, canActivate: [AuthGuard]},
    {path: 'bcas', component: BcasComponent, canActivate: [AuthGuard]},
    {path: 'icao', component: IcaoComponent, canActivate: [AuthGuard]},
    {path: 'iqcuauditlist', component: IqcuauditlistComponent, canActivate: [AuthGuard]},
    {path: 'otherauditapshqrsdesk', component: OtherauditapshqrsdeskComponent, canActivate: [AuthGuard]},
    {path: '**', component: PageNotFoundComponentComponent, canActivate: [AuthGuard]}
];
