# Campus-dependent Member phone numbers

Verified on 22 October 2026 against the latest country submissions linked by the
[ITU national numbering-plan directory](https://www.itu.int/oth/t0202).
Campus locations were cross-checked with the
[USP campus directory](https://www.usp.ac.fj/care7/inform/).
The application's options remain `USP_CAMPUSES_CENTRES` in `lib/jobs/job-constants.ts`.
`CAMPUS_COUNTRIES` adds exhaustive metadata to those options; it does not supply a second selection list.

| Country/territory | Canonical Campus/Centre options | Calling code | National digits | Authority / latest submission |
| --- | --- | --- | --- | --- |
| Fiji | Laucala Campus; Lautoka Campus; Labasa Campus; Savusavu Centre | +679 | 7 | [ITU / Fiji](https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000480001MSWE.doc), published 11 Sep 2008; uniform seven-digit plan effective 25 Mar 2002 |
| Cook Islands | Cook Islands Campus | +682 | 5 | [ITU / Telecom Cook Islands](https://www.itu.int/dms_pub/itu-t/oth/02/02/T020200002F0001MSWE.doc), 9 Mar 2006 |
| Vanuatu | Emalus Campus; Santo Centre; Tafea Centre; Malampa Centre; Torba Centre | +678 | 5, 6, 7 | [ITU / TRBR](https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000E20007PDFE.pdf), 19 Oct 2021 and consolidated earlier allocations |
| Kiribati | Kiribati Campus | +686 | 8 | [ITU / CCK](https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000710005PDFE.pdf), 15 Mar 2019 and 27 Jun 2017 |
| Marshall Islands | Marshall Islands Campus | +692 | 7 | [ITU / MINTA](https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000850001MSWE.doc), 8 Jul 2009 |
| Nauru | Naoero Campus | +674 | 7 | [ITU / Ministry of Transport & Telecommunications](https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000940001MSWE.doc), 24 Apr and 5 Sep 2009 |
| Niue | Niue Campus | +683 | 4, 7 | [ITU / Telecom Niue](https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000EC0003PDFE.pdf), 31 Aug 2023 |
| Samoa | Samoa Campus | +685 | 5, 6, 7 | [ITU / Office of the Regulator](https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000B40001MSWE.doc), 28 Sep 2009 |
| Solomon Islands | Solomon Islands Campus; Gizo Centre; Lata Centre | +677 | 5, 7 | [ITU / TCSI](https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000BF0006PDFE.pdf), 6 Mar 2024 and consolidated allocations |
| Tokelau | Tokelau Campus | +690 | 4, 5, 6, 7 | [ITU / Teletok](https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000D20003PDFE.pdf), 6 Dec 2015 |
| Tonga | Tonga Campus; Ha'apai Centre; Vava'u Centre | +676 | 5, 7 | [ITU / MEIDECC](https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000D30005PDFE.pdf), 12 Dec 2023 |
| Tuvalu | Tuvalu Campus | +688 | 5, 6, 7 | [ITU / TTC](https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000D90003PDFE.pdf), 2 Feb 2018 |

## Interpretation and compatibility

- This is validation of country code and digit count, not carrier-prefix allocation or proof a number is active. Phone values remain strings, including leading zeros.
- Member contact numbers exclude emergency, operator, SMS-only and other short codes. Vanuatu's six-digit toll-free services are included, alongside five-digit fixed and seven-digit mobile/VoIP numbers.
- Kiribati's old five-digit numbers migrated to eight digits; the documented parallel period ended in July 2018. Historical tables in the consolidated submission are not current five-digit allocations.
- The Marshall Islands Word submission specifies seven digits for subscriber ranges, including outer-atoll mobile ranges. Its four-digit voicemail access codes are not subscriber numbers. Some third-party summaries disagree; the implementation follows the primary ITU document.
- Niue's 2023 plan has active four-digit PSTN/2G allocations and seven-digit LTE allocations; five- and six-digit numbers are not accepted.
- Samoa's ITU plan includes five-digit fixed, six-digit wireless local loop/custom services, and seven-digit mobile/wireless fixed numbers. The regulator's later policy PDF returned 404 during verification. No unverified ten-digit allocation has been inferred from third-party summaries.
- Tokelau explicitly publishes minimum four and maximum seven digits for its geographic and non-geographic service groups. All four lengths are allowed, rather than assuming a single length from examples.
- Tonga permits five-digit fixed and seven-digit mobile/other subscriber services. Tuvalu has five-digit fixed, six-digit 2G, and seven-digit 3G/LTE numbers. Solomon Islands has five-digit fixed and seven-digit mobile numbers.
- The existing legacy campus-name normalizer is reused. Unknown campus names are rejected. The UI selects one campus; existing same-country arrays remain supported, while mixed-country arrays are rejected as ambiguous.
- Phone is optional; Campus/Centre remains required. Empty phone values and the expected country prefix without national digits normalize to an empty string in the shared save schema and save as `null`. Wrong prefixes and non-empty invalid national portions remain rejected. Existing database data is never migrated or rewritten on load.

## Implementation and verification

`phone.ts` is shared by the Zod save schema and `PhoneField`, which is used by the
existing `GeneralFields` in onboarding and profile editing. The existing `PUT
/api/profile` already parses this schema before any database access. No route,
database model, relationship, or migration changes are needed.

Before campus selection there is no prefix and phone is disabled. The prefix is
visible non-editable text after selection. Only ASCII national digits enter form
state, with dynamic maximum length. Same-country changes preserve the value;
different-country changes clear it; leaving the result empty is valid. Canonical values such as
`+6790123456` save to the existing Prisma `String?` field as strings.

Mismatched or unformatted legacy values remain in form state and are shown
separately, with a contextual error; no guessed prefix is attached. Matching
canonical numbers split into prefix and national digits without duplication.
Correcting the input clears errors immediately. Accessible label, prefix
description, disabled helper, and associated live error messages are included.

Automated coverage:

- `phone.test.ts`: exact canonical campus coverage; metadata; every permitted length and gap; wrong codes; ASCII characters; required campus and optional phone; canonical values; editing and legacy parsing; same/different-country transitions and removing phones.
- `profile-schema.test.ts`: optional empty/prefix-only values, country-dependent canonical phone values and supported campus validation.
- `profile-route.test.ts`: tampered requests fail before database access; every campus/length succeeds; create/update preserve strings/leading zeros; legacy campus aliases normalize.
- `scripts/verify-profile-phone-browser.mjs`: actual shared React fields, resolver and built app CSS in an isolated local harness, using Chrome/Edge DevTools. Run from the repository root after `pnpm build` with `node scripts/verify-profile-phone-browser.mjs`. Uses existing `tsx`/esbuild tooling; no extra package installation. Optionally set `PHONE_TEST_BROWSER` to a Chromium executable. Results and a 390px screenshot are saved to a printed temporary directory.

Browser verification passed at 1440, 1366, 1280, 1024, 834, 768, 430, 390 and 375px
in light and dark themes for onboarding, valid editing and legacy mismatch states
(54 layout checks). Checks assert no page overflow, visible prefix, usable input,
label/error association, plus real selection and typing behavior. This harness
does not log into the full application or emulate physical mobile keyboards.
Keyboard Tab from phone to Bio also passed; the locked prefix is not an extra tab stop.

Final checks on `feature/demo-polish`:

- `pnpm test`: 11 files passed; 86 tests passed, 5 skipped. Before the optional-phone adjustment: 81 passed, 5 skipped. The skipped tests were already skipped before this change.
- `pnpm lint`: exit 0; only the same three pre-existing unused-variable warnings in `lib/applications/application-schema.ts` (lines 120, 124, 135). No new warnings.
- `pnpm typecheck`: passed.
- `pnpm build`: passed, including Prisma client generation and all 17 static pages. No database push or migration was run.
- `git diff --check`: passed.
- Browser harness: all 54 layout checks and phone interaction/keyboard checks passed, including submitting an empty phone, changing country with an empty phone, removing an existing phone and adding it again.
- All changes remain unstaged. Nothing was committed or pushed.

Changed files:

- `lib/profile/phone.ts` (shared mapping, validation, formatting, parsing, transitions)
- `components/profile/phone-field.tsx` (shared accessible input)
- `components/profile/general-fields.tsx` (campus first; shared phone field and campus transitions)
- `components/profile/onboarding-form.tsx` and `components/profile/update-profile-form.tsx` (immediate validation)
- `components/ui/form-field.tsx` (stable error IDs for field association)
- `lib/profile/profile-schema.ts` (server/client enforcement and campus normalization)
- `lib/profile/to-profile-input.ts` (normalize legacy campus names when opening the editor)
- `lib/profile/profile-schema.test.ts`, `lib/profile/phone.test.ts`, `lib/profile/profile-route.test.ts` (automated tests)
- `scripts/verify-profile-phone-browser.mjs` (repeatable browser checks)
- `lib/profile/phone-number-rules.md` (this review/source document)

## Manual review

1. On a first-time Member account, confirm phone is disabled without a campus and has no default calling code. Keyboard-select Laucala Campus, enter six digits, then seven; check the error clears, and an eighth digit cannot enter.
2. Attempt letters, `+`, spaces, hyphens, brackets and formatted/full-number pastes; they must not become national digits. Confirm a mobile device offers an appropriate digit keyboard.
3. Change to Lautoka Campus and confirm the valid Fiji number stays. Change to Samoa Campus and confirm the locked code changes to +685 and national digits clear. Saving with no phone remains valid; entering any digits activates the country-specific length validation.
4. Save, reopen Profile editing and verify the canonical prefix appears once and leading zeros survive. Repeat same/different-country changes in the actual profile modal.
5. With an existing mismatched/unformatted legacy phone, verify the stored value and error are visible, saving fails, and entering a correct number replaces it only on save. Do not modify database-wide data.
6. Try both lengths for Niue/Tonga/Solomon Islands, all three for Tuvalu/Vanuatu/Samoa and four through seven for Tokelau. Gaps such as six digits for Tonga and five/six for Niue must fail.
7. Check the actual onboarding page and edit modal at all nine widths in both themes; confirm wrapping errors, visible prefix, focus and keyboard access. Check screen-reader announcement of the country prefix and error.
8. Modify an authenticated profile HTTP request to use an unknown campus, wrong calling code, invalid characters or too many digits; expect HTTP 400 and no saved changes.
