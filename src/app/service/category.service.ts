import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { CategoryDetails } from '../interface/CategoryDetails';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private token: any | null = null;
  private saveCategoryUrl ='/v1/qcmt/master/savecategorydetails';
  private getCategoryDetailsUrl ='/v1/qcmt/master/getcategorydetails';
  private getCategoryUrl ='/v1/qcmt/master/getcategorydetails';
  private deleteCategoryUrl ='/v1/qcmt/master/deletecategorydetails';

  private categoryDataSource = new BehaviorSubject<CategoryDetails | null>(null);
  currentCategoryData = this.categoryDataSource.asObservable();
  private refreshListSource = new Subject<void>();
  refreshList$ = this.refreshListSource.asObservable();

  triggerRefresh() {
    this.refreshListSource.next();
  }

  constructor(private http: HttpClient) { 
     console.log("Inside Unit Details Service !!");
  }

  setCategoryData(data: CategoryDetails) {
    this.categoryDataSource.next(data);
  }

  clearCategoryData() {
    this.categoryDataSource.next(null);
  }

  getCategoryDetails():Observable<CategoryDetails[]> {
      return this.http.get<CategoryDetails[]>(this.getCategoryDetailsUrl);
  }

  saveCategoryDetails(categoryDetails: CategoryDetails):Observable<any> {
      console.log("Inside Category Details Service ::");
      return this.http.post(this.saveCategoryUrl, categoryDetails, { responseType: 'text' });
  }

  editCategoryDetails(id: number):Observable<CategoryDetails> {
    console.log("Inside Category Details Service ::");
    return this.http.get<CategoryDetails>(this.getCategoryUrl+"/"+id);
  }

  deleteCategoryDetails(id: number):Observable<any> {
    console.log("Inside Category Details Service ::");
    return this.http.delete(this.deleteCategoryUrl+"/"+id, { responseType: 'text' });
  }
}
