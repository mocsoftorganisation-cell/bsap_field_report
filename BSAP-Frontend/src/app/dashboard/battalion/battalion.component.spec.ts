import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BattalionComponent } from './battalion.component';

describe('BattalionComponent', () => {
  let component: BattalionComponent;
  let fixture: ComponentFixture<BattalionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BattalionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BattalionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
