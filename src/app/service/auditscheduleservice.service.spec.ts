import { TestBed } from '@angular/core/testing';

import { AuditscheduleserviceService } from './auditscheduleservice.service';

describe('AuditscheduleserviceService', () => {
  let service: AuditscheduleserviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuditscheduleserviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
