import { describe, expect, test } from "vitest";
import { USP_CAMPUSES_CENTRES } from "@/lib/jobs/job-constants";
import { acceptsNationalInput, CAMPUS_COUNTRIES, PHONE_PLANS, campusPhoneCountry, canonicalPhone, phoneEditorState, phoneForCampusChange, phoneLengthMessage, resolvePhonePlan, validateProfilePhone } from "@/lib/profile/phone";

const fiji = ["Laucala Campus"];

describe("Campus phone metadata and validation", () => {
  test("covers exactly every canonical campus and all country metadata", () => {
    expect(Object.keys(CAMPUS_COUNTRIES).sort()).toEqual([...USP_CAMPUSES_CENTRES].sort());
    expect(new Set(Object.values(CAMPUS_COUNTRIES))).toEqual(new Set(Object.keys(PHONE_PLANS)));
    for (const campus of USP_CAMPUSES_CENTRES) {
      const plan = resolvePhonePlan([campus]);
      expect(plan, campus).toBeDefined();
      expect(plan!.callingCode).toMatch(/^\+[0-9]+$/);
      expect(plan!.nationalLengths.length).toBeGreaterThan(0);
      expect(plan!.source).toMatch(/^https:\/\/www.itu.int\//);
    }
  });

  test("resolves explicit countries, legacy aliases and rejects unknown campus names", () => {
    expect(resolvePhonePlan(fiji)).toBe(PHONE_PLANS.FJ);
    expect(resolvePhonePlan(["Laucala"])).toBe(PHONE_PLANS.FJ);
    expect(resolvePhonePlan(["Naoero Campus"])).toBe(PHONE_PLANS.NR);
    expect(campusPhoneCountry("Invented Fiji Campus")).toBeUndefined();
    expect(campusPhoneCountry("toString")).toBeUndefined();
    expect(validateProfilePhone("+6791234567", ["Invented Fiji Campus"])).toContain("supported");
    expect(validateProfilePhone("+6791234567", [...fiji, "Samoa Campus"])).toContain("same country");
    expect(resolvePhonePlan([...fiji, "Lautoka Campus"])).toBe(PHONE_PLANS.FJ);
  });

  test("Fiji requires its country code and exactly seven ASCII national digits", () => {
    expect(validateProfilePhone("+6791234567", fiji)).toBeUndefined();
    expect(validateProfilePhone("+6790123456", fiji)).toBeUndefined();
    for (const phone of ["+6851234567", "1234567", "6791234567", "+679123456", "+67912345678", "+6791"]) {
      expect(validateProfilePhone(phone, fiji), phone).toBeDefined();
    }
    expect(validateProfilePhone("+679123456", fiji)).toBe("Fiji phone numbers must contain 7 digits after +679.");
    for (const national of ["123 4567", "123-4567", "(1234567)", "+1234567", "123a567", "１２３４５６７", "١٢٣٤٥٦٧", "1234567\n"]) {
      expect(validateProfilePhone(`+679${national}`, fiji), national).toBe("Phone number can contain digits only.");
    }
  });

  test("requires a campus but permits an omitted phone or the expected prefix alone", () => {
    expect(validateProfilePhone("+6791234567", [])).toBe("Select your Campus/Centre before entering a phone number.");
    expect(validateProfilePhone("", [])).toBeDefined();
    expect(validateProfilePhone("", fiji)).toBeUndefined();
    expect(validateProfilePhone("+679", fiji)).toBeUndefined();
    expect(validateProfilePhone("+685", fiji)).toBeDefined();
  });

  test("checks every permitted length and rejects every gap for every campus", () => {
    for (const campus of USP_CAMPUSES_CENTRES) {
      const plan = resolvePhonePlan([campus])!;
      expect(validateProfilePhone("", [campus])).toBeUndefined();
      expect(validateProfilePhone(plan.callingCode, [campus])).toBeUndefined();
      for (let length = 1; length <= Math.max(...plan.nationalLengths) + 1; length++) {
        const phone = plan.callingCode + "1".repeat(length);
        expect(validateProfilePhone(phone, [campus]) === undefined, `${campus}: ${length}`).toBe(plan.nationalLengths.includes(length));
      }
      for (const other of Object.values(PHONE_PLANS)) {
        if (other.callingCode !== plan.callingCode) {
          expect(validateProfilePhone(other.callingCode + "1".repeat(plan.nationalLengths[0]), [campus])).toBeDefined();
        }
      }
    }
  });

  test("variable-length messages describe permitted lengths without accepting gaps", () => {
    expect(phoneLengthMessage(PHONE_PLANS.NU)).toContain("4 or 7 digits");
    expect(validateProfilePhone("+68312345", ["Niue Campus"])).toBeDefined();
    expect(validateProfilePhone("+676123456", ["Tonga Campus"])).toBeDefined();
    expect(PHONE_PLANS.TK.nationalLengths).toEqual([4, 5, 6, 7]);
    expect(PHONE_PLANS.TV.nationalLengths).toEqual([5, 6, 7]);
  });
});

describe.each(["onboarding", "profile editing"])("%s shared phone-field state", () => {
  test("campus enables the field, locks the prefix and limits digits", () => {
    expect(phoneEditorState("", [])).toMatchObject({ disabled: true, plan: undefined, national: "" });
    const state = phoneEditorState("", fiji);
    expect(state).toMatchObject({ disabled: false, maxLength: 7, plan: { callingCode: "+679" } });
    expect(acceptsNationalInput("1234567", state.maxLength!)).toBe(true);
    for (const value of ["12345678", "+6791234567", "1e5", "123 456", "12-3456", "(123)", "abc", "１２３"]) {
      expect(acceptsNationalInput(value, state.maxLength!), value).toBe(false);
    }
    expect(acceptsNationalInput("", state.maxLength!)).toBe(true);
  });

  test("parses existing canonical numbers without duplicating the prefix", () => {
    const state = phoneEditorState("+6790123456", fiji);
    expect(state.national).toBe("0123456");
    expect(state.error).toBeUndefined();
    expect(canonicalPhone(state.national, state.plan!)).toBe("+6790123456");
    expect(canonicalPhone("", state.plan!)).toBe("");
  });

  test("same-country campus changes preserve numbers; different countries clear them", () => {
    const phone = "+6791234567";
    expect(phoneForCampusChange(phone, fiji, ["Lautoka Campus"])).toBe(phone);
    const next = ["Samoa Campus"];
    const changed = phoneForCampusChange(phone, fiji, next);
    expect(changed).toBe("");
    expect(phoneEditorState(changed, next).plan?.callingCode).toBe("+685");
    expect(validateProfilePhone(changed, next)).toBeUndefined();
    expect(phoneForCampusChange(phone, fiji, [])).toBe("");
  });

  test("empty phones stay valid across campus changes and existing numbers can be removed", () => {
    for (const next of [["Lautoka Campus"], ["Samoa Campus"]]) {
      expect(phoneForCampusChange("", fiji, next)).toBe("");
      expect(validateProfilePhone("", next)).toBeUndefined();
    }
    const state = phoneEditorState("+6791234567", fiji);
    const removed = canonicalPhone("", state.plan!);
    expect(removed).toBe("");
    expect(validateProfilePhone(removed, fiji)).toBeUndefined();
    expect(phoneEditorState(removed, fiji)).toMatchObject({ national: "", error: undefined });
  });

  test("retains mismatched/unformatted legacy data and requires correction", () => {
    for (const phone of ["+6851234567", "1234567", "+67912-34567"]) {
      const state = phoneEditorState(phone, fiji);
      expect(state.legacyValue).toBe(phone);
      expect(state.national).toBe("");
      expect(state.error).toBeDefined();
      expect(phoneForCampusChange(phone, fiji, ["Labasa Campus"])).toBe(phone);
    }
    expect(phoneEditorState("+67912345678", fiji)).toMatchObject({ national: "12345678", error: expect.any(String) });
    expect(phoneEditorState("+6791234567", fiji).error).toBeUndefined();
  });
});
