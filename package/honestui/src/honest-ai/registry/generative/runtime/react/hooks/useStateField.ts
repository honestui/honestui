// Copyright (c) 2011-2024 Thesys Inc. MIT; see the generative source LICENSE.
import {
  resolveStateField,
  type InferStateFieldValue,
  type StateField,
} from "../../core/index";
import { useFormName, useHonestAI } from "../context";

export function useStateField<T = unknown>(
  name: string,
  value?: T,
): StateField<InferStateFieldValue<T>> {
  const ctx = useHonestAI();
  const formName = useFormName();

  return resolveStateField<InferStateFieldValue<T>>(
    name,
    value,
    ctx.store ?? null,
    ctx.evaluationContext ?? null,
    (fieldName) => ctx.getFieldValue(formName, fieldName),
    (fieldName, nextValue) => ctx.setFieldValue(formName, undefined, fieldName, nextValue),
  );
}
