import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { User } from '../interface/User';
import { Login } from '../interface/Login';
import { UserDashboard } from '../interface/UserDashboard';
import { ChangePassword } from '../interface/ChangePassword';
import { UserRoles } from '../interface/UserRoles';
import { UserRoleDetails } from '../interface/UserRoleDetails';
import { NotificationBean } from '../interface/NotificationBean';
import { OtpActionResponse } from '../interface/OtpActionResponse';
import { CaptchaChallenge } from '../interface/CaptchaChallenge';

@Injectable({
  providedIn: 'root'
})
export class UsermanagementService {
     
  private token: string | null = null;
  private registerUrl = '/v1/qcmt/auth/register'; // Use the proxy path
  private loginUrl = '/v1/qcmt/auth/login';
  private captchaUrl = '/v1/qcmt/auth/captcha';
  private publicKeyUrl = '/v1/qcmt/auth/publickey';
  private sendOtpUrl = '/v1/qcmt/auth/send-otp';
  private resendOtpUrl = '/v1/qcmt/auth/resend-otp';
  private verifyOtpUrl = '/v1/qcmt/auth/verify-otp';
  private userDetails = '/v1/qcmt/master/userdetails';
  private userAuditDetails = '/v1/qcmt/master/audituserlist';
   private registeruserUrl = '/v1/qcmt/master/saveusermaster';
  private updatePassword = '/v1/qcmt/auth/changePassword'; // Use the proxy path
  private userProfileDetails = '/v1/qcmt/auth/userprofile';
  private updateuserprofile = '/v1/qcmt/auth/updateuserprofile';
  private logoutUrl = '/v1/qcmt/auth/logout';
  isLoggedIn: boolean = false;

  private loginuserdetail = '/v1/qcmt/master/loginuserdetail';
  private userDetailList = '/v1/qcmt/master/userdetaillist';
  private user = '/v1/qcmt/master/user';
  private userManagementUrl = '/v1/qcmt/master/usermanagement';
  
  private saveNotificationUrl = '/v1/qcmt/master/savenotification';
  private notificationListUrl = '/v1/qcmt/master/getnotification';
  private allNotificationListUrl = '/v1/qcmt/master/getallnotification';
  private updateNotificationUrl = '/v1/qcmt/master/updatenotification';


  private userData: Observable<User> | null = null;

   /** Globl Variable example */
  private globalUsername = new BehaviorSubject<string>('User');
  private globalUserId = new BehaviorSubject<string>('UserId');

  // Observable string streams
  username$ = this.globalUsername.asObservable();
  userId$ = this.globalUserId.asObservable();


  updateGlobalVar(username: string, userId: string) {
    this.globalUsername.next(username);
    this.globalUserId.next(userId);
    console.log("Global username updated to:", username);
    console.log("Global user ID updated to:", userId);
  }

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient) {
    console.log("Inside User Management Service !!");
    // Retrieve token from localStorage if in browser
    if (isPlatformBrowser(this.platformId)) {
      this.token = localStorage.getItem('jwtToken');
      this.isLoggedIn = !!this.token; // Set isLoggedIn based on token presence
    }
  }
  
  getUserDetailList(): Observable<User[]> {
    return this.http.get<User[]>(this.userDetailList);
  }

   getLoggedUserDetailList(): Observable<User[]> {
    return this.http.get<User[]>(this.loginuserdetail);
  }


  getUserAuditDetailList(): Observable<UserRoleDetails[]> {
    return this.http.get<UserRoleDetails[]>(this.userAuditDetails);
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(this.user+"/"+id);
  }
  
  getUserDetails(): Observable<any> {
    return this.http.post<any>(this.userDetails, localStorage.getItem('jwtToken'));
  }

  getUserProfileDetails(): Observable<User> {
    return this.http.get<User>(this.userProfileDetails);
  }

  updateUserProfileDetails(user: User): Observable<any> {
    return this.http.post<any>(this.updateuserprofile, user);
  }

  addUserDetails(token: String | any): Observable<User> {
    return this.http.post<User>(this.registerUrl, token);
  }

  userManagement(userRoles: UserRoles): Observable<string> {
    return this.http.post(this.userManagementUrl, userRoles, {
      responseType: 'text'
    });
  }


  updatePasswordDetails(userData: ChangePassword): Observable<any> {
    return this.http.post<any>(this.updatePassword, userData);
  }

  userLogin(login: Login, captchaId: string, captchaAnswer: string): Observable<any> {
    return this.http.post(this.loginUrl, login, {
      responseType: 'text',
      headers: { 'X-Captcha-Id': captchaId, 'X-Captcha-Answer': captchaAnswer }
    }).pipe(
      tap(response => {
        // An OTP_REQUIRED JSON payload is handled by the caller (LoginComponent) - only a
        // plain-token / "updatepassword-<token>" response represents a completed login here.
        if (this.isOtpRequiredResponse(response)) {
          return;
        }
        this.storeLoginToken(response);
      })
    );
  }

  /** Backend-issued math-captcha challenge for /login - the answer is never sent to the client. */
  getCaptcha(): Observable<CaptchaChallenge> {
    return this.http.get<CaptchaChallenge>(this.captchaUrl);
  }

  /** RSA public key used to encrypt the password before /login - see LoginComponent.encryptPassword(). */
  getLoginPublicKey(): Observable<{ publicKey: string }> {
    return this.http.get<{ publicKey: string }>(this.publicKeyUrl);
  }

  /** True when /login (or /verify-otp) returned an OTP_REQUIRED challenge instead of a token. */
  isOtpRequiredResponse(response: string): boolean {
    try {
      const parsed = JSON.parse(response);
      return parsed && parsed.status === 'OTP_REQUIRED';
    } catch {
      return false;
    }
  }

  private storeLoginToken(response: string): void {
    if (response.includes("updatepassword")) {
      console.log('Received token:', response);
      this.token = response.split("-")[1];
    } else {
      console.log('Received token:', response);
      this.token = response;
    }
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('jwtToken', this.token);
    }
    this.isLoggedIn = true;
  }

  sendOtp(sessionId: string, deliveryType: string): Observable<OtpActionResponse> {
    return this.http.post<OtpActionResponse>(this.sendOtpUrl, { sessionId, deliveryType });
  }

  resendOtp(sessionId: string): Observable<OtpActionResponse> {
    return this.http.post<OtpActionResponse>(this.resendOtpUrl, { sessionId });
  }

  verifyOtp(sessionId: string, otp: string): Observable<any> {
    return this.http.post(this.verifyOtpUrl, { sessionId, otp }, { responseType: 'text' }).pipe(
      tap(response => this.storeLoginToken(response))
    );
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return this.token || localStorage.getItem('jwtToken');
    }
    return null; // Return null for non-browser environments
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }

  // Method to logout
  logout(): void {
    // Fire while the token is still attached (tokenInterceptor reads it via getToken()) so the
    // server clears activeToken - best-effort, local session is cleared either way below.
    if (this.getToken()) {
      this.http.post(this.logoutUrl, {}).subscribe({ error: () => {} });
    }
    this.clearSession();
  }

  /**
   * Clears only the client-side session, without calling /logout. Used when the server has
   * already invalidated this token (e.g. a 401 from a superseded session) - the stale token's
   * signature is still otherwise valid, so calling /logout with it would clear activeToken for
   * whichever session currently owns it, which may be a newer login, not this one.
   */
  clearSession(): void {
    this.token = null;
    this.isLoggedIn = false;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('jwtToken');
    }
  }
  addRegisterUserDetails(token: String | any): Observable<User> {
    return this.http.post<User>(this.registeruserUrl, token);
  }


  // Notification related methods
  saveNotification(title: String, toUserId: number, toUserName: string, auditorId: number, CasoId: number): Observable<string> {
      const notificationBean = {
        id: 0,
        title: title,
        status: 0,
        createdOn: new Date().toISOString(), 
        isActive: 1,
        toUserId: toUserId,
        toUserName: toUserName,
        fromUserId: Number(this.globalUserId.getValue()), 
        fromUserName: this.globalUsername.getValue(),
        auditorId: auditorId,
	      casoId: CasoId
      };
      return this.http.post(this.saveNotificationUrl, notificationBean, { responseType: 'text' });
  }
  getNotificatinList():Observable<NotificationBean[]> {
        return this.http.get<NotificationBean[]>(this.notificationListUrl);
  }
  getAllNotificatinList(notification: NotificationBean):Observable<NotificationBean[]> {
        return this.http.get<NotificationBean[]>(this.allNotificationListUrl);
  }
  updateNotificatinList():Observable<NotificationBean[]> {
      return this.http.get<NotificationBean[]>(this.updateNotificationUrl);
  }
}
