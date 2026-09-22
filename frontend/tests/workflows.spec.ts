import { expect, test, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("admin@test.local");
  await page.getByLabel("Contraseña", { exact: true }).fill("TestAdmin123*");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Resumen general" })).toBeVisible();
}
async function selectEntity(page: Page, label: string, name: string) {
  const details = page.locator("details").filter({ has: page.getByLabel(label, { exact: true }) });
  await page.getByLabel(label, { exact: true }).click();
  await details.getByLabel("Buscar registros").fill(name);
  await details.getByRole("button", { name, exact: true }).click();
}

test("contact validation, single focus border and dismissible transient notifications", async ({
  page,
}, testInfo) => {
  await login(page);
  for (const [path, create] of [
    ["customers", "Nuevo cliente"],
    ["suppliers", "Nuevo proveedor"],
  ]) {
    await page.goto(`/${path}`);
    await page.getByRole("button", { name: create }).click();
    const phone = page.getByLabel("Teléfono", { exact: true });
    await phone.focus();
    await expect(phone).toHaveCSS("outline-style", "none");
    await expect(phone).toHaveCSS("box-shadow", "none");
    await expect(phone).toHaveCSS("border-width", "1px");
    await expect(phone).toHaveCSS("border-color", "rgb(24, 101, 79)");
    await phone.pressSequentially("abc9876543210");
    await expect(phone).toHaveValue("987654321");
    await phone.fill("12345678");
    await page.getByLabel("Nombre", { exact: true }).fill("   ");
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(phone).toHaveAttribute("aria-invalid", "true");
    await expect(
      page.getByText("El teléfono debe contener exactamente 9 dígitos.", { exact: true }),
    ).toBeVisible();
    await phone.focus();
    await phone.evaluate((input: HTMLInputElement) => input.select());
    await phone.evaluate((input) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData("text", "+51987654321");
      input.dispatchEvent(
        new ClipboardEvent("paste", { clipboardData, bubbles: true, cancelable: true }),
      );
    });
    await expect(phone).toHaveValue("12345678");
    await expect(page.getByText("Pega solo dígitos", { exact: false })).toBeVisible();
    await phone.fill("987654321");
    await page
      .getByLabel("Nombre", { exact: true })
      .fill(`Contacto ${path} ${testInfo.project.name}`);
    await page.screenshot({ path: testInfo.outputPath(`${path}-phone-focus.png`), fullPage: true });
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const toast = page.locator("[data-sonner-toast]").filter({ hasText: "Cambios guardados" });
    await expect(toast).toBeVisible();
    await expect(page.locator(".success-banner")).toHaveCount(0);
    if (path === "customers")
      await toast.getByRole("button", { name: "Cerrar notificación" }).click();
    else await page.mouse.move(0, 0);
    await expect(toast).toHaveCount(0, { timeout: 8000 });
  }
});

test("compact confirmations work across all catalogs and failed deletion can be dismissed", async ({
  page,
}, testInfo) => {
  await login(page);
  const token = await page.evaluate(() => sessionStorage.getItem("inventorypro.token"));
  const headers = { Authorization: `Bearer ${token}` };
  const suffix = testInfo.project.name;
  const category = await page.request.post("/api/categories", {
    headers,
    data: { name: `Confirmation parent ${suffix}` },
  });
  expect(category.status()).toBe(201);
  const categoryId = (await category.json()).id;
  for (const path of ["categories", "products", "suppliers", "customers", "users"]) {
    const name = `Confirm ${path} ${suffix}`;
    const data = {
      name,
      ...(path === "products" ? { sku: `CONFIRM-${suffix}`, price: 2.5, categoryId } : {}),
      ...(path === "users"
        ? { email: `confirm-${suffix}@test.local`, password: "ConfirmTest123*", role: "SELLER" }
        : {}),
    };
    const created = await page.request.post(`/api/${path}`, { headers, data });
    expect(created.status()).toBe(201);
    await page.goto(`/${path}`);
    await page.getByLabel("Buscar registros").fill(name);
    const trigger = page.getByRole("button", { name: `Desactivar ${name}`, exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: "Cancelar", exact: true })).toBeFocused();
    await expect(dialog.locator(".modal-header")).toHaveCSS("border-bottom-width", "0px");
    await expect(dialog.locator(".entity-form")).toHaveCount(0);
    const bounds = await dialog.boundingBox();
    expect(bounds!.height).toBeLessThan(260);
    expect(bounds!.width).toBeLessThanOrEqual(440);
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: testInfo.outputPath(`${path}-confirmation.png`),
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await trigger.click();
    await dialog.getByRole("button", { name: "Desactivar", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator("[data-sonner-toast]")).toContainText("Registro desactivado");
    await expect(trigger).toHaveCount(0);
  }
  await page.goto("/products");
  await page.getByLabel("Buscar registros").fill("Agua mineral");
  await page.getByRole("button", { name: "Desactivar Agua mineral 625 ml", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Desactivar", exact: true }).click();
  const failure = page.locator("[data-sonner-toast]").filter({ hasText: "todavía tiene stock" });
  await expect(failure).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
  await failure.getByRole("button", { name: "Cerrar notificación" }).click();
  await expect(failure).toHaveCount(0);
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
});
test("login, responsive dashboard and session restoration", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("admin@test.local");
  await page.getByLabel("Contraseña", { exact: true }).fill("incorrecta");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator("[data-sonner-toast]")).toContainText("no son correctos");
  await login(page);
  await expect(page.getByText("Productos activos", { exact: true })).toBeVisible();
  await expect(page.getByText("Cargando datos…")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("dashboard.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Resumen general" })).toBeVisible();
  expect(errors).toEqual([]);
});
test("category CRUD, validation feedback and dialog keyboard interaction", async ({
  page,
}, testInfo) => {
  await login(page);
  await page.goto("/categories");
  await page.getByRole("button", { name: "Nueva categoría" }).click();
  const name = `Categoría UI ${testInfo.project.name}`;
  await page.getByLabel("Nombre", { exact: true }).fill(name);
  await page
    .getByLabel("Descripción", { exact: true })
    .fill("Creada desde una prueba del navegador");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Buscar registros").fill(name);
  await expect(page.getByRole("cell", { name: name, exact: false }).first()).toBeVisible();
  await page.getByRole("button", { name: `Editar ${name}`, exact: true }).click();
  await page.getByLabel("Nombre", { exact: true }).fill(`${name} editada`);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: `Desactivar ${name} editada`, exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: `Desactivar ${name} editada`, exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Desactivar", exact: true }).click();
  await expect(page.getByText("No se encontraron coincidencias")).toBeVisible();
});

test("product form, inventory adjustment and profile editing", async ({ page }, testInfo) => {
  await login(page);
  await page.goto("/products");
  const name = `Producto UI ${testInfo.project.name}`;
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await page.getByLabel("Nombre", { exact: true }).fill(name);
  await page.getByLabel("SKU", { exact: true }).fill(`UI-${testInfo.project.name}`);
  await page.getByLabel("Precio de venta (S/)").fill("12.50");
  await page.getByLabel("Stock mínimo").fill("8");
  await selectEntity(page, "Categoría", "Bebidas");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Buscar registros").fill(name);
  await expect(page.getByRole("row").filter({ hasText: name })).toContainText("Sin stock");
  await page.goto("/movements");
  await page.getByRole("button", { name: "Ajustar stock" }).click();
  await selectEntity(page, "Producto", name);
  await page.getByLabel("Stock contado").fill("4");
  await page.getByLabel("Motivo del ajuste").fill("Conteo físico de prueba UI");
  await page.getByRole("button", { name: "Confirmar ajuste" }).click();
  await expect(page.locator("[data-sonner-toast]")).toContainText("Ajuste registrado");
  await page.goto("/products");
  await page.getByLabel("Buscar registros").fill(name);
  await expect(page.getByRole("row").filter({ hasText: name })).toContainText("4 uds.");
  await page.getByRole("button", { name: `Editar ${name}`, exact: true }).click();
  await expect(page.getByLabel("Stock mínimo")).toHaveValue("8");
  await page.keyboard.press("Escape");
  await page.goto("/users");
  await page.getByRole("button", { name: "Editar Demo Admin", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Rol", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("[data-sonner-toast]")).toContainText("Cambios guardados");
});

test("seller navigation agrees with server permissions and expires invalid sessions", async ({
  page,
}, testInfo) => {
  await login(page);
  const token = await page.evaluate(() => sessionStorage.getItem("inventorypro.token"));
  const email = `ui-seller-${testInfo.project.name}@test.local`;
  const created = await page.request.post("/api/users", {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: "Vendedor UI", email, password: "SellerTest123*", role: "SELLER" },
  });
  expect(created.status()).toBe(201);
  await page.evaluate(() => sessionStorage.clear());
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("SellerTest123*");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ventas", exact: true })).toBeVisible();
  await page.goto("/users");
  await expect(page).toHaveURL(/products/);
  await expect(page.getByRole("button", { name: "Nuevo producto" })).toHaveCount(0);
  await page.goto("/customers");
  await expect(page.getByRole("button", { name: "Nuevo cliente" })).toBeVisible();
  await page.evaluate(() => sessionStorage.setItem("inventorypro.token", "invalid-token"));
  await page.reload();
  await expect(page).toHaveURL(/login/);
});
test("purchase and sale update inventory through the real API", async ({ page }, testInfo) => {
  await login(page);
  await page.goto("/purchases");
  const token = await page.evaluate(() => sessionStorage.getItem("inventorypro.token"));
  const initial = await page.request.get("/api/products?q=BEB-AGUA", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const initialStock = (await initial.json()).data[0].stock;
  await page.getByRole("button", { name: "Nueva compra" }).click();
  await selectEntity(page, "Proveedor", "Distribuidora Central");
  await selectEntity(page, "Producto", "Agua mineral 625 ml");
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await page.getByLabel("Cantidad de Agua mineral 625 ml").fill("5");
  await page.getByLabel("Costo de Agua mineral 625 ml").fill("1.20");
  await page.screenshot({ path: testInfo.outputPath("purchase-form.png"), fullPage: true });
  await page.getByRole("button", { name: "Revisar compra" }).click();
  await page.getByRole("button", { name: "Confirmar compra", exact: true }).click();
  await expect(page.locator("[data-sonner-toast]")).toContainText("Compra registrada");
  await page.goto("/sales");
  await page.getByRole("button", { name: "Nueva venta" }).click();
  await selectEntity(page, "Producto", "Agua mineral 625 ml");
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await page.getByLabel("Cantidad de Agua mineral 625 ml").fill("2");
  await page.getByRole("button", { name: "Revisar venta" }).click();
  await page.getByRole("button", { name: "Confirmar venta", exact: true }).click();
  await expect(page.locator("[data-sonner-toast]")).toContainText("Venta registrada");
  await page.goto("/products");
  await page.getByLabel("Buscar registros").fill("Agua mineral");
  const row = page.getByRole("row").filter({ hasText: "Agua mineral 625 ml" });
  const expectedStock = initialStock + 3;
  await expect(row).toContainText(`${expectedStock} uds.`);
});
test("all screens render and mobile navigation opens and closes", async ({ page }, testInfo) => {
  await login(page);
  for (const [path, title] of [
    ["products", "Productos"],
    ["suppliers", "Proveedores"],
    ["customers", "Clientes"],
    ["users", "Usuarios"],
    ["movements", "Movimientos"],
    ["reports", "Reportes"],
  ]) {
    await page.goto(`/${path}`);
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.getByText("Cargando datos…")).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.goto("/products");
  await page.getByLabel("Buscar registros").fill("nombre que no existe");
  await expect(page.getByText("No se encontraron coincidencias")).toBeVisible();
  await page.getByRole("button", { name: "Limpiar búsqueda" }).click();
  await expect(page.getByRole("row").filter({ hasText: "Agua mineral 625 ml" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("products.png"), fullPage: true });
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.getByRole("navigation")).toBeInViewport();
  }
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  await page.goto("/users");
  await expect(page).toHaveURL(/login/);
});
