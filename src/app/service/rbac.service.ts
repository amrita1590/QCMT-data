import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Role } from '../interface/Role';
import { HttpClient } from '@angular/common/http';
import { Permissions } from '../interface/Permissions';

@Injectable({
  providedIn: 'root'
})
export class RbacService {

  private saveRoleUrl ='/v1/qcmt/rbac/saverolemaster';
  private getRoleDetailsUrl ='/v1/qcmt/rbac/getroledetails';
  private getRoleUrl ='/v1/qcmt/rbac/getrole';
  private deleteRoleUrl ='/v1/qcmt/rbac/deleterole';

  private savePermissionUrl ='/v1/qcmt/rbac/savepermissionmaster';
  private getPermissionDetailsUrl ='/v1/qcmt/rbac/getpermissiondetails';
  private getPermissionUrl ='/v1/qcmt/rbac/getpermission';
  private deletePermissionUrl ='/v1/qcmt/rbac/deletepermission';

  private getAssignedPermissionUrl ='/v1/qcmt/rbac/getassignedpermission';
  private saveAssignedPermissionUrl ='/v1/qcmt/rbac/saveassignedpermission';

  private roleDataSource = new BehaviorSubject<Role | null>(null);
  currentRoleData = this.roleDataSource.asObservable();
  
  private refreshListSource = new Subject<void>();
  refreshList$ = this.refreshListSource.asObservable();

  private refreshPermissionListSource = new Subject<void>();
  refreshPermissionList$ = this.refreshPermissionListSource.asObservable();

  private permissionDataSource = new BehaviorSubject<Permissions | null>(null);
  currentPermissionData = this.permissionDataSource.asObservable();

  triggerRefresh() {
    this.refreshListSource.next();
  }

  constructor(private http: HttpClient) { 
     console.log("Inside RBAC Details Service !!");
  }

  setRoleData(data: Role) {
    this.roleDataSource.next(data);
  }

  clearRoleData() {
    this.roleDataSource.next(null);
  }

  getRoleDetails():Observable<Role[]> {
      return this.http.get<Role[]>(this.getRoleDetailsUrl);
  }

  saveRoleDetails(roleDetails: Role):Observable<any> {
     return this.http.post(this.saveRoleUrl, roleDetails, { responseType: 'text' });
  }

  editRoleDetails(id: number):Observable<Role> {
    console.log("Inside Role Details Service ::");
    return this.http.get<Role>(this.getRoleUrl+"/"+id);
  }

  deleteRoleDetails(id: number):Observable<any> {
    console.log("Inside Role Details Service ::");
    return this.http.delete(this.deleteRoleUrl+"/"+id, { responseType: 'text' });
  }

  triggerPermissionRefresh() {
    this.refreshListSource.next();
  }

  setPermissionData(data: Permissions) {
    this.permissionDataSource.next(data);
  }

  clearPermissionData() {
    this.permissionDataSource.next(null);
  }

  getPermissionDetails():Observable<Permissions[]> {
      return this.http.get<Permissions[]>(this.getPermissionDetailsUrl);
  }

  savePermissionDetails(permissionDetails: Permissions):Observable<any> {
      console.log("Inside Permission Details Service ::");
      return this.http.post(this.savePermissionUrl, permissionDetails, { responseType: 'text' });
  }

  editPermissionDetails(id: number):Observable<Permissions> {
    console.log("Inside Role Details Service ::");
    return this.http.get<Permissions>(this.getPermissionUrl+"/"+id);
  }

  deletePermissionDetails(id: number):Observable<any> {
    console.log("Inside Permission Details Service ::");
    return this.http.delete(this.deletePermissionUrl+"/"+id, { responseType: 'text' });
  }

  getAssignedPermission(id: String):Observable<Permissions[]> {
    console.log("Inside Role Details Service ::");
    return this.http.get<Permissions[]>(this.getAssignedPermissionUrl+"/"+id);
  }

  saveAssignedPermission(roleMaster: Role | undefined):Observable<any> {
      console.log("Inside Permission Details Service ::", roleMaster);
      return this.http.post(this.saveAssignedPermissionUrl, roleMaster, { responseType: 'text' });
  }

}
