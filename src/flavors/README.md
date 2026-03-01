# Flavors Module

Flavors adapt Factur-X output for different countries and platforms.

## Supported Flavors

| Flavor         | Region      | Notes                                       |
| -------------- | ----------- | ------------------------------------------- |
| **factur-x**   | France / EU | Default; Factur-X 1.08                      |
| **zugferd**    | Germany     | ZUGFeRD 2.4 = Factur-X 1.08 (same schemas) |
| **xrechnung**  | Germany B2G | Pure CII XML for government portals         |
| **chrono-pro** | Belgium     | Chrono Pro platform conventions              |

## Differences

- **Document type code:** All flavors default to 380 (Commercial invoice). See [PROFILES_AND_FLAVORS.md](../../docs/PROFILES_AND_FLAVORS.md) for the full type code acceptance matrix per flavor.
- **Business process URN:** XRechnung always injects `urn:fdc:peppol.eu:2017:poacc:billing:01:1.0` unless a custom `businessProcessId` is provided.
- **AF Relationship:** MINIMUM/BASIC_WL use `Data`, BASIC+ use `Alternative`.

## Extending

To add a new flavor, extend `Flavor` in `constants.ts` and add a corresponding entry to `FLAVOR_CONFIGS` in `registry.ts`.
