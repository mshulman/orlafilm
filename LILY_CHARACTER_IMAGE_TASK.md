# Task: Update Character Image for Lily (Family Living Room)

## 1. Overview & Context

In the indie drama film **Orla**, **Lily** is the 2.5-year-old younger sister of Orla and daughter of Dad. She represents the gentle, innocent bridge holding the fractured family together following the mother's death.

- **Current Image**: `images/character_lily.jpg` (currently depicts Lily on a beach at the water's edge).
- **Goal**: Relocate Lily into the domestic family living room playing with toddler Duplo building blocks on the floor.

---

## 2. Creative & Visual Specifications

| Attribute | Specification |
| :--- | :--- |
| **Character** | Lily (2.5 years old). Sweet expressive face, gentle brown eyes, rosy cheeks, shoulder-length wavy/curly dark brown hair matching her mother (`images/orlas_mum.jpg`) and sister. |
| **Attire** | Casual, modest toddler clothing: soft cream-colored knit cotton sweater layered under blue denim dungarees (or similar comfortable playwear). |
| **Action & Pose** | Sitting comfortably on the floor / cozy area rug, happily engrossed and absorbed in solo play, carefully stacking large chunky toddler building blocks. |
| **Props (Blocks)** | Chunky toddler Duplo-style building bricks (oversized plastic blocks with large circular studs in bright primary colors: red, yellow, blue, green; distinctly larger than standard small Lego pieces). |
| **Setting** | Modest, lived-in British family home living room. Soft morning natural daylight streaming in through open-curtained windows. |
| **Background Detail** | In the background on a modest fabric sofa sits a neat pile / basket of folded family laundry (a subtle, poignant nod to the widowed father maintaining home life). |
| **Cinematography & Style** | 35mm film still, warm indie cinema color grading, natural daylight, soft shallow depth of field (sharp focus on Lily and her blocks, background gently blurred), subtle film grain. Cohesive with `images/orlas_dad.jpg` and `images/orlas_mum.jpg`. |
| **Aspect Ratio** | 1:1 Square (target display: 400x400 px). |

---

## 3. Recommended Generation Prompt

```text
Cinematic 35mm film still of Lily, an adorable 2.5-year-old toddler girl with shoulder-length wavy curly dark brown hair, a sweet expressive face, gentle brown eyes, and rosy cheeks. She is sitting comfortably on a soft woven rug on the floor of a modest, lived-in British family home living room. She is completely absorbed and happily playing solo, carefully stacking chunky colorful toddler plastic building blocks with large studs in bright primary red, blue, green, and yellow into a small tower. She wears a cozy cream knit cotton long-sleeve sweater and classic blue denim toddler dungarees. In the background, warm natural daylight streams softly through an open-curtained window onto the room. Behind her, resting on a modest fabric sofa, is a neat pile of folded family laundry. Photorealistic, authentic 35mm film still aesthetics, naturalistic warm color grading, subtle film grain, shallow depth of field focusing sharply on Lily and her blocks with a soft blurred background. 1:1 square aspect ratio.
```

> **Note on Prompting**: Avoid registered brand names like "Duplo" or "Lego" in raw API prompts to prevent triggering automated safety/trademark filters. Use descriptive equivalents such as *"chunky colorful toddler plastic building blocks with oversized studs"*.

---

## 4. Implementation Steps in the Codebase

### Step 1: Save & Optimize the Asset
1. Back up the original file if desired (`images/originals_backup/character_lily.jpg`).
2. Save the new square image to `images/character_lily.jpg` (or save as `images/character_lily_new.jpg` and overwrite `images/character_lily.jpg`).
3. Ensure the image is optimized (JPEG, sRGB profile, square aspect ratio, around 400×400 to 800×800 px).

### Step 2: Update `index.html`
In `index.html`, locate the **Character: Lily** card (around lines 528–545):

```html
<!-- Character: Lily -->
<div class="character-card" tabindex="0" role="button" aria-label="Lily – click or hover to read bio">
  <div class="character-card-inner">
    <div class="character-card-front">
      <div class="character-img-wrapper">
        <img src="images/character_lily.jpg?v=16" alt="Orla's 2.5-year-old sister Lily happily playing with colorful building blocks on the living room floor with folded laundry on the couch behind her" class="character-img" loading="lazy" decoding="async" width="400" height="400">
      </div>
      <div class="character-info">
        <h3 class="character-name">Lily</h3>
      </div>
    </div>
    <div class="character-card-back">
      <h3 class="character-back-name">Lily</h3>
      <div class="character-back-divider"></div>
      <p class="character-back-bio">Lily is the gentle bridge between Orla and Dad. While sister and father remain painfully at odds, their shared devotion to Lily is the one bond that still holds the fractured family together.</p>
    </div>
  </div>
</div>
```

- **Cache-Buster**: Increment the `?v=` parameter on `src="images/character_lily.jpg?v=..."` (e.g., from `?v=15` to `?v=16`).
- **Alt Text**: Update `alt` text to accurately reflect the new living room and blocks scene.

### Step 3: Update Static Footer Timestamp (Mandatory per AGENTS.md)
Update the UTC datetime in `index.html` footer:
```html
<!-- NOTE FOR FUTURE AGENTS: Because this page is static, ALWAYS update the last-updated timestamp below to the current UTC datetime when saving changes to index.html -->
<p class="last-updated-text">Last updated: YYYY-MM-DD HH:MM:SS UTC</p>
```

---

## 5. Automated Verification (Mandatory)

Per project guidelines in `AGENTS.md`, after modifying `index.html` or image files in `images/`:

```bash
./test_images.sh
```
Or:
```bash
python3 test_images.py
```

Verify that all image assets return HTTP 200 with zero errors.

---

## 6. Known Upstream API Status Note

On October 14, 2026, upstream calls to `generate_image` experienced intermittent `500 Internal Server Error: {"error": {"code": 500, "message": "Internal error encountered.", "status": "INTERNAL"}}` due to Google AI Studio / Imagen backend worker cluster issues. If you encounter this, wait a short period or use an alternative image generation endpoint.
