declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      src?: string;
      alt?: string;
      ar?: boolean;
      'ar-modes'?: string;
      'camera-controls'?: boolean;
      'auto-rotate'?: boolean;
      'shadow-intensity'?: string;
      'environment-image'?: string;
      'exposure'?: string;
      'poster'?: string;
      'reveal'?: 'auto' | 'interaction' | 'manual';
      'loading'?: 'auto' | 'lazy' | 'eager';
      'camera-orbit'?: string;
      'camera-target'?: string;
      'field-of-view'?: string;
      'min-camera-orbit'?: string;
      'max-camera-orbit'?: string;
      'min-field-of-view'?: string;
      'max-field-of-view'?: string;
      'interaction-prompt'?: string;
      'interaction-prompt-threshold'?: string;
      'ar-scale'?: string;
      'ar-placement'?: string;
      'ios-src'?: string;
      'xr-environment'?: boolean;
      style?: React.CSSProperties;
      ref?: React.Ref<HTMLElement>;
    };
  }
}