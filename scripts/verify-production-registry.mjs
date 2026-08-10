const configuredBaseUrl =
  process.argv[2] ?? process.env.REGISTRY_BASE_URL ?? "http://localhost:3000";
const baseUrl = new URL(configuredBaseUrl);
const failures = [];

async function fetchJson(pathname) {
  const url = new URL(pathname, baseUrl);
  const response = await fetch(url, { redirect: "follow" });
  let data;

  try {
    data = await response.json();
  } catch {
    failures.push(`${pathname}: response was not valid JSON`);
  }

  if (!/^application\/json\b/i.test(response.headers.get("content-type") ?? "")) {
    failures.push(`${pathname}: response was not application/json`);
  }

  return { data, status: response.status };
}

let indexResponse;
try {
  indexResponse = await fetchJson("/r/index.json");
} catch (error) {
  console.error(
    `Could not reach ${baseUrl.href}: ${
      error instanceof Error ? error.message : error
    }`,
  );
  process.exit(1);
}

if (indexResponse.status !== 200) {
  failures.push(`/r/index.json: returned ${indexResponse.status}`);
}

if (!Array.isArray(indexResponse.data)) {
  failures.push("/r/index.json: expected an array of registry items");
} else {
  const names = indexResponse.data.map((item) => item?.name);
  const uniqueNames = new Set(names);

  if (names.length !== uniqueNames.size) {
    failures.push("/r/index.json: contains duplicate item names");
  }

  const button = indexResponse.data.find((item) => item?.name === "button");
  if (button?.type !== "registry:ui") {
    failures.push("/r/index.json: missing the button registry:ui item");
  }
}

const buttonResponse = await fetchJson("/r/button.json");
if (buttonResponse.status !== 200) {
  failures.push(`/r/button.json: returned ${buttonResponse.status}`);
} else if (
  buttonResponse.data?.name !== "button" ||
  buttonResponse.data?.type !== "registry:ui"
) {
  failures.push("/r/button.json: returned an invalid button registry item");
}

const missingResponse = await fetchJson("/r/does-not-exist.json");
if (missingResponse.status !== 404) {
  failures.push(`/r/does-not-exist.json: returned ${missingResponse.status}`);
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  `Validated the registry index, item response, and missing-item response at ${baseUrl.href}`,
);
