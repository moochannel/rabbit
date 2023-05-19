/**
 * This file is licensed under MIT license, not AGPL.
 *
 * Copyright (c) 2023 Syusui Moyatani
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import uniqBy from 'lodash/uniqBy';
import { z } from 'zod';

export const pubkeySchema = z
  .string()
  .length(64)
  .regex(/^[0-9a-f]{64}$/);

export const shortcodeSchema = z.string().regex(/^\w+$/);

export const emojiSchema = z.object({
  shortcode: shortcodeSchema,
  url: z.string().url(),
  keywords: z.optional(z.array(shortcodeSchema)),
});

export const emojiPackSchemaV1 = z
  .object({
    manifest: z.literal('emojipack_v1'),
    name: z.string(),
    emojis: z.array(emojiSchema),
    description: z.optional(z.string()),
    author: z.optional(pubkeySchema),
    publisher: z.optional(pubkeySchema),
  })
  .refine(
    (emojiPack) => {
      // check uniqueness of shortcodes
      const uniqEmojis = uniqBy(emojiPack.emojis, (emoji) => emoji.shortcode).length;
      return uniqEmojis === emojiPack.emojis.length;
    },
    { message: 'shortcodes should be unique' },
  );

export const simpleEmojiPackSchema = z.record(shortcodeSchema, z.string().url());

export const allEmojiPackSchema = emojiPackSchemaV1.or(simpleEmojiPackSchema);

export type Emoji = z.infer<typeof emojiSchema>;

export type EmojiPackV1 = z.infer<typeof emojiPackSchemaV1>;

export type SimpleEmojiPack = z.infer<typeof simpleEmojiPackSchema>;

export type AllEmojiPack = z.infer<typeof allEmojiPackSchema>;

export const getEmojiPack = async (urlString: string): Promise<AllEmojiPack> => {
  const url = new URL(urlString);
  const res = await fetch(url);
  return allEmojiPackSchema.parseAsync(await res.json());
};
