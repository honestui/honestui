"use client";
// HonestAI component contracts, adapted for Honest AI. MIT; see ../LICENSE.
import { z } from "zod/v4";
import { Button } from "../Button";

export const ButtonsSchema = z.object({
  buttons: z.array(Button.ref),
  direction: z.enum(["row", "column"]).optional(),
});
