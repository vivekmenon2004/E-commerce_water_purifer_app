declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css';

// Allow <iframe> JSX on web (React Native Web + Expo Web)
declare namespace JSX {
  interface IntrinsicElements {
    iframe: React.DetailedHTMLProps<React.IframeHTMLAttributes<HTMLIFrameElement>, HTMLIFrameElement>;
  }
}
