import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AddDialogComponent } from './add-dialog';
import { AgentService, DiscoveredAgentCard } from '../../services/agent.service';
import { AgentRegistrationDraftService } from '../../services/agent-registration-draft.service';
import { ToastService } from '@web/shared-ui';

describe('AddDialogComponent (Dynamic Agent Registration)', () => {
  let component: AddDialogComponent;
  let fixture: ComponentFixture<AddDialogComponent>;
  let agentService: AgentService;
  let draftService: AgentRegistrationDraftService;
  let toastService: ToastService;

  const mockCard: DiscoveredAgentCard = {
    name: 'Sentinel Security Agent',
    description: 'Autonomous security scanner.',
    version: '1.2.0',
    protocolVersion: 'A2A/2.0',
    agentType: 'A2A',
    authMode: 'API Key',
    tags: ['Security', 'Audit'],
    capabilities: [
      {
        name: 'scan_vulnerabilities',
        description: 'Scan code for CVEs.',
        parameters: [],
        returns: 'ScanResult',
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDialogComponent],
      providers: [AgentService, AgentRegistrationDraftService, ToastService],
    }).compileComponents();

    agentService = TestBed.inject(AgentService);
    draftService = TestBed.inject(AgentRegistrationDraftService);
    toastService = TestBed.inject(ToastService);

    fixture = TestBed.createComponent(AddDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create AddDialogComponent', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(false);
  });

  it('should open dialog and load draft from storage', () => {
    jest.spyOn(draftService, 'loadDraft').mockReturnValue({
      endpointUrl: 'https://api.test.dev/agent',
      authMode: 'None',
      visibility: 'public',
    });

    component.open();

    expect(component.isOpen()).toBe(true);
    expect(component.endpointUrl).toBe('https://api.test.dev/agent');
    expect(component.authMode).toBe('None');
    expect(component.discoveredCard()).toBeNull();
  });

  it('should apply preset and trigger ping', () => {
    const pingSpy = jest.spyOn(component, 'pingAgent');
    component.applyPreset('https://api.sentinel-agent.dev/v1/agent');
    expect(component.endpointUrl).toBe('https://api.sentinel-agent.dev/v1/agent');
    expect(pingSpy).toHaveBeenCalled();
  });

  it('should ping agent card and populate discovered details', () => {
    component.endpointUrl = 'https://api.sentinel-agent.dev/v1/agent';
    component.authMode = 'None';

    jest.spyOn(agentService, 'pingAgentCard').mockReturnValue(of(mockCard));
    const toastSpy = jest.spyOn(toastService, 'show');

    component.pingAgent();

    expect(component.isPinging()).toBe(false);
    expect(component.discoveredCard()).toEqual(mockCard);
    expect(component.name).toBe('Sentinel Security Agent');
    expect(component.customName).toBe('Sentinel Security Agent');
    expect(component.customDescription).toBe('Autonomous security scanner.');
    expect(toastSpy).toHaveBeenCalledWith('Agent card "Sentinel Security Agent" verified!', 'success');
  });

  it('should allow user to enter custom name and reset using useDiscoveredName', () => {
    component.name = 'My Custom Sentinel';
    component.useDiscoveredName('Card Discovered Name');
    expect(component.name).toBe('Card Discovered Name');
    expect(component.customName).toBe('Card Discovered Name');
  });

  it('should handle ping failure gracefully', () => {
    component.endpointUrl = 'https://api.broken.dev/agent';
    jest.spyOn(agentService, 'pingAgentCard').mockReturnValue(throwError(() => new Error('Connection timed out')));
    const toastSpy = jest.spyOn(toastService, 'show');

    component.pingAgent();

    expect(component.isPinging()).toBe(false);
    expect(component.discoveredCard()).toBeNull();
    expect(component.pingError()).toBe('Connection timed out');
    expect(toastSpy).toHaveBeenCalledWith('Failed to discover Agent Card.', 'error');
  });

  it('should register agent dynamically and clear draft', () => {
    component.endpointUrl = 'https://api.sentinel-agent.dev/v1/agent';
    component.name = 'Custom Agent Name';
    component.discoveredCard.set(mockCard);

    const dynamicRegisterSpy = jest.spyOn(agentService, 'dynamicRegisterAgent');
    const clearDraftSpy = jest.spyOn(draftService, 'clearDraft');
    const toastSpy = jest.spyOn(toastService, 'show');
    const closeSpy = jest.spyOn(component, 'close');

    component.register();

    expect(dynamicRegisterSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        customName: 'Custom Agent Name',
      })
    );
    expect(clearDraftSpy).toHaveBeenCalled();
    expect(toastSpy).toHaveBeenCalledWith('Agent "Custom Agent Name" registered to Janus!', 'success');
    expect(closeSpy).toHaveBeenCalled();
  });
});
