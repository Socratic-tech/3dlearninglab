# Model licensing

Every downloadable model is a `ModelAsset` record (`src/content/models.ts`) with creator, source, license, version,
attribution/commercial/remix flags, `sourceVerifiedAt`, purpose, lessons and attribution text. `/attributions` is generated from it.

- **Original assets** (19 STLs) are generated from editable source: `npm run models:generate`
  (`scripts/generate-models.ts`, three.js + three-bvh-csg). Default license **CC BY 4.0**; change `ORIGINAL_ASSET_LICENSE`
  to `CC0-1.0` before publication if preferred. Every *required* lesson file is an original asset.
- **External assets** (Printables diagnostic models listed in the product brief) are recorded with the license the
  brief reports, `sourceVerifiedAt: null`, and **no local file**: the UI links to the source page and labels the license
  “as listed — not yet verified”. Their Printables pages render licenses client-side, so they could not be verified
  automatically (checked 2026-10-02). Three (ViceroySyrup, morejoncarlos, ly keosovandara) have no source URL yet.
- To bundle one: confirm the license on the source page, download the original file to `public/models/external/`,
  set `localFilePath` and `sourceVerifiedAt`. A test fails if an external asset is bundled without verification.
- Never bundle All-Rights-Reserved, unclear, non-redistributable, commercial-product copies or copyrighted characters.
