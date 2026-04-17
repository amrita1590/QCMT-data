import { TestBed } from '@angular/core/testing';

import { ClassdetailsService } from './classdetails.service';

describe('ClassdetailsService', () => {
  let service: ClassdetailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClassdetailsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
