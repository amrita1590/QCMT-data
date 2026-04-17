import { TestBed } from '@angular/core/testing';

import { AuditorsService } from './auditors.service';

describe('AuditorsService', () => {
  let service: AuditorsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuditorsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
