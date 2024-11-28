import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

describe('StorageService', () => {
  let service: StorageService;
  let mockLocalStorage: any;
  const mockKey = 'token';
  const mockValue = 'mock-token';

  beforeEach(() => {
    // Mock com armazenamento interno para simular o localStorage real
    mockLocalStorage = (() => {
      let store: { [key: string]: string | null } = {};
      return {
        getItem: jasmine.createSpy('getItem').and.callFake((key: string) => store[key] || null),
        setItem: jasmine.createSpy('setItem').and.callFake((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: jasmine.createSpy('removeItem').and.callFake((key: string) => {
          delete store[key];
        }),
        clear: jasmine.createSpy('clear').and.callFake(() => {
          store = {};
        }),
      };
    })();

    TestBed.configureTestingModule({
      providers: [
        StorageService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: Storage, useValue: mockLocalStorage },
      ],
    });

    service = TestBed.inject(StorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store an item in localStorage', () => {
    service.setItem(mockKey, mockValue);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(mockKey, mockValue);
  });

  it('should get an item from localStorage', () => {
    mockLocalStorage.setItem(mockKey, mockValue); // Define o valor manualmente
    const result = service.getItem(mockKey);
    expect(result).toBe(mockValue);
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith(mockKey);
  });

  it('should return null if item does not exist in localStorage', () => {
    const result = service.getItem(mockKey);
    expect(result).toBeNull();
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith(mockKey);
  });

  it('should remove an item from localStorage', () => {
    service.removeItem(mockKey);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(mockKey);
  });

  it('should clear all items in localStorage', () => {
    service.clear();
    expect(mockLocalStorage.clear).toHaveBeenCalled();
  });

  it('should get the token from localStorage', () => {
    mockLocalStorage.setItem('token', mockValue); // Define o valor manualmente
    const token = service.getToken();
    expect(token).toBe(mockValue);
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
  });

  it('should set the token in localStorage', () => {
    service.setToken(mockValue);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', mockValue);
  });

  it('should remove the token from localStorage', () => {
    service.removeToken();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
  });

  it('should verify browser environment for localStorage access', () => {
    const platformId = TestBed.inject(PLATFORM_ID);
    expect(isPlatformBrowser(platformId)).toBeTrue();
  });
});
