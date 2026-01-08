import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunicationMessageComponent } from './communication-message.component';

describe('CommunicationMessageComponent', () => {
  let component: CommunicationMessageComponent;
  let fixture: ComponentFixture<CommunicationMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunicationMessageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CommunicationMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
