// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { UsermanagementService } from './usermanagement.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private umService: UsermanagementService, private router: Router) {}
  
  canActivate(
    next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
      console.log("Inside Auth Guard Service");
      const isAuthenticated = this.umService.getToken() !== null;
      console.log("Inside Auth Guard Service AUTH AUTH::"+isAuthenticated);
      if (!isAuthenticated) {
        this.router.navigate(['/login']);
        return false;
      }    
      return true;
  }
}
