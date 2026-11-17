import { describe, expect, it } from "vitest";
import { ERROR_MAP, getErrorMessage } from "./errorMessages";
import { problemasTextoWeb } from "./reglasTextoWeb";

describe("getErrorMessage y ERROR_MAP (DE.3 y DE.4.4)", () => {
  const FALLBACK_META = "No se pudo eliminar la meta. Probá de nuevo.";

  it("muestra data.error.message cuando cumple las reglas", () => {
    const err = {
      response: {
        status: 404,
        data: {
          success: false,
          error: { code: "NOT_FOUND", message: "No se encontró esa meta." },
        },
      },
    };
    expect(getErrorMessage(err, FALLBACK_META)).toBe("No se encontró esa meta.");
  });

  it("devuelve el fallback si data.error.message no cumple las reglas", () => {
    const err = {
      response: {
        status: 404,
        data: { error: { message: "Billetera no encontrada" } },
      },
    };
    expect(getErrorMessage(err, FALLBACK_META)).toBe(FALLBACK_META);
  });

  it("traduce una validación Pydantic en inglés usando ERROR_MAP", () => {
    const err = {
      response: {
        status: 422,
        data: { detail: [{ msg: "Input should be greater than 0" }] },
      },
    };
    expect(getErrorMessage(err, "X.")).toBe(
      ERROR_MAP["Input should be greater than 0"]
    );
  });

  it("limpia el prefijo 'Value error, ' cuando el texto cumple las reglas", () => {
    const err = {
      response: {
        status: 422,
        data: { detail: [{ msg: "Value error, Elegí una categoría." }] },
      },
    };
    expect(getErrorMessage(err, "X.")).toBe("Elegí una categoría.");
  });

  it("traduce detail 'Not Found' usando ERROR_MAP", () => {
    const err = {
      response: {
        status: 404,
        data: { detail: "Not Found" },
      },
    };
    expect(getErrorMessage(err, "X.")).toBe(ERROR_MAP["Not Found"]);
  });

  it("devuelve el fallback cuando no hay response (error de red)", () => {
    expect(getErrorMessage({ message: "Network Error" }, FALLBACK_META)).toBe(
      FALLBACK_META
    );
  });

  it("devuelve el fallback por defecto sin response ni fallback", () => {
    expect(getErrorMessage({ message: "Network Error" })).toBe(
      "Algo salió mal. Probá de nuevo."
    );
  });

  it("devuelve el fallback cuando el error es null", () => {
    expect(getErrorMessage(null, FALLBACK_META)).toBe(FALLBACK_META);
  });

  it("cada valor de ERROR_MAP cumple problemasTextoWeb y ninguna clave lo cumple", () => {
    for (const [clave, valor] of Object.entries(ERROR_MAP)) {
      expect(problemasTextoWeb(valor), `Valor inválido para "${clave}": ${valor}`).toEqual([]);
      expect(
        problemasTextoWeb(clave).length,
        `La clave "${clave}" ya cumple las reglas y no debe estar en ERROR_MAP`
      ).toBeGreaterThan(0);
    }
  });

  it("deja pasar ACCOUNT_SUSPENDED con mail de contacto", () => {
    const textoCuentaSuspendida =
      "Tu cuenta está suspendida. Si creés que es un error, " +
      "escribí a srlargentum@gmail.com.";
    const err = {
      response: {
        status: 403,
        data: {
          success: false,
          error: {
            code: "ACCOUNT_SUSPENDED",
            message: textoCuentaSuspendida,
          },
        },
      },
    };
    expect(getErrorMessage(err, "X.")).toBe(textoCuentaSuspendida);
  });

  it("devuelve el texto sin primera persona ante status 500 sin data", () => {
    const err = {
      response: {
        status: 500,
      },
    };
    expect(getErrorMessage(err, "X.")).toBe(
      "Algo salió mal. Probá de nuevo en unos minutos."
    );
  });
});
