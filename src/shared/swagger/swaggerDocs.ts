import type { RequestHandler } from "express";
import swaggerUi from "swagger-ui-express";

const SWAGGER_UI_DIST_CDN = "https://unpkg.com/swagger-ui-dist@5.32.5";

const CDN_HTML_PATCHES: Array<[RegExp, string]> = [
  [/href="\.\/swagger-ui\.css"/, `href="${SWAGGER_UI_DIST_CDN}/swagger-ui.css"`],
  [/src="\.\/swagger-ui-bundle\.js"/, `src="${SWAGGER_UI_DIST_CDN}/swagger-ui-bundle.js"`],
  [/src="\.\/swagger-ui-standalone-preset\.js"/, `src="${SWAGGER_UI_DIST_CDN}/swagger-ui-standalone-preset.js"`],
];

type SwaggerUiWithGenerate = typeof swaggerUi & {
  generateHTML: (
    swaggerDoc: object,
    opts?: {
      explorer?: boolean;
      swaggerOptions?: Record<string, unknown>;
      customSiteTitle?: string;
    },
  ) => string;
  serve: RequestHandler[];
};

function getSwaggerUi(): SwaggerUiWithGenerate {
  return swaggerUi as unknown as SwaggerUiWithGenerate;
}

export function buildSwaggerIndexHtml(
  swaggerDocument: object,
  options: {
    title: string;
    explorer?: boolean;
    swaggerOptions?: Record<string, unknown>;
  },
): string {
  const sui = getSwaggerUi();
  const raw = sui.generateHTML(swaggerDocument, {
    explorer: options.explorer ?? true,
    swaggerOptions: options.swaggerOptions ?? {},
    customSiteTitle: options.title,
  });
  return CDN_HTML_PATCHES.reduce((html, [re, repl]) => html.replace(re, repl), raw);
}

export function swaggerUiInitMiddleware(): RequestHandler {
  const sui = getSwaggerUi();
  return sui.serve[0];
}

export function swaggerUiIndexHtmlHandler(html: string): RequestHandler {
  return (req, res, next) => {
    const pathOnly = (req.originalUrl ?? "").split("?")[0];
    if (/\.[a-z0-9]+$/i.test(pathOnly)) {
      next();
      return;
    }
    res.type("html").send(html);
  };
}
