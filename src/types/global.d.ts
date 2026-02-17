// Global type augmentations for experimental/legacy APIs

export {};

declare global {
  interface VisualViewport extends EventTarget {
    offsetLeft: number;
    offsetTop: number;
    pageLeft: number;
    pageTop: number;
    width: number;
    height: number;
    scale: number;
    getWindowSegments?(): { x: number; y: number; width: number; height: number }[];
  }

  interface DevicePosture extends EventTarget {
    type: 'continuous' | 'folded';
  }

  interface Navigator {
    msMaxTouchPoints?: number;
    devicePosture?: DevicePosture;
  }

  interface Window {
    visualViewport?: VisualViewport;
  }
}
