// Global type augmentations for experimental APIs

export {};

declare global {
  interface VisualViewport {
    /**
     * Experimental: Window Segments API for dual-screen/foldable devices.
     * Returns an array of rectangles representing the window segments.
     */
    getWindowSegments(): { x: number; y: number; width: number; height: number }[];
  }

  interface Navigator {
    /**
     * Experimental: Device Posture API for foldable devices.
     */
    devicePosture?: {
      type: 'folded' | 'continuous';
      addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
      removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
    };

    /**
     * Non-standard: Microsoft-specific touch points property (IE10/11/Edge Legacy).
     */
    msMaxTouchPoints?: number;
  }
}
