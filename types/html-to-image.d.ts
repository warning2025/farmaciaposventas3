declare module 'html-to-image' {
  export function toPng(node: HTMLElement, options?: { backgroundColor?: string; width?: number; height?: number; }): Promise<string>;
  export function toSvg(node: HTMLElement, options?: { backgroundColor?: string; width?: number; height?: number; }): Promise<string>;
  export function toJpeg(node: HTMLElement, options?: { backgroundColor?: string; width?: number; height?: number; quality?: number; }): Promise<string>;
  export function toBlob(node: HTMLElement, options?: { backgroundColor?: string; width?: number; height?: number; }): Promise<Blob | null>;
  export function toPixelData(node: HTMLElement, options?: { backgroundColor?: string; width?: number; height?: number; }): Promise<Uint8ClampedArray>;
}
