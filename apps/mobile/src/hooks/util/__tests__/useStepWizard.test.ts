/**
 * Unit tests for useStepWizard — zero mocks required, pure state logic.
 */
import { act, renderHook } from '@testing-library/react-native';

import { useStepWizard } from '../useStepWizard';

describe('useStepWizard', () => {
  describe('initial state', () => {
    it('starts at step 0 by default', () => {
      const { result } = renderHook(() => useStepWizard({ totalSteps: 4 }));
      expect(result.current.currentStep).toBe(0);
    });

    it('starts at the specified initialStep', () => {
      const { result } = renderHook(() =>
        useStepWizard({ totalSteps: 4, initialStep: 2 }),
      );
      expect(result.current.currentStep).toBe(2);
    });

    it('exposes totalSteps', () => {
      const { result } = renderHook(() => useStepWizard({ totalSteps: 3 }));
      expect(result.current.totalSteps).toBe(3);
    });
  });

  describe('derived flags', () => {
    it('isFirstStep is true on step 0', () => {
      const { result } = renderHook(() => useStepWizard({ totalSteps: 3 }));
      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.canGoBack).toBe(false);
    });

    it('isLastStep is true on the final step', () => {
      const { result } = renderHook(() =>
        useStepWizard({ totalSteps: 3, initialStep: 2 }),
      );
      expect(result.current.isLastStep).toBe(true);
      expect(result.current.canGoNext).toBe(false);
    });

    it('canGoBack is true when not on first step', () => {
      const { result } = renderHook(() =>
        useStepWizard({ totalSteps: 3, initialStep: 1 }),
      );
      expect(result.current.canGoBack).toBe(true);
    });

    it('canGoNext is true when not on last step', () => {
      const { result } = renderHook(() => useStepWizard({ totalSteps: 3 }));
      expect(result.current.canGoNext).toBe(true);
    });
  });

  describe('progress', () => {
    it('is 33% on step 0 of 3', () => {
      const { result } = renderHook(() => useStepWizard({ totalSteps: 3 }));
      expect(result.current.progress).toBeCloseTo(33.33, 1);
    });

    it('is 100% on the last step', () => {
      const { result } = renderHook(() =>
        useStepWizard({ totalSteps: 4, initialStep: 3 }),
      );
      expect(result.current.progress).toBe(100);
    });
  });

  describe('goNext', () => {
    it('increments currentStep by 1', () => {
      const { result } = renderHook(() => useStepWizard({ totalSteps: 4 }));
      act(() => result.current.goNext());
      expect(result.current.currentStep).toBe(1);
    });

    it('does not exceed the last step', () => {
      const { result } = renderHook(() =>
        useStepWizard({ totalSteps: 3, initialStep: 2 }),
      );
      act(() => result.current.goNext());
      expect(result.current.currentStep).toBe(2);
    });
  });

  describe('goBack', () => {
    it('decrements currentStep by 1', () => {
      const { result } = renderHook(() =>
        useStepWizard({ totalSteps: 4, initialStep: 2 }),
      );
      act(() => result.current.goBack());
      expect(result.current.currentStep).toBe(1);
    });

    it('does not go below 0', () => {
      const { result } = renderHook(() => useStepWizard({ totalSteps: 3 }));
      act(() => result.current.goBack());
      expect(result.current.currentStep).toBe(0);
    });
  });

  describe('goToStep', () => {
    it('jumps to an arbitrary step', () => {
      const { result } = renderHook(() => useStepWizard({ totalSteps: 5 }));
      act(() => result.current.goToStep(3));
      expect(result.current.currentStep).toBe(3);
    });

    it('clamps to 0 when given a negative value', () => {
      const { result } = renderHook(() => useStepWizard({ totalSteps: 3 }));
      act(() => result.current.goToStep(-5));
      expect(result.current.currentStep).toBe(0);
    });

    it('clamps to last step when value exceeds totalSteps', () => {
      const { result } = renderHook(() => useStepWizard({ totalSteps: 3 }));
      act(() => result.current.goToStep(99));
      expect(result.current.currentStep).toBe(2);
    });
  });

  describe('reset', () => {
    it('returns to initialStep (default 0)', () => {
      const { result } = renderHook(() => useStepWizard({ totalSteps: 4 }));
      act(() => result.current.goToStep(3));
      act(() => result.current.reset());
      expect(result.current.currentStep).toBe(0);
    });

    it('returns to specified initialStep', () => {
      const { result } = renderHook(() =>
        useStepWizard({ totalSteps: 4, initialStep: 1 }),
      );
      act(() => result.current.goToStep(3));
      act(() => result.current.reset());
      expect(result.current.currentStep).toBe(1);
    });
  });

  describe('full wizard flow', () => {
    it('advances from first to last step and back', () => {
      const { result } = renderHook(() => useStepWizard({ totalSteps: 3 }));

      expect(result.current.isFirstStep).toBe(true);

      act(() => result.current.goNext());
      expect(result.current.currentStep).toBe(1);
      expect(result.current.isFirstStep).toBe(false);
      expect(result.current.isLastStep).toBe(false);

      act(() => result.current.goNext());
      expect(result.current.currentStep).toBe(2);
      expect(result.current.isLastStep).toBe(true);

      act(() => result.current.goBack());
      expect(result.current.currentStep).toBe(1);
    });
  });
});
