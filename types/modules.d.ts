declare module "html-to-docx" {
  interface HtmlToDocxOptions {
    table?: { row?: { cantSplit?: boolean } };
    footer?: boolean;
    pageNumber?: boolean;
    [key: string]: unknown;
  }

  export default function HTMLtoDOCX(
    htmlString: string,
    headerHTMLString?: string | null,
    options?: HtmlToDocxOptions
  ): Promise<Buffer | ArrayBuffer>;
}

declare module "html-to-text" {
  interface HtmlToTextOptions {
    wordwrap?: number | false;
    [key: string]: unknown;
  }

  export function convert(html: string, options?: HtmlToTextOptions): string;
}