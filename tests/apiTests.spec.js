import { test, expect, request } from "@playwright/test";

test.describe("API Tests- endpoints", () => {
  test.skip("commodity API returns valid response", async ({ request }) => {
    const id = "0409000010"; // which commodity id do you want to search
    const response = await request.get("/api/v2/commodities/" + id);
    //console.log(await response.json());
    const data = await response.json();

    expect(response.status()).toBe(200); // response validation
    expect(data.data.attributes.goods_nomenclature_item_id).toBe("0409000010"); // data validation
  });

  test.skip("geographical_areas API returns correct country description for GB", async ({
    request,
  }) => {
    const countriesId = "GB"; // which countries id do you want to search
    const response = await request.get(
      "/api/v2/geographical_areas/" + countriesId
    );
    //console.log(await response.json());
    const data = await response.json();

    expect(response.status()).toBe(200); // response validation
    expect(data.data.attributes.description).toBe("United Kingdom"); // data validation
  });

  test("quota API returns correct quota_order_number_id", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/v2/quotas/search?goods_nomenclature_item_id=0885102200"
    );
    const data = await response.json();

    expect(response.status()).toBe(200);

    // One-step check on a key field from the first item
    expect(data.data[0].attributes.quota_order_number_id).toBe("091787");
  });


});
